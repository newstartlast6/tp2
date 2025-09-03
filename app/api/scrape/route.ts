import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";

// Multiple realistic user agents for rotation
const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 Edg/119.0.0.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
];

function getRandomUserAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function getBrowserHeaders() {
  return {
    "User-Agent": getRandomUserAgent(),
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    Connection: "keep-alive",
    "Upgrade-Insecure-Requests": "1",
  };
}

async function fetchWithHeaders(fullUrl: string) {
  const headers = getBrowserHeaders();
  const response = await fetch(fullUrl, {
    headers,
    redirect: "follow",
    signal: AbortSignal.timeout(15000),
  });
  return response;
}

function isSecurityCheckpoint(
  html: string,
  title: string,
): { isCheckpoint: boolean; type: string; message: string } {
  const lowerHtml = html.toLowerCase();
  const lowerTitle = title.toLowerCase();
  const checkpoints = [
    {
      patterns: [
        "vercel security checkpoint",
        "failed to verify your browser",
        "code 21",
      ],
      type: "Vercel Security",
      message:
        "This website uses Vercel's security protection that blocks automated access. Try visiting the site directly in your browser first.",
    },
    {
      patterns: [
        "cloudflare",
        "checking your browser",
        "please wait while we check your browser",
        "ray id:",
        "cf-ray",
        "just a moment...",
      ],
      type: "Cloudflare Protection",
      message:
        "This website uses Cloudflare's bot protection. The site may be temporarily blocking automated requests.",
    },
    {
      patterns: ["access denied", "forbidden", "403 forbidden"],
      type: "Access Denied",
      message: "Access to this website is currently restricted or blocked.",
    },
    {
      patterns: ["rate limit", "too many requests", "429"],
      type: "Rate Limited",
      message:
        "This website is rate limiting requests. Please try again later.",
    },
  ];

  for (const checkpoint of checkpoints) {
    if (
      checkpoint.patterns.some(
        (pattern) =>
          lowerHtml.includes(pattern) || lowerTitle.includes(pattern),
      )
    ) {
      return {
        isCheckpoint: true,
        type: checkpoint.type,
        message: checkpoint.message,
      };
    }
  }
  return { isCheckpoint: false, type: "", message: "" };
}

function extractWithReadability(html: string, url: string) {
  try {
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();
    if (article) {
      return {
        title: article.title || "No title found",
        content: article.textContent || article.content || "No content found",
        excerpt: article.excerpt || "",
      };
    }
  } catch (error) {
    console.log("Readability extraction failed:", error);
  }
  return null;
}

// --- REFACTORED & UPGRADED PUPPETEER FUNCTION ---
async function scrapeWithPuppeteerStealth(fullUrl: string) {
  console.log("Starting Puppeteer with Stealth with URL:", fullUrl);
  let browser;

  try {
    // --- PROXY CONFIGURATION ---
    // Reads proxy details from environment variables for security and flexibility.
    const proxyServer = process.env.PROXY_SERVER; // e.g., "http://proxy.example.com:8080"
    const proxyUsername = process.env.PROXY_USERNAME;
    const proxyPassword = process.env.PROXY_PASSWORD;
    const proxyArgs = proxyServer ? [`--proxy-server=${proxyServer}`] : [];

    if (proxyServer) {
      console.log("Using residential proxy server for request.");
    } else {
      console.log(
        "Warning: No proxy configured. Scraping may be unreliable against protected sites.",
      );
    }

    const isVercel = !!process.env.VERCEL_ENV;
    let launchOptions: any = {
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-infobars",
        "--window-position=0,0",
        "--ignore-certifcate-errors",
        "--ignore-certifcate-errors-spki-list",
        "--disable-dev-shm-usage",
        ...proxyArgs,
      ],
    };

    if (isVercel) {
      console.log("Loading @sparticuz/chromium for Vercel environment...");
      const chromium = (await import("@sparticuz/chromium")).default;
      launchOptions = {
        ...launchOptions,
        args: [...chromium.args, ...launchOptions.args],
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
      };
    } else {
      console.log(
        "Using puppeteer-extra with bundled Chromium for local development...",
      );
    }

    console.log("Launching browser with stealth settings...");
    browser = await puppeteer.launch(launchOptions);

    const page = await browser.newPage();

    // --- PROXY AUTHENTICATION ---
    if (proxyServer && proxyUsername && proxyPassword) {
      await page.authenticate({
        username: proxyUsername,
        password: proxyPassword,
      });
    }

    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent(getRandomUserAgent());

    console.log("Navigating to URL:", fullUrl);
    // Use a longer timeout and 'networkidle2' to wait for JS challenges to complete
    await page.goto(fullUrl, { waitUntil: "networkidle2", timeout: 60000 });
    console.log("Navigation completed.");

    // Wait for a few seconds to let any lingering JS challenges resolve
    console.log("Waiting for potential JS challenges to resolve...");
    await new Promise((resolve) =>
      setTimeout(resolve, 5000 + Math.random() * 3000),
    );

    const pageTitle = await page.title();
    console.log("Page title after wait:", pageTitle);

    // If we're still on a challenge page, it's a strong indicator of being blocked.
    // We can add more robust checks here if needed.
    if (
      pageTitle.toLowerCase().includes("just a moment") ||
      pageTitle.toLowerCase().includes("security checkpoint")
    ) {
      console.log("Still on a challenge page. The site is heavily protected.");
      // The content will be the challenge page itself, which our later logic will handle.
    }

    const html = await page.content();
    console.log("Successfully retrieved page content with stealth.");

    await browser.close();
    return html;
  } catch (error) {
    console.error("Puppeteer with stealth failed:", error);
    if (browser) {
      await browser.close();
    }
    throw error;
  }
}

