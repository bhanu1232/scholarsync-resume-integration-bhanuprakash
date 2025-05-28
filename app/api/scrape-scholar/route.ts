import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url || !url.includes('scholar.google.com')) {
      return NextResponse.json(
        { error: 'Invalid Google Scholar URL' },
        { status: 400 }
      );
    }

    // Fetch the profile page
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch profile: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract name
    const name = $('#gsc_prf_in').text().trim();

    // Extract research interests
    const researchInterests = $('#gsc_prf_int')
      .find('a')
      .map((_: number, el: any) => $(el).text().trim())
      .get();

    // Extract citation count
    const citationCount = parseInt(
      $('#gsc_rsb_st tbody tr:first-child td:last-child').text().trim() || '0'
    );

    // Extract publications
    const publications = $('#gsc_a_b .gsc_a_tr')
      .map((_: number, row: any) => {
        const $row = $(row);
        const title = $row.find('.gsc_a_t a').text().trim();
        const authors = $row.find('.gsc_a_t .gs_gray').first().text().trim();
        const year = $row.find('.gsc_a_y').text().trim();
        const citations = parseInt($row.find('.gsc_a_c a').text().trim() || '0');

        return {
          title,
          authors,
          year,
          citations
        };
      })
      .get();

    return NextResponse.json({
      name,
      researchInterests,
      citationCount,
      publications
    });
  } catch (error: any) {
    console.error('Error scraping profile:', error);
    return NextResponse.json(
      { error: 'Failed to scrape profile data' },
      { status: 500 }
    );
  }
} 