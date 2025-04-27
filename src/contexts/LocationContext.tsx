'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { MapViewport } from '@/components/Map';
import { getLocationContext } from '@/services/geocoding';
import L from 'leaflet';

interface LocationContextType {
  locationContext: string;
  updateLocationContext: (viewport: MapViewport) => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [locationContext, setLocationContext] = useState<string>('');

  const updateLocationContext = (viewport: MapViewport) => {
    if (typeof window === 'undefined') return;
    
    console.log('Updating location context for viewport:', viewport);
    
    getLocationContext(viewport)
      .then(context => {
        const fullContext = `Current Map View:
- Center: (${viewport.center.lat.toFixed(4)}, ${viewport.center.lng.toFixed(4)})
- Zoom Level: ${viewport.zoom}
- Visible Area: ${(viewport.bounds.getNorth() - viewport.bounds.getSouth()).toFixed(2)}° latitude × ${(viewport.bounds.getEast() - viewport.bounds.getWest()).toFixed(2)}° longitude
- Location Description: ${context}`;

        console.log('Setting location context:', fullContext);
        setLocationContext(fullContext);
      })
      .catch(error => {
        console.error('Error getting location context:', error);
        const fallbackContext = `Current Map View:
- Center: (${viewport.center.lat.toFixed(4)}, ${viewport.center.lng.toFixed(4)})
- Zoom Level: ${viewport.zoom}
- Visible Area: ${(viewport.bounds.getNorth() - viewport.bounds.getSouth()).toFixed(2)}° latitude × ${(viewport.bounds.getEast() - viewport.bounds.getWest()).toFixed(2)}° longitude
- Note: Reverse geocoding failed, using coordinates only`;

        console.log('Setting fallback location context:', fallbackContext);
        setLocationContext(fallbackContext);
      });
  };

  // Initialize with default viewport only on client side
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const defaultCenter = L.latLng(51.505, -0.09);
    const defaultZoom = 13;
    const defaultBounds = L.latLngBounds(
      L.latLng(51.505 - 0.1, -0.09 - 0.1),
      L.latLng(51.505 + 0.1, -0.09 + 0.1)
    );
    
    const defaultViewport: MapViewport = {
      center: defaultCenter,
      zoom: defaultZoom,
      bounds: defaultBounds
    };
    
    updateLocationContext(defaultViewport);
  }, []);

  return (
    <LocationContext.Provider value={{ locationContext, updateLocationContext }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
} 