import { generateText, streamText } from 'ai';
import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';

// AI Provider Configuration
export type AIProvider = 'google' | 'openai' | 'anthropic';

interface AIConfig {
  provider: AIProvider;
  model: string;
}

// Default configuration - can be overridden via environment variables
const DEFAULT_CONFIG: AIConfig = {
  provider: 'google',
  model: 'gemini-1.5-pro'
};

function getAIModel(config: AIConfig = DEFAULT_CONFIG) {
  switch (config.provider) {
    case 'google':
      return google(config.model);
    case 'openai':
      return openai(config.model);
    case 'anthropic':
      return anthropic(config.model);
    default:
      throw new Error(`Unsupported AI provider: ${config.provider}`);
  }
}

function getAIConfig(): AIConfig {
  const provider = (process.env.AI_PROVIDER as AIProvider) || DEFAULT_CONFIG.provider;
  const model = process.env.AI_MODEL || DEFAULT_CONFIG.model;
  
  return { provider, model };
}

export interface LocationContext {
  center: { lat: number; lng: number };
  zoom: number;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  description?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  id?: string;
}

function buildSystemPrompt(locationContext: LocationContext): string {
  return `You are EarthAI, a specialized location-aware AI assistant. Your primary function is to provide information about geographic locations and their features.

CURRENT MAP VIEW:
- Center: (${locationContext.center.lat.toFixed(4)}, ${locationContext.center.lng.toFixed(4)})
- Zoom Level: ${locationContext.zoom}
- Visible Area: ${(locationContext.bounds.north - locationContext.bounds.south).toFixed(2)}° latitude × ${(locationContext.bounds.east - locationContext.bounds.west).toFixed(2)}° longitude
${locationContext.description ? `- Location Description: ${locationContext.description}` : ''}

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
   - Consider the current view when suggesting places to explore`;
}

export async function generateAIResponse(
  messages: ChatMessage[],
  locationContext: LocationContext
): Promise<string> {
  const config = getAIConfig();
  const model = getAIModel(config);
  
  const systemPrompt = buildSystemPrompt(locationContext);
  
  const result = await generateText({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }))
    ],
    maxTokens: 1000,
    temperature: 0.7,
  });

  return result.text;
}

export async function streamAIResponse(
  messages: ChatMessage[],
  locationContext: LocationContext
) {
  const config = getAIConfig();
  const model = getAIModel(config);
  
  const systemPrompt = buildSystemPrompt(locationContext);
  
  const result = await streamText({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }))
    ],
    maxTokens: 1000,
    temperature: 0.7,
  });

  return result.textStream;
}

export function validateAIConfig(): { isValid: boolean; missingKeys: string[] } {
  const config = getAIConfig();
  const missingKeys: string[] = [];
  
  switch (config.provider) {
    case 'google':
      if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
        missingKeys.push('GOOGLE_GENERATIVE_AI_API_KEY');
      }
      break;
    case 'openai':
      if (!process.env.OPENAI_API_KEY) {
        missingKeys.push('OPENAI_API_KEY');
      }
      break;
    case 'anthropic':
      if (!process.env.ANTHROPIC_API_KEY) {
        missingKeys.push('ANTHROPIC_API_KEY');
      }
      break;
  }
  
  return {
    isValid: missingKeys.length === 0,
    missingKeys
  };
}
