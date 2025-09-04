import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

interface ScrapedData {
  url: string;
  title: string;
  description: string;
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Received request body:', body);

    // Handle both data structures for compatibility
    const data = body.data || (body.scrapedData && body.scrapedData.data) || body.scrapedData;

    if (!data || !data.title || !data.content) {
      console.log('Validation failed - data:', data);
      console.log('Available keys in body:', Object.keys(body));
      if (body.scrapedData) {
        console.log('scrapedData keys:', Object.keys(body.scrapedData));
      }
      return NextResponse.json({ error: 'Invalid data provided' }, { status: 400 });
    }

    // Test mode - return dummy response without hitting Gemini API
    const testMode = process.env.TEST_MODE === 'true';

    if (testMode) {
      console.log('TEST MODE: Returning dummy marketing report');
      const dummyReport = {
        productName: data.title || "Sample Product",
        category: "SaaS - AI-powered Solution",
        userPersona: {
          demographics: "Small business owners, marketers, content creators, and entrepreneurs. Age range: 25-45, primarily tech-savvy professionals.",
          whereTheyHangOut: "LinkedIn, Twitter, Instagram, YouTube, and industry-specific communities and forums.",
          mindset: "Growth-oriented, efficiency-focused, and always looking for innovative solutions to scale their business and improve productivity."
        },
        painPoints: [
          "Struggling with time-consuming manual processes",
          "Difficulty creating engaging content consistently",
          "Limited budget for marketing and advertising",
          "Keeping up with rapidly changing digital trends",
          "Measuring ROI and tracking performance effectively"
        ],
        valueProposition: "Streamline your workflow and boost productivity with our AI-powered solution that saves time and drives results.",
        contentPillars: [
          {
            pillar: "Education",
            description: "Share tutorials, best practices, and industry insights to help users maximize their potential and stay informed about latest trends."
          },
          {
            pillar: "Social Proof",
            description: "Showcase customer success stories, testimonials, and case studies that demonstrate real-world results and build trust."
          },
          {
            pillar: "Behind the Scenes",
            description: "Give followers a peek into company culture, product development, and the team behind the solution to humanize the brand."
          },
          {
            pillar: "Relatable/Motivational",
            description: "Share inspirational content, entrepreneurial journeys, and relatable challenges that resonate with the target audience."
          }
        ],
        postTypes: [
          "LinkedIn carousel posts with actionable tips",
          "Instagram Reels showcasing quick tutorials",
          "Twitter threads breaking down complex concepts",
          "YouTube explainer videos and demos",
          "Blog posts with in-depth case studies",
          "Podcast appearances and interviews",
          "Webinar presentations and live Q&As"
        ],
        weeklyCalendar: {
          monday: "Educational content: Share a helpful tip or tutorial to start the week strong",
          wednesday: "Social proof: Feature a customer success story or testimonial to build credibility",
          friday: "Behind the scenes: Show company culture or product development updates",
          sunday: "Motivational content: Share inspirational quotes or entrepreneurial insights"
        },
        hashtagStyle: {
          tone: "Professional yet approachable, mixing industry-specific and trending hashtags to maximize reach and engagement",
          exampleHashtags: ["#productivity", "#AI", "#business", "#marketing", "#entrepreneur", "#innovation", "#growth", "#efficiency"]
        },
        engagementStrategy: [
          "Respond to comments and messages within 2-4 hours during business hours",
          "Create interactive polls and questions to encourage audience participation",
          "Collaborate with industry influencers and thought leaders for cross-promotion",
          "Host regular live sessions and AMAs to build community",
          "Share user-generated content and celebrate customer wins"
        ],
        metricsToTrack: [
          "Engagement rate (likes, comments, shares, saves)",
          "Website traffic and conversion rates from social media",
          "Lead generation and sign-up rates",
          "Brand mention sentiment and reach",
          "Customer acquisition cost from social channels"
        ],
        keyTakeaway: "Focus on providing consistent value through educational content while building authentic relationships with your audience to drive sustainable growth."
      };

      return NextResponse.json({
        success: true,
        report: dummyReport,
        sourceData: {
          url: data.url,
          title: data.title
        },
        testMode: true
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }

    const ai = new GoogleGenAI({
      apiKey: apiKey,
    });

    const config = {
      responseMimeType: 'application/json',
    };

    const model = 'gemini-2.0-flash-lite';

    const prompt = `
Analyze this website/product and create a comprehensive social media marketing strategy report in JSON format.

Website Data:
- URL: ${data.url}
- Title: ${data.title}
- Description: ${data.description}
- Content: ${data.content}

Generate a detailed marketing report with the following structure (return as valid JSON):

{
  "productName": "Extract or infer the product/company name",
  "category": "What type of product/service this is (SaaS, E-commerce, Service, etc.)",
  "userPersona": {
    "demographics": "Who the target users are",
    "whereTheyHangOut": "Main social platforms and communities they use",
    "mindset": "Their attitudes, behaviors, and mental state"
  },
  "painPoints": [
    "List 3-5 main problems/challenges the target audience faces",
    "That this product/service solves"
  ],
  "valueProposition": "A clear, compelling one-line value prop",
  "contentPillars": [
    {
      "pillar": "Education",
      "description": "Educational content strategy"
    },
    {
      "pillar": "Social Proof", 
      "description": "Social proof content strategy"
    },
    {
      "pillar": "Behind the Scenes",
      "description": "Behind the scenes content strategy"
    },
    {
      "pillar": "Relatable/Motivational",
      "description": "Relatable and motivational content strategy"
    }
  ],
  "postTypes": [
    "List 5-7 specific post formats that would work well",
    "Include platform-specific formats like Twitter threads, LinkedIn carousels, etc."
  ],
  "weeklyCalendar": {
    "monday": "Content type and brief description",
    "wednesday": "Content type and brief description", 
    "friday": "Content type and brief description",
    "sunday": "Content type and brief description"
  },
  "hashtagStyle": {
    "tone": "Describe the overall tone and style",
    "exampleHashtags": ["#relevant", "#hashtags", "#forthis", "#niche"]
  },
  "engagementStrategy": [
    "3-5 specific engagement tactics",
    "For building community and increasing reach"
  ],
  "metricsToTrack": [
    "4-5 key metrics to monitor success",
    "Include both vanity and business metrics"
  ],
  "keyTakeaway": "One powerful, actionable insight or strategy tip"
}

Make this highly specific and actionable for this particular business. Focus on understanding their unique value proposition and target audience based on the website content provided.
`;

    const contents = [
      {
        role: 'user',
        parts: [
          {
            text: prompt,
          },
        ],
      },
    ];

    console.log('Generating marketing report with Gemini...');
    const response = await ai.models.generateContent({
      model,
      config,
      contents,
    });

    const responseText = response.text;
    console.log('Gemini response received');
    console.log('=== GEMINI RESPONSE ===');
    console.log(responseText);
    console.log('=== END GEMINI RESPONSE ===');

    // Parse the JSON response
    let marketingReport;
    try {
      marketingReport = JSON.parse(responseText);
      console.log(marketingReport);
    } catch (parseError) {
      console.error('Failed to parse Gemini response as JSON:', parseError);
      console.log('Raw response:', responseText);
      return NextResponse.json({
        error: 'Failed to generate structured marketing report',
        details: 'AI response was not in valid JSON format'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      report: marketingReport,
      sourceData: {
        url: data.url,
        title: data.title
      }
    });

  } catch (error) {
    console.error('Marketing report generation error:', error);
    return NextResponse.json({
      error: 'Failed to generate marketing report',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}