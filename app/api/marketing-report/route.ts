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
    const { data }: { data: ScrapedData } = await request.json();
    
    if (!data || !data.title || !data.content) {
      return NextResponse.json({ error: 'Invalid data provided' }, { status: 400 });
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

    // Parse the JSON response
    let marketingReport;
    try {
      marketingReport = JSON.parse(responseText);
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