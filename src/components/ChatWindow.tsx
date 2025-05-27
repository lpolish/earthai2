'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Rnd } from 'react-rnd';
import { LatLng } from 'leaflet';
import { useChat } from 'ai/react';
import { MapViewport } from './Map';
import { getLocationContext } from '../services/geocoding';
import { useLocation } from '../contexts/LocationContext';
import L from 'leaflet';
import { useSession, signIn } from 'next-auth/react';
import Link from 'next/link';
import AuthModal from './AuthModal';

interface Message {
  id: string; // useChat uses string IDs
  text: string;
  sender: 'user' | 'ai' | 'system' | 'error';
}

interface ChatWindowProps {
  clickedCoords: LatLng | null;
  viewport: MapViewport | null;
  mapRef?: React.RefObject<L.Map>;
}

const DEFAULT_SIZE = { width: 350, height: 450 };
const DEFAULT_POSITION = { x: 100, y: 40 };

const ChatWindow: React.FC<ChatWindowProps> = ({ clickedCoords, viewport, mapRef }) => {
  const [initialX, setInitialX] = useState<number | undefined>(undefined);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [windowState, setWindowState] = useState({
    width: DEFAULT_SIZE.width,
    height: DEFAULT_SIZE.height,
    x: DEFAULT_POSITION.x,
    y: DEFAULT_POSITION.y,
  });
  const [prevState, setPrevState] = useState(windowState);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { locationContext, updateLocationContext } = useLocation();
  const lastViewportRef = useRef<MapViewport | null>(null);
  const { data: session, status } = useSession();

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
      console.error('Error details:', err.message);
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

  // Minimize/Maximize logic
  const handleMinimize = () => {
    if (!isMinimized) setPrevState(windowState);
    setIsMinimized((min) => !min);
    setIsMaximized(false);
  };
  const handleMaximize = () => {
    if (!isMaximized) setPrevState(windowState);
    setIsMaximized((max) => !max);
    setIsMinimized(false);
  };

  // Restore logic
  const getSize = () => {
    if (isMaximized) return { width: '100%', height: '100%' };
    if (isMinimized) return { width: 200, height: 44 };
    return { width: windowState.width, height: windowState.height };
  };
  const getPosition = () => {
    if (isMaximized) return { x: 0, y: 0 };
    if (isMinimized) return { x: window.innerWidth - 220, y: window.innerHeight - 64 };
    return { x: windowState.x, y: windowState.y };
  };

  // Drag/resize handlers
  const handleDragStop = (e: any, d: any) => {
    setWindowState((prev) => ({ ...prev, x: d.x, y: d.y }));
  };
  const handleResizeStop = (e: any, dir: any, ref: any, delta: any, pos: any) => {
    const newWidth = parseInt(ref.style.width, 10);
    const newHeight = parseInt(ref.style.height, 10);
    setWindowState({
      width: newWidth,
      height: newHeight,
      x: pos.x,
      y: pos.y,
    });
  };

  // Add event handlers to prevent map zoom events
  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
  };

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

  const handleClearChat = () => {
    setShowClearConfirm(true);
  };

  const confirmClearChat = () => {
    // Reset the chat by setting messages to empty array
    messages.length = 0;
    setShowClearConfirm(false);
  };

  const cancelClearChat = () => {
    setShowClearConfirm(false);
  };

  const parseMapLinks = (text: string): React.ReactNode => {
    const mapLinkRegex = /\[([^\]]+)\]\(map:(-?\d+\.\d+),(-?\d+\.\d+),(\d+)\)/g;
    const parts: (string | React.ReactElement)[] = [];
    let lastIndex = 0;
    let match;

    while ((match = mapLinkRegex.exec(text)) !== null) {
      // Add text before the link
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }

      // Add the map link
      const [_, locationName, lat, lng, zoom] = match;
      parts.push(
        <button
          key={match.index}
          onClick={() => {
            const newCenter = new LatLng(parseFloat(lat), parseFloat(lng));
            const newZoom = parseInt(zoom);
            // Update the map viewport using the provided mapRef
            if (mapRef?.current) {
              mapRef.current.flyTo(newCenter, newZoom);
            }
          }}
          className="text-blue-600 hover:text-blue-800 underline cursor-pointer"
        >
          {locationName}
        </button>
      );

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  // Show loading state while checking auth
  if (status === 'loading') {
    return (
      <div className="fixed bottom-8 right-8 z-[2000] pointer-events-auto bg-white bg-opacity-95 rounded-lg shadow-xl p-6 flex items-center justify-center min-w-[320px] min-h-[120px] border border-gray-200">
        <span className="text-gray-700 text-sm">Checking authentication...</span>
      </div>
    );
  }

  // If not authenticated, show login/register modal trigger
  if (!session) {
    return (
      <>
        <div
          className={`fixed bottom-8 right-8 z-[2000] pointer-events-auto bg-white bg-opacity-95 rounded-lg shadow-xl border border-gray-200 flex flex-col items-center min-w-[220px] min-h-[44px] ${isMinimized ? 'w-[220px] h-[44px] p-0' : 'p-6'}`}
          style={{ transition: 'all 0.2s', overflow: 'hidden' }}
        >
          <div className="w-full flex items-center justify-between">
            <h2 className="text-lg font-semibold text-blue-700 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
              EarthAI Chat
            </h2>
            <button
              onClick={handleMinimize}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-blue-400 transition-colors text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 ml-2"
              title={isMinimized ? 'Restore' : 'Minimize'}
              type="button"
            >
              {isMinimized ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><rect x="5" y="5" width="14" height="14" rx="2" /></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><line x1="6" y1="18" x2="18" y2="18" stroke="currentColor" strokeWidth={2} strokeLinecap="round" /></svg>
              )}
            </button>
          </div>
          {!isMinimized && (
            <>
              <p className="text-gray-700 text-sm mb-4 text-center mt-4">Sign in to use the chat assistant.</p>
              
              {/* Google Sign-in Button - Featured */}
              <button
                onClick={async () => {
                  try {
                    await signIn('google', { callbackUrl: '/' });
                  } catch (error) {
                    console.error('Google sign-in error:', error);
                  }
                }}
                className="w-full mb-3 inline-flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>
              
              <div className="relative mb-3">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-white text-gray-500">or</span>
                </div>
              </div>
              
              <button
                onClick={() => { setAuthModalMode('login'); setAuthModalOpen(true); }}
                className="w-full mb-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 transition-colors"
              >
                Sign in with email
              </button>
              <button
                onClick={() => { setAuthModalMode('register'); setAuthModalOpen(true); }}
                className="text-blue-600 hover:underline text-sm w-full text-center"
              >
                Create an account
              </button>
            </>
          )}
        </div>
        <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} initialMode={authModalMode} />
      </>
    );
  }

  return (
    <Rnd
      size={getSize()}
      position={getPosition()}
      minWidth={isMinimized ? 200 : 300}
      minHeight={isMinimized ? 44 : 200}
      bounds="parent"
      enableResizing={!isMinimized && !isMaximized}
      disableDragging={isMinimized}
      onDragStop={handleDragStop}
      onResizeStop={handleResizeStop}
      className={`bg-white shadow-xl rounded-lg overflow-hidden border border-gray-200 flex flex-col backdrop-blur-sm bg-opacity-95 pointer-events-auto ${isMinimized ? 'minimized-chat' : ''}`}
      dragHandleClassName="chat-drag-handle"
      style={{
        willChange: 'transform',
        zIndex: 2000,
        height: isMinimized ? '44px' : `${windowState.height}px`,
      }}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
    >
      {/* Fixed Header */}
      <div className="chat-drag-handle bg-gradient-to-r from-blue-500 to-blue-600 p-3 cursor-move border-b border-blue-400 pointer-events-auto flex justify-between items-center flex-shrink-0">
        <h2 className="text-sm font-semibold text-white flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          EarthAI Chat
        </h2>
        <div className="flex space-x-2">
          {!isMinimized && (
            <button
              onClick={handleClearChat}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-blue-400 transition-colors text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
              title="Clear Chat"
              type="button"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            </button>
          )}
          <button
            onClick={handleMinimize}
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-blue-400 transition-colors text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
            title={isMinimized ? 'Restore' : 'Minimize'}
            type="button"
          >
            {isMinimized ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><rect x="5" y="5" width="14" height="14" rx="2" /></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><line x1="6" y1="18" x2="18" y2="18" stroke="currentColor" strokeWidth={2} strokeLinecap="round" /></svg>
            )}
          </button>
          {!isMinimized && (
            <button
              onClick={handleMaximize}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-blue-400 transition-colors text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
              title={isMaximized ? 'Restore' : 'Maximize'}
              type="button"
            >
              {isMaximized ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><rect x="7" y="7" width="10" height="10" rx="2" /><rect x="3" y="3" width="10" height="10" rx="2" /></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><rect x="5" y="5" width="14" height="14" rx="2" /></svg>
              )}
            </button>
          )}
        </div>
      </div>

      {!isMinimized && (
        <div className="flex flex-col h-[calc(100%-44px)] pointer-events-auto" onWheel={handleWheel} onTouchStart={handleTouchStart}>
          {/* Scrollable Chat Area */}
          <div 
            className="flex-1 overflow-y-auto p-4 space-y-3 pointer-events-auto"
            onWheel={handleWheel}
            onTouchStart={handleTouchStart}
            style={{ overscrollBehavior: 'contain' }}
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`p-3 rounded-2xl max-w-[85%] text-sm shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-blue-500 text-white self-end ml-auto rounded-br-none' 
                    : msg.role === 'assistant' 
                    ? 'bg-gray-100 text-gray-800 self-start mr-auto rounded-bl-none' 
                    : 'bg-yellow-50 text-yellow-800 text-xs italic self-center mx-auto border border-yellow-200'
                }`}
              >
                <p className="whitespace-pre-wrap leading-relaxed">
                  {parseMapLinks(msg.content)}
                </p>
              </div>
            ))}
            {isLoading && (
              <div className="p-3 self-start mr-auto bg-gray-100 rounded-2xl rounded-bl-none shadow-sm">
                <div className="flex space-x-1">
                  <span className="inline-block w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                  <span className="inline-block w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></span>
                  <span className="inline-block w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></span>
                </div>
              </div>
            )}
            {error && (
              <div className="p-3 rounded-2xl max-w-[85%] text-sm bg-red-50 text-red-700 self-center mx-auto border border-red-200 shadow-sm">
                <p>Error: {error.message}</p>
              </div>
            )}
            {showClearConfirm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
                  <h3 className="text-lg font-semibold mb-4">Clear Chat History</h3>
                  <p className="text-gray-600 mb-6">Are you sure you want to clear all chat messages? This action cannot be undone.</p>
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={cancelClearChat}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmClearChat}
                      className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      Clear Chat
                    </button>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Fixed Input Area */}
          <form onSubmit={handleFormSubmit} className="p-3 border-t border-gray-200 bg-gray-50 flex items-center pointer-events-auto flex-shrink-0">
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder="Ask EarthAI about this location..."
              className="flex-grow border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 text-gray-900 placeholder-gray-400"
              disabled={isLoading}
            />
            <button
              type="submit"
              className="ml-2 bg-blue-500 text-white px-4 py-2 rounded-full text-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              disabled={isLoading || !input.trim()}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </form>
        </div>
      )}
      <AuthModal 
        open={authModalOpen} 
        onClose={() => setAuthModalOpen(false)} 
        initialMode={authModalMode}
      />
    </Rnd>
  );
};

export default ChatWindow;
