import { GoogleGenerativeAI } from '@google/generative-ai';
import { Message } from 'ai';
import { NextResponse } from 'next/server';
import { LatLngLiteral } from 'leaflet';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { db } from '@/db';
import { chatMessages } from '@/db';

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

export async function POST(req: Request) {
  try {
    // Check authentication only for chat requests
    const session = await getServerSession(authOptions);
    if (!session) {
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

    const { messages, locationContext = '' }: ChatApiRequest = await req.json();

    console.log('Received chat request with location context:', locationContext);
    console.log('Messages:', messages);

    if (!messages || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'No messages provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!locationContext) {
      return new Response(JSON.stringify({ error: 'No location context provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const prompt = buildGoogleGenAIPrompt(messages, locationContext);
    console.log('Built prompt with context:', JSON.stringify(prompt, null, 2));

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
            const locationData = JSON.parse(locationContext);
            await db.insert(chatMessages).values({
              conversationId: crypto.randomUUID(),
              role: lastMessage.role,
              content: lastMessage.content,
              locationContext: {
                center: { lat: locationData.lat, lng: locationData.lng },
                zoom: locationData.zoom,
              },
              metadata: {
                model: 'gemini-1.5-pro',
              },
            });
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
