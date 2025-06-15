import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { Icon, LatLngTuple } from "leaflet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Navigation, Search } from "lucide-react";
import "leaflet/dist/leaflet.css";

// Fix for default markers
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface LocationPickerProps {
  onLocationSelect: (location: { lat: number; lng: number; address?: string }) => void;
  initialLocation?: { lat: number; lng: number };
  className?: string;
}

function LocationMarker({ position, onLocationSelect }: { 
  position: LatLngTuple | null; 
  onLocationSelect: (lat: number, lng: number) => void;
}) {
  const map = useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });

  return position === null ? null : (
    <Marker position={position}>
    </Marker>
  );
}

export default function LocationPicker({ onLocationSelect, initialLocation, className = "" }: LocationPickerProps) {
  const [position, setPosition] = useState<LatLngTuple | null>(
    initialLocation ? [initialLocation.lat, initialLocation.lng] : null
  );
  const [address, setAddress] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const handleMapClick = async (lat: number, lng: number) => {
    setPosition([lat, lng]);
    
    // Reverse geocoding to get address
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
      );
      const data = await response.json();
      const displayName = data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      setAddress(displayName);
      
      onLocationSelect({ lat, lng, address: displayName });
    } catch (error) {
      console.error('Error getting address:', error);
      const coords = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      setAddress(coords);
      onLocationSelect({ lat, lng, address: coords });
    }
  };

  const handleSearchLocation = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
      );
      const data = await response.json();
      
      if (data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        handleMapClick(lat, lng);
      }
    } catch (error) {
      console.error('Error searching location:', error);
    }
  };

  const getCurrentLocation = () => {
    setIsGettingLocation(true);
    
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          handleMapClick(lat, lng);
          setIsGettingLocation(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          setIsGettingLocation(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setIsGettingLocation(false);
    }
  };

  const defaultCenter: LatLngTuple = position || [51.505, -0.09]; // London default

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search and location controls */}
      <div className="space-y-2">
        <Label htmlFor="location-search">Search Location</Label>
        <div className="flex gap-2">
          <Input
            id="location-search"
            placeholder="Enter city, address, or landmark..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearchLocation()}
          />
          <Button 
            onClick={handleSearchLocation}
            variant="outline"
            size="icon"
          >
            <Search className="w-4 h-4" />
          </Button>
          <Button 
            onClick={getCurrentLocation}
            variant="outline"
            size="icon"
            disabled={isGettingLocation}
          >
            <Navigation className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Selected location display */}
      {address && (
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-adventure-blue mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">Selected Location:</p>
              <p className="text-xs text-gray-600">{address}</p>
              {position && (
                <p className="text-xs text-gray-400 mt-1">
                  {position[0].toFixed(6)}, {position[1].toFixed(6)}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Interactive map */}
      <div className="h-64 rounded-lg overflow-hidden border">
        <MapContainer
          center={defaultCenter}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
          className="z-0"
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <LocationMarker position={position} onLocationSelect={handleMapClick} />
        </MapContainer>
      </div>

      <p className="text-xs text-gray-500 text-center">
        Click on the map to select a location, or use the search box and GPS button above
      </p>
    </div>
  );
}