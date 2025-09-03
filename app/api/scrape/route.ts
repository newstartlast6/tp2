import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';

// Multiple realistic user agents for rotation
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 Edg/119.0.0.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
];

// Get random user agent
function getRandomUserAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

// Generate realistic browser headers
function getBrowserHeaders() {
  return {
    'User-Agent': getRandomUserAgent(),
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

// Check if HTML content indicates a security checkpoint
function isSecurityCheckpoint(html: string, title: string): { isCheckpoint: boolean; type: string; message: string } {
  const lowerHtml = html.toLowerCase();
  const lowerTitle = title.toLowerCase();
  
  // Common security checkpoint indicators
  const checkpoints = [
    {
      patterns: ['vercel security checkpoint', 'failed to verify your browser', 'code 21'],
      type: 'Vercel Security',
      message: 'This website uses Vercel\'s security protection that blocks automated access. Try visiting the site directly in your browser first.'
    },
    {
      patterns: ['cloudflare', 'checking your browser', 'please wait while we check your browser', 'ray id:', 'cf-ray'],
      type: 'Cloudflare Protection',
      message: 'This website uses Cloudflare\'s bot protection. The site may be temporarily blocking automated requests.'
    },
    {
      patterns: ['security check', 'bot protection', 'automated requests', 'please verify you are human'],
      type: 'Bot Protection',
      message: 'This website has bot protection enabled that prevents automated access.'
    },
    {
      patterns: ['access denied', 'forbidden', '403 forbidden'],
      type: 'Access Denied',
      message: 'Access to this website is currently restricted or blocked.'
    },
    {
      patterns: ['rate limit', 'too many requests', '429'],
      type: 'Rate Limited',
      message: 'This website is rate limiting requests. Please try again later.'
    }
  ];
  
  for (const checkpoint of checkpoints) {
    if (checkpoint.patterns.some(pattern => lowerHtml.includes(pattern) || lowerTitle.includes(pattern))) {
      return {
        isCheckpoint: true,
        type: checkpoint.type,
        message: checkpoint.message
      };
    }
  }
  
  return { isCheckpoint: false, type: '', message: '' };
}

// Extract content using Mozilla Readability
function extractWithReadability(html: string, url: string) {
  try {
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();
    
    if (article) {
      return {
        title: article.title || 'No title found',
        content: article.textContent || article.content || 'No content found',
        excerpt: article.excerpt || ''
      };
    }
  } catch (error) {
    console.log('Readability extraction failed:', error);
  }
  return null;
}

// Playwright fallback with better stealth capabilities
async function scrapeWithPlaywright(fullUrl: string) {
  console.log('Starting Playwright with URL:', fullUrl);
  let browser;
  try {
    const { chromium } = await import('playwright');
    
    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled',
        '--disable-features=VizDisplayCompositor'
      ]
    });
    
    const context = await browser.newContext({
      userAgent: getRandomUserAgent(),
      viewport: { width: 1366, height: 768 },
      extraHTTPHeaders: {
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br'
      }
    });
    
    const page = await context.newPage();
    
    // Navigate with longer timeout
    await page.goto(fullUrl, { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    
    // Wait and simulate human behavior
    await page.waitForTimeout(2000);
    await page.mouse.move(100, 100);
    await page.waitForTimeout(1000);
    
    const html = await page.content();
    await browser.close();
    
    return html;
  } catch (error) {
    if (browser) {
      await browser.close();
    }
    throw error;
  }
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
      // Use puppeteer-core with system Chromium for development
      console.log('Using puppeteer-core with system Chromium for development...');
      puppeteer = await import('puppeteer-core');
      
      // Use the system Chromium we installed via Nix
      const { execSync } = await import('child_process');
      try {
        const chromiumPath = execSync('which chromium', { encoding: 'utf-8' }).trim();
        launchOptions.executablePath = chromiumPath;
        console.log('Found system Chromium at:', chromiumPath);
      } catch (e) {
        console.log('System Chromium not found, will try to find manually');
        // Fallback to manual search
        try {
          const nixChromium = execSync('find /nix/store -name chromium -type f -executable 2>/dev/null | head -1', { encoding: 'utf-8' }).trim();
          if (nixChromium) {
            launchOptions.executablePath = nixChromium;
            console.log('Found Nix Chromium at:', nixChromium);
          }
        } catch (e2) {
          console.log('Could not find any Chromium installation');
        }
      }
      console.log('Development launch options:', launchOptions);
    }

    console.log('Launching browser...');
    browser = await puppeteer.launch(launchOptions);
    console.log('Browser launched successfully');
    console.log('Creating new page...');
    const page = await browser.newPage();
    
    // Set random user agent and realistic viewport
    const randomUserAgent = getRandomUserAgent();
    console.log('Setting user agent and viewport...');
    await page.setUserAgent(randomUserAgent);
    await page.setViewport({ 
      width: 1366 + Math.floor(Math.random() * 200), 
      height: 768 + Math.floor(Math.random() * 200) 
    });
    
    // Set additional headers with more realistic values
    console.log('Setting extra headers...');
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1'
    });

    // Navigate with timeout and better wait conditions
    console.log('Navigating to URL:', fullUrl);
    await page.goto(fullUrl, { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    console.log('Navigation completed');

    // Human-like behavior: random delays and mouse movements
    console.log('Simulating human-like behavior...');
    const randomDelay = Math.floor(Math.random() * 2000) + 1000;
    await new Promise(resolve => setTimeout(resolve, randomDelay));
    
    // Random mouse movements
    await page.mouse.move(
      Math.floor(Math.random() * 400) + 100, 
      Math.floor(Math.random() * 300) + 100
    );
    
    // Random scroll
    await page.evaluate(() => {
      window.scrollTo(0, Math.floor(Math.random() * 200) + 50);
    });
    
    // Wait a bit more
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check if we hit a security checkpoint
    let pageContent = await page.content();
    if (pageContent.includes('Security Checkpoint') || pageContent.includes('verify your browser') || pageContent.includes('Checking your browser')) {
      console.log('Detected security checkpoint, trying to bypass...');
      
      // More human-like interactions
      await page.mouse.move(200, 300);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Try scrolling down and up
      await page.evaluate(() => {
        window.scrollTo(0, 300);
      });
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      await page.evaluate(() => {
        window.scrollTo(0, 0);
      });
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Click somewhere random (but safe)
      try {
        await page.mouse.click(400, 400);
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (e) {
        console.log('Click failed, continuing...');
      }
      
      // Wait for potential redirect or content change
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Check if content changed
      pageContent = await page.content();
      if (pageContent.includes('Security Checkpoint')) {
        console.log('Still on security checkpoint, waiting longer...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

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
    console.log('API called');
    const { url } = await request.json();
    console.log('Received URL:', url);
    
    if (!url) {
      console.log('No URL provided');
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Add protocol if missing
    let fullUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      fullUrl = `https://${url}`;
    }
    console.log('Full URL:', fullUrl);

    // Try to fetch with proper headers
    console.log('Attempting to fetch URL...');
    let response;
    try {
      response = await fetchWithHeaders(fullUrl);
      console.log('Fetch response status:', response.status);
    } catch (error) {
      console.log('Fetch failed with error:', error instanceof Error ? error.message : 'Unknown error');
      return NextResponse.json({ 
        error: 'Unable to access this website. It may be unreachable or have connection issues. Please check the URL and try again.',
        details: error instanceof Error ? error.message : 'Network error'
      }, { status: 400 });
    }

    let html;
    
    if (!response.ok) {
      // If we got blocked, try advanced scraping methods
      if ([403, 429, 503].includes(response.status)) {
        try {
          console.log('Fetch blocked, trying Playwright fallback...');
          html = await scrapeWithPlaywright(fullUrl);
          console.log('Playwright fallback succeeded');
        } catch (playwrightError) {
          console.log('Playwright failed, trying Puppeteer fallback...');
          try {
            html = await scrapeWithPuppeteer(fullUrl);
            console.log('Puppeteer fallback succeeded');
          } catch (puppeteerError) {
            console.error('All scraping methods failed');
            
            let errorMessage = `Failed to fetch URL: ${response.status} ${response.statusText}`;
            
            if (response.status === 403) {
              errorMessage = 'Access denied - this website has strong bot protection.';
            } else if (response.status === 429) {
              errorMessage = 'Rate limited - this website is protecting against automated requests.';
            } else if (response.status === 503) {
              errorMessage = 'Service unavailable - this website may be using advanced protection.';
            }
            
            return NextResponse.json({ 
              error: errorMessage,
              suggestion: 'Try accessing the website directly in your browser first, then try again later.',
              type: 'SCRAPING_BLOCKED'
            }, { status: 400 });
          }
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

    // Extract title for security checkpoint detection
    let title = $('title').text().trim() || 
                $('h1').first().text().trim() || 
                $('meta[property="og:title"]').attr('content') || 
                'No title found';

    // Check for security checkpoints
    const checkpointResult = isSecurityCheckpoint(html, title);
    
    if (checkpointResult.isCheckpoint) {
      console.log('Security checkpoint detected:', checkpointResult.type);
      return NextResponse.json({
        error: checkpointResult.message,
        type: 'SECURITY_CHECKPOINT',
        checkpointType: checkpointResult.type,
        suggestion: 'This website has protection against automated requests. You may need to visit the site directly in your browser first.',
        alternatives: [
          'Try visiting the website directly in your browser',
          'Wait a few minutes and try again',
          'Check if the website has a public API for accessing content'
        ]
      }, { status: 400 });
    }

    // Try Mozilla Readability first for better content extraction
    const readabilityResult = extractWithReadability(html, fullUrl);
    
    let description, content;
    
    if (readabilityResult && readabilityResult.content.length > 100) {
      console.log('Using Readability extraction');
      title = readabilityResult.title || title;
      content = readabilityResult.content.substring(0, 2000);
      description = readabilityResult.excerpt || 
                   $('meta[name="description"]').attr('content') || 
                   $('meta[property="og:description"]').attr('content') || 
                   content.substring(0, 300);
    } else {
      console.log('Using fallback content extraction');
      // Fallback to original extraction method
      description = $('meta[name="description"]').attr('content') || 
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

      content = '';
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
    }

    // Clean up description
    description = description.substring(0, 500);

    return NextResponse.json({
      success: true,
      data: {
        url: fullUrl,
        title,
        description,
        content
      },
      extractionMethod: readabilityResult ? 'readability' : 'fallback'
    });

  } catch (error) {
    console.error('Scraping error:', error);
    return NextResponse.json({ 
      error: 'Failed to scrape the webpage. Please check the URL and try again.' 
    }, { status: 500 });
  }
}