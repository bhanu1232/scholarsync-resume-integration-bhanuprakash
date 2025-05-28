import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
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

// Sleep function for delays
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Function to fetch with Puppeteer
async function fetchWithPuppeteer(url: string): Promise<string> {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu',
      '--window-size=1920x1080',
    ],
  });

  try {
    const page = await browser.newPage();
    
    // Set a realistic viewport
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Set user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Set extra headers
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    });

    // Add random delay before navigation
    await sleep(Math.random() * 2000 + 1000);

    // Navigate to the page
    await page.goto(url, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });

    // Add random delay after page load
    await sleep(Math.random() * 2000 + 1000);

    // Get the page content
    const content = await page.content();
    return content;
  } finally {
    await browser.close();
  }
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

    // Fetch the profile page with Puppeteer
    const html = await fetchWithPuppeteer(url);
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
    console.error('Error scraping Google Scholar profile:', error);
    
    // More specific error messages
    if (error.message.includes('net::ERR_CONNECTION_REFUSED') || 
        error.message.includes('net::ERR_CONNECTION_TIMED_OUT')) {
      return NextResponse.json(
        { error: 'Connection to Google Scholar failed. Please try again later.' },
        { 
          status: 503,
          headers: corsHeaders
        }
      );
    }

    if (error.message.includes('net::ERR_ABORTED')) {
      return NextResponse.json(
        { error: 'Request was blocked. Please try again later or use a different network.' },
        { 
          status: 403,
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