import { NextResponse } from 'next/server';
import axios from 'axios';
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

// Rate limiting configuration
const RATE_LIMIT = {
  maxRequests: 1,
  timeWindow: 300000, // 5 minutes
  requests: new Map<string, number[]>()
};

// Function to check rate limit
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const userRequests = RATE_LIMIT.requests.get(ip) || [];
  
  // Remove old requests outside the time window
  const recentRequests = userRequests.filter(time => now - time < RATE_LIMIT.timeWindow);
  
  if (recentRequests.length >= RATE_LIMIT.maxRequests) {
    return false;
  }
  
  recentRequests.push(now);
  RATE_LIMIT.requests.set(ip, recentRequests);
  return true;
}

// Function to fetch with proxy
async function fetchWithProxy(url: string): Promise<string> {
  try {
    // Use a more reliable proxy service
    const proxyUrl = 'https://api.allorigins.win/raw?url=';
    const encodedUrl = encodeURIComponent(url);
    
    console.log('Attempting to fetch from:', url);
    
    const response = await axios.get(`${proxyUrl}${encodedUrl}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'DNT': '1',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1'
      },
      timeout: 60000, // 60 second timeout
      validateStatus: null, // Accept all status codes
      responseType: 'text', // Ensure we get text response
      maxRedirects: 5
    });

    console.log('Response status:', response.status);
    
    if (!response.data || typeof response.data !== 'string') {
      console.error('Invalid response data:', response.data);
      throw new Error('Invalid response from proxy service');
    }

    const html = response.data;

    // Check for blocking indicators
    if (html.includes('unusual traffic') || 
        html.includes('captcha') || 
        html.includes('Our systems have detected unusual traffic') ||
        html.includes('Please show you\'re not a robot')) {
      console.error('Access blocked by Google Scholar');
      throw new Error('Access blocked by Google Scholar');
    }

    return html;
  } catch (error: any) {
    console.error('Proxy fetch error:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });
    
    if (error.response?.status === 500) {
      throw new Error('Proxy service is currently unavailable. Please try again later.');
    }
    
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    
    // Check rate limit
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again in 5 minutes.' },
        { 
          status: 429,
          headers: corsHeaders
        }
      );
    }

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

    // Add delay between requests
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Fetch the profile page with proxy
    const html = await fetchWithProxy(url);
    const $ = cheerio.load(html);

    // Extract profile information
    const name = $('#gsc_prf_in').text().trim();
    if (!name) {
      console.error('Could not find profile name in HTML:', html.substring(0, 500));
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
    console.error('Error fetching Google Scholar profile:', {
      message: error.message,
      stack: error.stack
    });
    
    if (error.message.includes('blocked') || error.message.includes('403')) {
      return NextResponse.json(
        { error: 'Access to Google Scholar was blocked. Please try again in 10 minutes.' },
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

    if (error.message.includes('Proxy service is currently unavailable')) {
      return NextResponse.json(
        { error: 'Proxy service is currently unavailable. Please try again in a few minutes.' },
        { 
          status: 503,
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