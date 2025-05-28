import { NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';

interface Publication {
  title: string;
  authors: string;
  year: string;
  citations: number;
}

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

// List of common user agents to rotate
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15'
];

// Get a random user agent
const getRandomUserAgent = () => {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
};

// Sleep function for retry delays
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Function to fetch with retries
async function fetchWithRetry(url: string, retryCount = 0): Promise<any> {
  try {
    const userAgent = getRandomUserAgent();
    const response = await axios.get(url, {
      headers: {
        'User-Agent': userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Cache-Control': 'max-age=0',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'DNT': '1'
      },
      timeout: 10000,
      // Add proxy configuration if available
      proxy: process.env.HTTP_PROXY && process.env.PROXY_HOST ? {
        host: process.env.PROXY_HOST,
        port: parseInt(process.env.PROXY_PORT || '80'),
        auth: process.env.PROXY_AUTH ? {
          username: process.env.PROXY_USERNAME || '',
          password: process.env.PROXY_PASSWORD || ''
        } : undefined
      } : undefined
    });

    return response;
  } catch (error: any) {
    if (retryCount < MAX_RETRIES) {
      const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
      console.log(`Retry attempt ${retryCount + 1} after ${delay}ms`);
      await sleep(delay);
      return fetchWithRetry(url, retryCount + 1);
    }
    throw error;
  }
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

    // Fetch the profile page with retry logic
    const response = await fetchWithRetry(url);

    if (!response.data) {
      throw new Error('Empty response from Google Scholar');
    }

    const $ = cheerio.load(response.data);

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
    });
  } catch (error: any) {
    console.error('Error scraping Google Scholar profile:', error);
    
    // More specific error messages
    if (error.response) {
      if (error.response.status === 403) {
        return NextResponse.json(
          { error: 'Access to Google Scholar was blocked. Please try again later or use a different network.' },
          { status: 403 }
        );
      }
      if (error.response.status === 429) {
        return NextResponse.json(
          { error: 'Too many requests to Google Scholar. Please try again in a few minutes.' },
          { status: 429 }
        );
      }
      return NextResponse.json(
        { error: `Google Scholar returned an error: ${error.response.status}` },
        { status: error.response.status }
      );
    }
    
    if (error.code === 'ECONNABORTED') {
      return NextResponse.json(
        { error: 'Request to Google Scholar timed out. Please try again.' },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to fetch Google Scholar profile' },
      { status: 500 }
    );
  }
} 