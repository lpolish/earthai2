import { GoogleGenerativeAI } from '@google/generative-ai';
import { Message } from 'ai';
import { NextResponse } from 'next/server';
import { LatLngLiteral } from 'leaflet';

export const runtime = 'edge';

const buildGoogleGenAIPrompt = (messages: Message[], locationContext: string) => {
  // Enhanced system message with structured location awareness
  const systemMessage = {
    role: 'model',
    parts: [{
      text: `You are EarthAI, a specialized location-aware AI assistant. Your primary function is to provide information about geographic locations and their features.

CURRENT MAP VIEW:
${locationContext}

RESPONSE GUIDELINES:
1. You MUST use the provided location context in your responses
2. When asked about location, ALWAYS reference the coordinates and zoom level
3. For questions about "this place" or "where am I", use the exact coordinates and location description provided
4. Never ask for more location information - use what's provided
5. If the location includes a description, use it to provide context
6. Reference the zoom level to determine the appropriate level of detail
7. Use the visible area dimensions to understand the scope of the view
8. Always maintain a professional and informative tone

Remember: You are viewing the world through a map interface. The location context is always available and should be used in every response when relevant.`
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
          for await (const chunk of geminiStream.stream) {
            const text = chunk.text();
            controller.enqueue(new TextEncoder().encode(text));
          }
          controller.close();
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
