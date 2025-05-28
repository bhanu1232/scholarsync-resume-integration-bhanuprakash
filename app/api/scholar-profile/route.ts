import { NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';

interface Publication {
  title: string;
  authors: string;
  year: string;
  citations: number;
}

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url || !url.includes('scholar.google.com')) {
      return NextResponse.json(
        { error: 'Invalid Google Scholar URL' },
        { status: 400 }
      );
    }

    // Fetch the profile page
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    const $ = cheerio.load(response.data);

    // Extract profile information
    const name = $('#gsc_prf_in').text().trim();
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
    });
  } catch (error: any) {
    console.error('Error scraping Google Scholar profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Google Scholar profile' },
      { status: 500 }
    );
  }
} 