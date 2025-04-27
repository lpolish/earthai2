'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Rnd } from 'react-rnd';
import { LatLng } from 'leaflet';
// Update import from @vercel/ai/react to ai/react
import { useChat } from 'ai/react';
import { MapViewport } from './Map';
import { getLocationContext } from '@/services/geocoding';
import { useLocation } from '@/contexts/LocationContext';

interface Message {
  id: string; // useChat uses string IDs
  text: string;
  sender: 'user' | 'ai' | 'system' | 'error';
}

interface ChatWindowProps {
  clickedCoords: LatLng | null;
  viewport: MapViewport | null;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ clickedCoords, viewport }) => {
  const [initialX, setInitialX] = useState<number | undefined>(undefined);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { locationContext, updateLocationContext } = useLocation();
  const lastViewportRef = useRef<MapViewport | null>(null);

  // Memoize the viewport update handler
  const handleViewportUpdate = useCallback((viewport: MapViewport) => {
    if (!lastViewportRef.current || 
        lastViewportRef.current.center.lat !== viewport.center.lat ||
        lastViewportRef.current.center.lng !== viewport.center.lng ||
        lastViewportRef.current.zoom !== viewport.zoom) {
      lastViewportRef.current = viewport;
      updateLocationContext(viewport);
    }
  }, [updateLocationContext]);

  // Update location context when viewport changes
  useEffect(() => {
    if (viewport) {
      handleViewportUpdate(viewport);
    }
  }, [viewport, handleViewportUpdate]);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
  } = useChat({
    api: '/api/chat',
    body: {
      locationContext: locationContext || 'Initializing location context...',
    },
    onError: (err) => {
      console.error('Chat hook error:', err);
    },
    onFinish: () => {
      console.log('Chat stream finished');
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Initialize position only on client side
  useEffect(() => {
    if (typeof window === 'undefined') return;
    setInitialX(window.innerWidth - 370);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  if (initialX === undefined) {
    return null;
  }

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (input.trim()) {
      console.log('Submitting chat with location context:', locationContext);
      await handleSubmit(e);
    }
  };

  return (
    <Rnd
      default={{
        x: initialX,
        y: 20,
        width: 350,
        height: 450,
      }}
      minWidth={250}
      minHeight={200}
      bounds="parent"
      className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-300 flex flex-col"
      dragHandleClassName="chat-drag-handle"
    >
      <div className="chat-drag-handle bg-gray-100 p-2 cursor-move border-b border-gray-300 pointer-events-auto">
        <h2 className="text-sm font-semibold text-gray-700">EarthAI Chat (Gemini)</h2>
      </div>

      <div className="flex-grow p-3 overflow-y-auto space-y-2 flex flex-col pointer-events-auto">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`p-2 rounded-lg max-w-[85%] text-sm ${ 
              msg.role === 'user' ? 'bg-blue-500 text-white self-end ml-auto' : 
              msg.role === 'assistant' ? 'bg-gray-200 text-gray-800 self-start mr-auto' : 
              'bg-yellow-100 text-yellow-800 text-xs italic self-center mx-auto' 
            }`}
          >
            <p style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</p>
          </div>
        ))}
        {isLoading && (
          <div className="p-2 self-start mr-auto">
            <span className="inline-block w-2 h-2 bg-gray-400 rounded-full animate-bounce mr-1"></span>
            <span className="inline-block w-2 h-2 bg-gray-400 rounded-full animate-bounce mr-1 delay-75"></span>
            <span className="inline-block w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></span>
          </div>
        )}
        {error && (
          <div className="p-2 rounded-lg max-w-[85%] text-sm bg-red-100 text-red-700 text-xs self-center mx-auto">
            <p>Error: {error.message}</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleFormSubmit} className="p-2 border-t border-gray-300 flex items-center pointer-events-auto">
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          placeholder="Ask EarthAI..."
          className="flex-grow border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 text-gray-900"
          disabled={isLoading}
        />
        <button
          type="submit"
          className="ml-2 bg-blue-500 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
          disabled={isLoading || !input.trim()}
        >
          Send
        </button>
      </form>
    </Rnd>
  );
};

export default ChatWindow;
