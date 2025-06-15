// Utility functions for GPS and location handling

export interface GPSCoordinates {
  latitude: number;
  longitude: number;
  altitude?: number;
}

export interface LocationData {
  coordinates?: GPSCoordinates;
  address?: string;
  timestamp?: Date;
}

// Extract GPS coordinates from EXIF data
export function extractGPSFromExif(exifData: any): GPSCoordinates | null {
  if (!exifData || !exifData.GPS) return null;
  
  try {
    const gps = exifData.GPS;
    
    // Check if we have the required GPS data
    if (!gps.GPSLatitude || !gps.GPSLongitude || !gps.GPSLatitudeRef || !gps.GPSLongitudeRef) {
      return null;
    }
    
    // Convert DMS (Degrees, Minutes, Seconds) to decimal degrees
    const latitude = convertDMSToDD(
      gps.GPSLatitude[0],
      gps.GPSLatitude[1],
      gps.GPSLatitude[2],
      gps.GPSLatitudeRef
    );
    
    const longitude = convertDMSToDD(
      gps.GPSLongitude[0],
      gps.GPSLongitude[1],
      gps.GPSLongitude[2],
      gps.GPSLongitudeRef
    );
    
    const altitude = gps.GPSAltitude ? parseFloat(gps.GPSAltitude) : undefined;
    
    return {
      latitude,
      longitude,
      altitude
    };
  } catch (error) {
    console.error('Error extracting GPS from EXIF:', error);
    return null;
  }
}

// Convert DMS (Degrees, Minutes, Seconds) to Decimal Degrees
function convertDMSToDD(degrees: number, minutes: number, seconds: number, direction: string): number {
  let dd = degrees + minutes / 60 + seconds / 3600;
  
  if (direction === 'S' || direction === 'W') {
    dd = dd * -1;
  }
  
  return dd;
}

// Get current GPS location from browser
export function getCurrentLocation(): Promise<GPSCoordinates> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          altitude: position.coords.altitude || undefined
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  });
}

// Reverse geocoding to get address from coordinates
export async function getAddressFromCoordinates(lat: number, lng: number): Promise<string> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch address');
    }
    
    const data = await response.json();
    return data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  } catch (error) {
    console.error('Error getting address:', error);
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }
}

// Forward geocoding to get coordinates from address
export async function getCoordinatesFromAddress(address: string): Promise<GPSCoordinates | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
    );
    
    if (!response.ok) {
      throw new Error('Failed to search address');
    }
    
    const data = await response.json();
    
    if (data.length > 0) {
      return {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon)
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error searching address:', error);
    return null;
  }
}

// Calculate distance between two GPS coordinates (in kilometers)
export function calculateDistance(coord1: GPSCoordinates, coord2: GPSCoordinates): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(coord2.latitude - coord1.latitude);
  const dLon = toRadians(coord2.longitude - coord1.longitude);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(coord1.latitude)) * Math.cos(toRadians(coord2.latitude)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// Format coordinates for display
export function formatCoordinates(coordinates: GPSCoordinates): string {
  const lat = Math.abs(coordinates.latitude);
  const lng = Math.abs(coordinates.longitude);
  const latDir = coordinates.latitude >= 0 ? 'N' : 'S';
  const lngDir = coordinates.longitude >= 0 ? 'E' : 'W';
  
  return `${lat.toFixed(6)}°${latDir}, ${lng.toFixed(6)}°${lngDir}`;
}