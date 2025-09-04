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

// A function to wait until the security checkpoint message is gone from the page
async function activelyWaitForContent(page: any, timeout = 25000) {
  console.log('[activeWait] Starting active wait for content...');
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    const content = await page.content();
    const title = await page.title();
    const { isCheckpoint, type } = isSecurityCheckpoint(content, title);
    const textContentLength = await page.evaluate(() => document.body.innerText.length);

    // Standard success case: no checkpoint and some content
    if (!isCheckpoint && textContentLength > 200) {
      console.log(`[activeWait] SUCCESS: Security check clear and content length is valid (${textContentLength}).`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return true;
    }

    // Override success case: A checkpoint is visible, but the page also has a lot of content,
    // meaning the checkpoint is likely an overlay on top of the real content.
    if (isCheckpoint && textContentLength > 1500) {
      console.log(`[activeWait] OVERRIDE: Checkpoint '${type}' detected, BUT substantial content (length: ${textContentLength}) also found. Proceeding.`);
      return true;
    }

    // Log the current state if we are continuing the loop
    if (isCheckpoint) {
      console.log(`[activeWait] Checkpoint detected: ${type}. Content length (${textContentLength}) is low. Simulating interaction...`);
    } else {
      console.log(`[activeWait] Security check clear, but content short (${textContentLength}). Simulating interaction...`);
    }


    // --- Minimal Interaction ---
    try {
      // Very light scrolling only, no mouse movements
      if (Math.random() < 0.3) { // Only scroll 30% of the time
        await page.evaluate(() => {
          window.scrollBy(0, Math.floor(Math.random() * 50) + 25);
        });
      }
    } catch (e) {
      console.log('[activeWait] Could not scroll, page might be loading.');
    }
    
    // Use randomized delay
    const randomDelay = 1500 + Math.random() * 1000;
    await new Promise(resolve => setTimeout(resolve, randomDelay)); 
  }
  
  console.log('[activeWait] FAILURE: Timed out waiting for content to settle.');
  return false;
}

// Enhanced Puppeteer with stealth plugin for bypassing protection
async function scrapeWithPuppeteerStealth(fullUrl: string) {
  console.log('Starting Puppeteer Stealth with URL:', fullUrl);
  let browser;
  try {
    const isVercel = !!process.env.VERCEL_ENV;
    console.log('Environment - isVercel:', isVercel);
    
    const puppeteerExtra = await import('puppeteer-extra');
    const StealthPlugin = (await import('puppeteer-extra-plugin-stealth')).default;
    puppeteerExtra.default.use(StealthPlugin());
    
    let puppeteer: any = puppeteerExtra.default;
    let launchOptions: any;

    if (isVercel) {
      console.log('Loading Sparticuz Chromium for Vercel with stealth...');
      const chromium = (await import('@sparticuz/chromium')).default;
      launchOptions = {
        headless: true,
        args: chromium.args,
        executablePath: await chromium.executablePath(),
      };
    } else {
      console.log('Using puppeteer-extra with bundled Chromium for development...');
      launchOptions = {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      };
    }

    console.log('Launching stealth browser...');
    browser = await puppeteer.launch(launchOptions);
    console.log('Stealth browser launched successfully');
    const page = await browser.newPage();
    
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
    });
    
    await page.setUserAgent(getRandomUserAgent());
    await page.setViewport({ width: 1920, height: 1080 });
    
    console.log('Navigating with stealth to URL:', fullUrl);
    await page.goto(fullUrl, { 
      waitUntil: 'domcontentloaded',
      timeout: 60000 
    });
    console.log('[PuppeteerStealth] Navigation completed');

    await activelyWaitForContent(page);

    console.log('[PuppeteerStealth] Getting final page content...');
    const html = await page.content();
    
    console.log('[PuppeteerStealth] Closing browser.');
    await browser.close();
    return html;
    
  } catch (error) {
    if (browser) {
      await browser.close();
    }
    throw error;
  }
}

