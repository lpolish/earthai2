'use client';

import React, { useState, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L, { LatLng, Map as LeafletMap } from 'leaflet';
import MapControls from './MapControls';

// Fix for default icon issue with Webpack
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Define Tile Layers
const tileLayers = [
  {
    name: 'Standard',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  },
  {
    name: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
  },
  {
    name: 'Dark',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
  },
  {
    name: 'Relief',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
  }
];

export interface MapViewport {
  center: L.LatLng;
  zoom: number;
  bounds: L.LatLngBounds;
}

interface MapProps {
  onMapClick?: (latlng: LatLng) => void;
  onViewportChange?: (viewport: MapViewport) => void;
}

const MapEvents: React.FC<{
  onMapClick?: (latlng: LatLng) => void;
  onViewportChange?: (viewport: MapViewport) => void;
}> = ({ onMapClick, onViewportChange }) => {
  const map = useMapEvents({
    click(e) {
      console.log('Map clicked:', e.latlng);
      onMapClick?.(e.latlng);
    },
    moveend() {
      if (onViewportChange) {
        const center = map.getCenter();
        const zoom = map.getZoom();
        const bounds = map.getBounds();
        onViewportChange({ center, zoom, bounds });
      }
    },
    zoomend() {
      if (onViewportChange) {
        const center = map.getCenter();
        const zoom = map.getZoom();
        const bounds = map.getBounds();
        onViewportChange({ center, zoom, bounds });
      }
    }
  });
  return null;
};

const Map: React.FC<MapProps> = ({ onMapClick, onViewportChange }) => {
  const [position, setPosition] = useState<L.LatLngExpression>([51.505, -0.09]);
  const [zoom, setZoom] = useState<number>(13);
  const [currentTileLayer, setCurrentTileLayer] = useState(tileLayers[0]);
  const [markerPosition, setMarkerPosition] = useState<LatLng | null>(null);
  const mapRef = useRef<LeafletMap>(null);

  const handleTileLayerChange = (url: string) => {
    const layer = tileLayers.find(l => l.url === url);
    if (layer) {
      setCurrentTileLayer(layer);
    }
  };

  const handleLocateUser = useCallback(() => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (location) => {
        const userLatLng = L.latLng(location.coords.latitude, location.coords.longitude);
        mapRef.current?.flyTo(userLatLng, 15);
        setMarkerPosition(userLatLng);
        if (onMapClick) {
          onMapClick(userLatLng);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        alert(`Error getting location: ${error.message}`);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, [onMapClick]);

  return (
    <div className="relative h-full w-full">
      <MapContainer
        ref={mapRef}
        center={position}
        zoom={zoom}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution={currentTileLayer.attribution}
          url={currentTileLayer.url}
        />
        {markerPosition && (
          <Marker position={markerPosition}>
            <Popup>
              Location: <br />
              Lat: {markerPosition.lat.toFixed(4)}, Lng: {markerPosition.lng.toFixed(4)}
            </Popup>
          </Marker>
        )}
        <MapEvents onMapClick={onMapClick} onViewportChange={onViewportChange} />
      </MapContainer>
      <MapControls
        zoom={zoom}
        center={position}
        tileLayers={tileLayers}
        currentTileLayerUrl={currentTileLayer.url}
        onTileLayerChange={handleTileLayerChange}
        onLocateUser={handleLocateUser}
      />
    </div>
  );
};

export default Map;
