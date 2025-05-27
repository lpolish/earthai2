import { GoogleGenerativeAI } from '@google/generative-ai';
import { Message } from 'ai';
import { NextRequest, NextResponse } from 'next/server';
import { LatLngLiteral } from 'leaflet';
import { getToken } from 'next-auth/jwt';

const buildGoogleGenAIPrompt = (messages: Message[], locationContext: string) => {
  // Enhanced system message with structured location awareness
  const systemMessage = {
    role: 'model',
    parts: [{
      text: `You are EarthAI, a specialized location-aware AI assistant. Your primary function is to provide information about geographic locations and their features.

CURRENT MAP VIEW:
${locationContext}

RESPONSE GUIDELINES:
1. Use the provided location context in your responses
2. Link Format Rules:
   - ALWAYS use the format: [Location Name](map:lat,lng,zoom)
   - ALWAYS link the main city/location when first mentioned in your response
   - Use appropriate zoom levels: 13 for cities, 15 for neighborhoods, 17 for specific locations
   - Include links for all significant locations mentioned
   - For nearby places, include their coordinates with appropriate zoom levels
3. Response Structure:
   - Keep responses concise and focused
   - Start with the main location context
   - Use natural language to describe relationships between places
   - Include relevant map links for suggested places
4. Location Context:
   - Use the zoom level to determine appropriate detail
   - Reference the visible area for context
   - Consider the current view when suggesting places to explore`
    }]
  };

  // Convert user messages to Gemini format with enhanced context
  const userMessages = messages
    .filter(message => message.role === 'user' || message.role === 'assistant')
    .map(message => ({
      role: message.role === 'user' ? 'user' : 'model',
      parts: [{ text: message.content }],
    }));

  return {
    contents: [systemMessage, ...userMessages],
  };
};

export interface ChatApiRequest {
  messages: Message[];
  locationContext: string;
}

export async function POST(req: NextRequest) {
  try {
    // Check authentication using JWT token (consistent with middleware)
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!process.env.GOOGLE_API_KEY) {
      return NextResponse.json(
        { error: 'AI service is not configured' },
        { status: 503 }
      );
    }

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

    const { messages, locationContext = '{}' }: ChatApiRequest = await req.json();

    if (!messages || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'No messages provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate and sanitize location context
    let sanitizedLocationContext = '{}';
    try {
      // Handle potential URI encoding issues
      const decodedContext = typeof locationContext === 'string' 
        ? locationContext.replace(/\+/g, ' ') // Replace + with spaces
        : JSON.stringify(locationContext);
      
      // Validate JSON format
      JSON.parse(decodedContext);
      sanitizedLocationContext = decodedContext;
    } catch (error) {
      console.warn('Invalid location context, using default:', error);
      sanitizedLocationContext = '{}';
    }

    const prompt = buildGoogleGenAIPrompt(messages, sanitizedLocationContext);

    const geminiStream = await model.generateContentStream(prompt);

    // Create a ReadableStream from the Gemini response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let fullResponse = '';
          for await (const chunk of geminiStream.stream) {
            const text = chunk.text();
            fullResponse += text;
            controller.enqueue(new TextEncoder().encode(text));
          }
          controller.close();

          // Store chat history after successful response
          const lastMessage = messages[messages.length - 1];
          if (lastMessage && lastMessage.role === 'user') {
            try {
              // Dynamic import to avoid build-time database connection
              const { db, chatMessages } = await import('@/db');
              
              const locationData = JSON.parse(sanitizedLocationContext);
              await db.insert(chatMessages).values({
                conversationId: crypto.randomUUID(),
                role: lastMessage.role,
                content: lastMessage.content,
                locationContext: {
                  center: { lat: locationData.lat || 0, lng: locationData.lng || 0 },
                  zoom: locationData.zoom || 10,
                },
                metadata: {
                  model: 'gemini-1.5-pro',
                },
              });
            } catch (parseError) {
              console.error('Failed to parse location context or store message:', parseError);
              // Continue without storing - don't fail the response
            }
          }
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process chat message',
        details: error instanceof Error ? error.message : 'Unknown error'
      }), 
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
