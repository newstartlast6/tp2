import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

// Multiple realistic user agents for rotation
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0'
];

// Get random user agent
function getRandomUserAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

// Generate realistic browser headers
function getBrowserHeaders(userAgent: string) {
  return {
    'User-Agent': userAgent,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'DNT': '1',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Cache-Control': 'max-age=0'
  };
}

// Enhanced fetch with retry logic
async function fetchWithRetry(fullUrl: string, maxRetries = 3) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const userAgent = getRandomUserAgent();
      const headers = getBrowserHeaders(userAgent);
      
      // Add some randomness between attempts
      if (attempt > 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
      
      const response = await fetch(fullUrl, {
        headers,
        redirect: 'follow',
        signal: AbortSignal.timeout(15000) // 15 second timeout
      });

      if (response.ok) {
        return response;
      }
      
      // If we get 403, 429, or 503, it might be bot protection
      if ([403, 429, 503].includes(response.status)) {
        lastError = new Error(`Bot protection detected (${response.status}): ${response.statusText}`);
        continue;
      }
      
      // For other errors, return the response to handle normally
      return response;
      
    } catch (error) {
      lastError = error;
      console.log(`Attempt ${attempt} failed:`, error);
      
      // If it's a timeout or network error, retry
      if (attempt < maxRetries) {
        continue;
      }
    }
  }
  
  throw lastError;
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Add protocol if missing
    let fullUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      fullUrl = `https://${url}`;
    }

    // Try to fetch with enhanced retry logic
    let response;
    try {
      response = await fetchWithRetry(fullUrl);
    } catch (error) {
      // If all retries failed, try a simpler approach
      console.log('Enhanced fetch failed, trying simple fetch:', error);
      
      try {
        response = await fetch(fullUrl, {
          headers: {
            'User-Agent': 'TractionPilot-Bot/1.0 (+https://tractionpilot.com/bot)'
          },
          redirect: 'follow',
          signal: AbortSignal.timeout(10000)
        });
      } catch (simpleError) {
        return NextResponse.json({ 
          error: 'Unable to access this website. It may have bot protection or be unreachable. Please check the URL or try a different site.',
          details: error instanceof Error ? error.message : 'Network error'
        }, { status: 400 });
      }
    }

    if (!response.ok) {
      let errorMessage = `Failed to fetch URL: ${response.status} ${response.statusText}`;
      
      if (response.status === 403) {
        errorMessage = 'Access denied - this website has bot protection enabled. Try accessing the site directly first.';
      } else if (response.status === 429) {
        errorMessage = 'Rate limited - this website is currently blocking automated requests. Please try again later.';
      } else if (response.status === 503) {
        errorMessage = 'Service unavailable - this website may be using Cloudflare or similar protection.';
      }
      
      return NextResponse.json({ 
        error: errorMessage 
      }, { status: 400 });
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract title
    let title = $('title').text().trim() || 
                $('h1').first().text().trim() || 
                $('meta[property="og:title"]').attr('content') || 
                'No title found';

    // Extract description
    let description = $('meta[name="description"]').attr('content') || 
                      $('meta[property="og:description"]').attr('content') || 
                      $('meta[name="twitter:description"]').attr('content') || 
                      $('p').first().text().trim().substring(0, 300) || 
                      'No description found';

    // Extract main content - look for common content containers
    const contentSelectors = [
      'main',
      '[role="main"]',
      '.main-content',
      '.content',
      'article',
      '.post-content',
      '.entry-content',
      '.page-content',
      'section'
    ];

    let content = '';
    for (const selector of contentSelectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        // Remove script and style tags
        element.find('script, style, nav, header, footer, aside').remove();
        content = element.text().trim();
        if (content && content.length > 100) {
          break;
        }
      }
    }

    // Fallback: get all paragraph content if no main content found
    if (!content || content.length < 100) {
      const paragraphs = $('p').map((_, el) => $(el).text().trim()).get();
      content = paragraphs.join(' ').substring(0, 1000);
    }

    // Clean up content
    content = content
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 2000) || 'No content found';

    // Clean up description
    description = description.substring(0, 500);

    return NextResponse.json({
      success: true,
      data: {
        url: fullUrl,
        title,
        description,
        content
      }
    });

  } catch (error) {
    console.error('Scraping error:', error);
    return NextResponse.json({ 
      error: 'Failed to scrape the webpage. Please check the URL and try again.' 
    }, { status: 500 });
  }
}