'use client';

import React from 'react';
import L from 'leaflet';

interface TileLayerData {
  name: string;
  url: string;
  attribution: string;
}

interface MapControlsProps {
  zoom: number;
  center: L.LatLngExpression;
  tileLayers: TileLayerData[];
  currentTileLayerUrl: string;
  onTileLayerChange: (url: string) => void;
  onLocateUser: () => void; // Add callback for locating user
}

const MapControls: React.FC<MapControlsProps> = ({
  zoom,
  center,
  tileLayers,
  currentTileLayerUrl,
  onTileLayerChange,
  onLocateUser, // Destructure the new prop
}) => {
  const formatCoord = (coord: number) => coord.toFixed(4);
  const centerLatLng = L.latLng(center);

  return (
    // Restore high z-index to ensure controls are above map elements
    <div className="absolute bottom-2 left-2 md:bottom-4 md:left-4 z-[1000] bg-white bg-opacity-85 p-2 rounded-lg shadow-lg text-xs text-gray-800 space-y-1.5 pointer-events-auto border border-gray-200">
      {/* Coordinates Display */}
      <div className="font-mono">
        Lat: {formatCoord(centerLatLng.lat)}, Lng: {formatCoord(centerLatLng.lng)}
      </div>
      {/* Zoom Level Display */}
      <div className="font-mono">Zoom: {zoom}</div>
      {/* Map Type Selector */}
      <div className="flex items-center space-x-1">
        <label htmlFor="map-type-select" className="font-medium">Layer:</label>
        <select
          id="map-type-select"
          value={currentTileLayerUrl}
          onChange={(e) => onTileLayerChange(e.target.value)}
          className="border border-gray-300 rounded px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
        >
          {tileLayers.map((layer) => (
            <option key={layer.url} value={layer.url}>
              {layer.name}
            </option>
          ))}
        </select>
      </div>
      {/* Locate User Button */}
      <div>
        <button
          onClick={onLocateUser}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium py-1 px-2 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          title="Find my location"
        >
          Find Me
        </button>
      </div>
    </div>
  );
};

export default MapControls;
