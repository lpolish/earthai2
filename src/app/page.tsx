'use client'; // Add this directive

import dynamic from 'next/dynamic';
import React, { useState, Suspense, useRef } from 'react';
import { LatLng } from 'leaflet';
import { MapViewport } from '@/components/Map';

const Map = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-screen w-screen"><p>Loading map...</p></div>, // Centered loading
});

const ChatWindow = dynamic(() => import('@/components/ChatWindow'), {
  ssr: false,
  loading: () => null,
});

export default function Home() {
  const [clickedCoords, setClickedCoords] = useState<LatLng | null>(null);
  const [viewport, setViewport] = useState<MapViewport | null>(null);
  const mapRef = useRef<L.Map>(null);

  const handleMapClick = (latlng: LatLng) => {
    console.log('Map clicked in Home page:', latlng);
    setClickedCoords(latlng);
  };

  const handleViewportChange = (newViewport: MapViewport) => {
    console.log('Viewport changed:', newViewport);
    setViewport(newViewport);
  };

  return (
    <div className="h-screen w-screen relative overflow-hidden"> 
      {/* Map container */}
      <div className="absolute inset-0 z-0">
        <Suspense fallback={<div className="flex items-center justify-center h-screen w-screen"><p>Loading map...</p></div>}>
          <Map 
            onMapClick={handleMapClick}
            onViewportChange={handleViewportChange}
            mapRef={mapRef}
          />
        </Suspense>
      </div>
      {/* Chat window container - Restore absolute positioning and pointer-events */}
      <div className="absolute inset-0 z-[1001] pointer-events-none"> 
        <Suspense fallback={null}>
          <ChatWindow 
            clickedCoords={clickedCoords}
            viewport={viewport}
            mapRef={mapRef}
          />
        </Suspense>
      </div>
    </div>
  );
}
