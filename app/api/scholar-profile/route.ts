import { NextResponse } from 'next/server';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

// CORS headers configuration
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

interface Publication {
  title: string;
  authors: string;
  year: string;
  citations: number;
}

// Function to fetch directly
async function fetchScholarProfile(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.text();
}

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url || !url.includes('scholar.google.com')) {
      return NextResponse.json(
        { error: 'Invalid Google Scholar URL' },
        { 
          status: 400,
          headers: corsHeaders
        }
      );
    }

    // Fetch the profile page directly
    const html = await fetchScholarProfile(url);
    const $ = cheerio.load(html);

    // Extract profile information
    const name = $('#gsc_prf_in').text().trim();
    if (!name) {
      throw new Error('Could not find profile name - the page structure might have changed or access was blocked');
    }

    const citationCount = parseInt($('#gsc_rsb_st tbody tr:nth-child(1) td:nth-child(2)').text().trim()) || 0;
    
    // Extract research interests
    const researchInterests = $('#gsc_prf_int')
      .text()
      .split(',')
      .map(interest => interest.trim())
      .filter(interest => interest.length > 0);

    // Extract publications
    const publications: Publication[] = [];
    $('.gsc_a_tr').each((_, element) => {
      const title = $(element).find('.gsc_a_t a').text().trim();
      const authors = $(element).find('.gs_gray').first().text().trim();
      const year = $(element).find('.gsc_a_y').text().trim();
      const citations = parseInt($(element).find('.gsc_a_c a').text().trim()) || 0;

      if (title) {
        publications.push({
          title,
          authors,
          year,
          citations,
        });
      }
    });

    return NextResponse.json({
      name,
      citationCount,
      researchInterests,
      publications,
    }, {
      headers: corsHeaders
    });
  } catch (error: any) {
    console.error('Error fetching Google Scholar profile:', error);
    
    if (error.message.includes('403')) {
      return NextResponse.json(
        { error: 'Access to Google Scholar was blocked. Please try again later.' },
        { 
          status: 403,
          headers: corsHeaders
        }
      );
    }

    if (error.message.includes('timeout')) {
      return NextResponse.json(
        { error: 'Request timed out. Please try again.' },
        { 
          status: 504,
          headers: corsHeaders
        }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to fetch Google Scholar profile' },
      { 
        status: 500,
        headers: corsHeaders
      }
    );
  }
} 