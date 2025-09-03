import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

// Single user agent to avoid appearing as an attack
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// Generate realistic browser headers
function getBrowserHeaders() {
  return {
    'User-Agent': USER_AGENT,
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

// Simple fetch function - try once with proper headers
async function fetchWithHeaders(fullUrl: string) {
  const headers = getBrowserHeaders();
  
  const response = await fetch(fullUrl, {
    headers,
    redirect: 'follow',
    signal: AbortSignal.timeout(10000) // 10 second timeout
  });

  return response;
}

// Puppeteer fallback for heavily protected sites
async function scrapeWithPuppeteer(fullUrl: string) {
  console.log('Starting Puppeteer with URL:', fullUrl);
  let browser;
  try {
    // Use environment detection like in the Vercel guide
    const isVercel = !!process.env.VERCEL_ENV;
    console.log('Environment - isVercel:', isVercel);
    let puppeteer: any;
    let launchOptions: any = {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-features=VizDisplayCompositor',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-field-trial-config',
        '--disable-background-networking',
        '--disable-client-side-phishing-detection',
        '--disable-sync',
        '--disable-translate',
        '--disable-ipc-flooding-protection'
      ]
    };

    if (isVercel) {
      // Use Sparticuz Chromium for production/Vercel
      console.log('Loading Sparticuz Chromium for Vercel...');
      const chromium = (await import('@sparticuz/chromium')).default;
      puppeteer = await import('puppeteer-core');
      launchOptions = {
        ...launchOptions,
        args: [...launchOptions.args, ...chromium.args],
        executablePath: await chromium.executablePath(),
      };
      console.log('Vercel launch options:', launchOptions);
    } else {
      // Use regular puppeteer for development (it includes its own browser)
      console.log('Using regular puppeteer for development...');
      puppeteer = await import('puppeteer');
      console.log('Development launch options:', launchOptions);
    }

    console.log('Launching browser...');
    browser = await puppeteer.launch(launchOptions);
    console.log('Browser launched successfully');
    console.log('Creating new page...');
    const page = await browser.newPage();
    
    // Set user agent and viewport
    console.log('Setting user agent and viewport...');
    await page.setUserAgent(USER_AGENT);
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Set additional headers
    console.log('Setting extra headers...');
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8'
    });

    // Navigate with timeout
    console.log('Navigating to URL:', fullUrl);
    await page.goto(fullUrl, { 
      waitUntil: 'domcontentloaded',
      timeout: 20000 
    });
    console.log('Navigation completed');

    // Wait a bit for any dynamic content
    console.log('Waiting for dynamic content...');
    await page.waitForTimeout(1500);

    // Get the page content
    console.log('Getting page content...');
    const html = await page.content();
    console.log('Page content length:', html.length);
    
    await browser.close();
    console.log('Browser closed, returning HTML');
    return html;
    
  } catch (error) {
    if (browser) {
      await browser.close();
    }
    throw error;
  }
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

    // Try to fetch with proper headers
    let response;
    try {
      response = await fetchWithHeaders(fullUrl);
    } catch (error) {
      return NextResponse.json({ 
        error: 'Unable to access this website. It may be unreachable or have connection issues. Please check the URL and try again.',
        details: error instanceof Error ? error.message : 'Network error'
      }, { status: 400 });
    }

    let html;
    
    if (!response.ok) {
      // If we got blocked, try Puppeteer as a fallback
      if ([403, 429, 503].includes(response.status)) {
        try {
          console.log('Fetch blocked, trying Puppeteer fallback...');
          html = await scrapeWithPuppeteer(fullUrl);
          console.log('Puppeteer fallback succeeded');
        } catch (puppeteerError) {
          console.error('Puppeteer fallback failed:', puppeteerError);
          console.error('Puppeteer error details:', {
            message: puppeteerError instanceof Error ? puppeteerError.message : 'Unknown error',
            stack: puppeteerError instanceof Error ? puppeteerError.stack : null
          });
          
          let errorMessage = `Failed to fetch URL: ${response.status} ${response.statusText}`;
          
          if (response.status === 403) {
            errorMessage = 'Access denied - this website has bot protection that we cannot bypass.';
          } else if (response.status === 429) {
            errorMessage = 'Rate limited - this website is protecting against automated requests.';
          } else if (response.status === 503) {
            errorMessage = 'Service unavailable - this website may be using Cloudflare protection.';
          }
          
          return NextResponse.json({ 
            error: errorMessage,
            suggestion: 'Try accessing the website directly first, or try again later.',
            debug: puppeteerError instanceof Error ? puppeteerError.message : 'Unknown puppeteer error'
          }, { status: 400 });
        }
      } else {
        return NextResponse.json({ 
          error: `Failed to fetch URL: ${response.status} ${response.statusText}` 
        }, { status: 400 });
      }
    } else {
      html = await response.text();
    }
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