// --- MAIN API HANDLER ---
export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    let fullUrl = url.startsWith("http") ? url : `https://${url}`;
    console.log("Processing URL:", fullUrl);

    let html;
    let extractionMethod = "fetch";

    try {
      // 1. First attempt: Simple fetch with realistic headers
      console.log("Attempt 1: Standard fetch");
      const response = await fetchWithHeaders(fullUrl);
      console.log("Fetch response status:", response.status);

      if (!response.ok) {
        // If fetch is blocked (403, 503 etc.), escalate immediately
        throw new Error(`Fetch failed with status: ${response.status}`);
      }
      html = await response.text();
    } catch (fetchError) {
      console.log(
        "Standard fetch failed. Escalating to headless browser.",
        fetchError instanceof Error ? fetchError.message : "",
      );
      // 2. Second attempt: Puppeteer with Stealth (The heavy-lifter)
      try {
        html = await scrapeWithPuppeteerStealth(fullUrl);
        extractionMethod = "puppeteer-stealth";
      } catch (puppeteerError) {
        console.error("All scraping methods failed.", puppeteerError);
        return NextResponse.json(
          {
            error:
              "This website is protected by advanced bot detection that could not be bypassed.",
            suggestion:
              "Please try accessing the website directly in your browser.",
            type: "SCRAPING_BLOCKED",
          },
          { status: 400 },
        );
      }
    }

    const $ = cheerio.load(html);
    let title =
      $("title").text().trim() ||
      $("h1").first().text().trim() ||
      "No title found";

    // Check for security checkpoints in the final HTML
    const checkpointResult = isSecurityCheckpoint(html, title);
    if (checkpointResult.isCheckpoint) {
      console.log(
        "Security checkpoint detected in final HTML:",
        checkpointResult.type,
      );
      return NextResponse.json(
        {
          error: checkpointResult.message,
          type: "SECURITY_CHECKPOINT",
          checkpointType: checkpointResult.type,
        },
        { status: 400 },
      );
    }

    // Use Mozilla Readability for robust content extraction
    const readabilityResult = extractWithReadability(html, fullUrl);
    let description, content;

    if (readabilityResult && readabilityResult.content.length > 100) {
      console.log("Extracting content using Readability.");
      title = readabilityResult.title || title;
      content = readabilityResult.content;
      description =
        readabilityResult.excerpt ||
        $('meta[name="description"]').attr("content") ||
        content.substring(0, 300);
      extractionMethod += "+readability";
    } else {
      console.log("Readability failed, using fallback Cheerio extraction.");
      description =
        $('meta[name="description"]').attr("content") ||
        $("p").first().text().trim();

      // Cheerio fallback content extraction
      $("script, style, nav, header, footer, aside").remove();
      content =
        $("main").text().trim() ||
        $("article").text().trim() ||
        $("body").text().trim();
      extractionMethod += "+cheerio-fallback";
    }

    // Clean up and truncate content
    content = content.replace(/\s+/g, " ").trim().substring(0, 3000);
    description = description.replace(/\s+/g, " ").trim().substring(0, 500);

    return NextResponse.json({
      success: true,
      data: {
        url: fullUrl,
        title,
        description,
        content,
      },
      extractionMethod,
    });
  } catch (error) {
    console.error("Unhandled error in API route:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while processing the request." },
      { status: 500 },
    );
  }
}
