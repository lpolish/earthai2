import { LatLng } from 'leaflet';

export interface LocationInfo {
  name: string;
  city?: string;
  state?: string;
  country?: string;
  formatted: string;
}

export async function reverseGeocode(latlng: LatLng): Promise<LocationInfo> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${latlng.lat}&lon=${latlng.lng}&format=json`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch location info');
    }

    const data = await response.json();
    
    return {
      name: data.name || data.display_name.split(',')[0],
      city: data.address?.city || data.address?.town || data.address?.village,
      state: data.address?.state,
      country: data.address?.country,
      formatted: data.display_name,
    };
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    throw error;
  }
}

export async function getLocationContext(viewport: { center: LatLng; zoom: number }): Promise<string> {
  try {
    const locationInfo = await reverseGeocode(viewport.center);
    const zoomDescription = getZoomLevelDescription(viewport.zoom);
    
    return `You are viewing ${zoomDescription} of ${locationInfo.formatted}. ` +
           `The center coordinates are (${viewport.center.lat.toFixed(4)}, ${viewport.center.lng.toFixed(4)}).`;
  } catch (error) {
    return `You are viewing the map at coordinates (${viewport.center.lat.toFixed(4)}, ${viewport.center.lng.toFixed(4)}) ` +
           `with a zoom level of ${viewport.zoom}.`;
  }
}

function getZoomLevelDescription(zoom: number): string {
  if (zoom >= 18) return 'a very detailed view';
  if (zoom >= 15) return 'a street-level view';
  if (zoom >= 13) return 'a neighborhood view';
  if (zoom >= 11) return 'a city view';
  if (zoom >= 8) return 'a regional view';
  if (zoom >= 6) return 'a state/province level view';
  if (zoom >= 4) return 'a country-level view';
  return 'a continental/global view';
} 