// Original Puppeteer fallback for heavily protected sites
async function scrapeWithPuppeteer(fullUrl: string) {
  console.log('Starting Puppeteer with URL:', fullUrl);
  let browser;
  try {
    const isVercel = !!process.env.VERCEL_ENV;
    console.log('Environment - isVercel:', isVercel);
    let puppeteer: any;
    let launchOptions: any;

    if (isVercel) {
      console.log('Loading Sparticuz Chromium for Vercel...');
      const chromium = (await import('@sparticuz/chromium')).default;
      puppeteer = await import('puppeteer-core');
      launchOptions = {
        headless: true,
        args: chromium.args,
        executablePath: await chromium.executablePath(),
      };
    } else {
      console.log('Using puppeteer with bundled Chromium for development...');
      puppeteer = await import('puppeteer');
      launchOptions = {
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      };
    }

    console.log('Launching browser...');
    browser = await puppeteer.launch(launchOptions);
    console.log('Browser launched successfully');
    const page = await browser.newPage();
    
    await page.setUserAgent(getRandomUserAgent());
    await page.setViewport({ width: 1366, height: 768 });

    console.log('Navigating to URL:', fullUrl);
    await page.goto(fullUrl, { 
      waitUntil: 'domcontentloaded',
      timeout: 60000 
    });
    console.log('[Puppeteer] Navigation completed');
    
    await activelyWaitForContent(page);
    
    console.log('[Puppeteer] Getting final page content...');
    const html = await page.content();
    
    console.log('[Puppeteer] Closing browser.');
    await browser.close();
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

    let fullUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      fullUrl = `https://${url}`;
    }
    console.log('Full URL:', fullUrl);

    let html: string | undefined;
    let useFallback = false;

    // --- STAGE 1: Initial Fetch ---
    console.log('--- STAGE 1: Attempting direct fetch ---');
    try {
      const response = await fetchWithHeaders(fullUrl);
      console.log(`[Fetch] Response status: ${response.status}`);

      if (response.ok) {
        html = await response.text();
        const $ = cheerio.load(html);
        const title = $('title').text().trim() || 'No title found';
        
        const checkpointResult = isSecurityCheckpoint(html, title);
        if (checkpointResult.isCheckpoint) {
          console.log(`[Fetch] Security checkpoint detected in 200 OK response: ${checkpointResult.type}`);
          useFallback = true;
        } else {
          console.log('[Fetch] Success, content appears valid.');
        }
      } else {
        console.log(`[Fetch] Request failed with status: ${response.status}. Initiating fallback.`);
        useFallback = true;
      }
    } catch (error) {
      console.log('Initial fetch threw an error:', error instanceof Error ? error.message : 'Unknown error');
      useFallback = true;
    }
    
    // --- STAGE 2: Fallback to Headless Browsers if needed ---
    if (useFallback) {
      console.log('\n--- STAGE 2: Initiating fallback scraping methods ---');
      try {
        console.log('\n[Fallback] Trying Stealth Puppeteer...');
        html = await scrapeWithPuppeteerStealth(fullUrl);
        console.log('[Fallback] Stealth Puppeteer succeeded.');
      } catch (stealthError) {
        console.error('[Fallback] Stealth Puppeteer failed:', stealthError instanceof Error ? stealthError.message : stealthError);
        try {
          console.log('\n[Fallback] Trying original Puppeteer...');
          html = await scrapeWithPuppeteer(fullUrl);
          console.log('[Fallback] Original Puppeteer succeeded.');
        } catch (puppeteerError) {
          console.error('[Fallback] All scraping methods failed:', puppeteerError instanceof Error ? puppeteerError.message : puppeteerError);
          return NextResponse.json({ 
            error: 'This website has strong protection that could not be bypassed.',
            suggestion: 'Try accessing the website directly in your browser first, then try again later.',
            type: 'SCRAPING_BLOCKED'
          }, { status: 400 });
        }
      }
    }
    
    if (!html) {
        console.error('Failed to retrieve HTML content after all attempts.');
        return NextResponse.json({ error: 'Failed to retrieve page content.' }, { status: 500 });
    }

    // --- STAGE 3: Content Extraction ---
    console.log('\n--- STAGE 3: Extracting content from final HTML ---');
    console.log('[Extraction] HTML received from browser, proceeding directly to extraction.');
    console.log('[Extraction] HTML Snippet (first 500 chars):', html.substring(0, 500));

    const $ = cheerio.load(html);
    let title = $('title').text().trim() || 
                $('h1').first().text().trim() || 
                $('meta[property="og:title"]').attr('content') || 
                'No title found';
    
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
      description = $('meta[name="description"]').attr('content') || 
                    $('meta[property="og:description"]').attr('content') || 
                    $('meta[name="twitter:description"]').attr('content') || 
                    $('p').first().text().trim().substring(0, 300) || 
                    'No description found';

      const contentSelectors = [
        'main', '[role="main"]', '.main-content', '.content', 'article',
        '.post-content', '.entry-content', '.page-content', 'section'
      ];

      content = '';
      for (const selector of contentSelectors) {
        const element = $(selector).first();
        if (element.length > 0) {
          element.find('script, style, nav, header, footer, aside').remove();
          content = element.text().trim();
          if (content && content.length > 100) break;
        }
      }

      if (!content || content.length < 100) {
        const paragraphs = $('p').map((_, el) => $(el).text().trim()).get();
        content = paragraphs.join(' ').substring(0, 1000);
      }

      content = content.replace(/\s+/g, ' ').trim().substring(0, 2000) || 'No content found';
    }

    description = description.substring(0, 500);

    return NextResponse.json({
      success: true,
      data: {
        url: fullUrl,
        title,
        description,
        content
      },
      extractionMethod: readabilityResult && readabilityResult.content.length > 100 ? 'readability' : 'fallback'
    });

  } catch (error) {
    console.error('Scraping error:', error);
    return NextResponse.json({ 
      error: 'Failed to scrape the webpage. Please check the URL and try again.' 
    }, { status: 500 });
  }
}
