import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

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

    // Fetch the webpage
    const response = await fetch(fullUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      redirect: 'follow'
    });

    if (!response.ok) {
      return NextResponse.json({ 
        error: `Failed to fetch URL: ${response.status} ${response.statusText}` 
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