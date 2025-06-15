import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import { Icon, LatLngTuple } from "leaflet";
import { getAddressFromCoordinates, getCurrentLocation, type GPSCoordinates } from "@/lib/gps-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Navigation, Search, Target } from "lucide-react";
import "leaflet/dist/leaflet.css";

// Fix for default markers in React Leaflet
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface LocationPickerProps {
  onLocationSelect: (location: { lat: number; lng: number; address?: string }) => void;
  initialLocation?: { lat: number; lng: number };
  className?: string;
}

function LocationMarker({ position, onLocationSelect }: { 
  position: LatLngTuple | null; 
  onLocationSelect: (location: { lat: number; lng: number; address?: string }) => void;
}) {
  const [marker, setMarker] = useState<LatLngTuple | null>(position);
  const [address, setAddress] = useState<string>("");

  const map = useMapEvents({
    click(e) {
      const newPosition: LatLngTuple = [e.latlng.lat, e.latlng.lng];
      setMarker(newPosition);
      
      // Get address for the clicked location
      getAddressFromCoordinates(e.latlng.lat, e.latlng.lng)
        .then(addr => {
          setAddress(addr);
          onLocationSelect({
            lat: e.latlng.lat,
            lng: e.latlng.lng,
            address: addr
          });
        })
        .catch(() => {
          onLocationSelect({
            lat: e.latlng.lat,
            lng: e.latlng.lng
          });
        });
    },
  });

  return marker ? (
    <Marker position={marker}>
      <Popup>
        <div className="p-2">
          <div className="font-semibold mb-1">Position sélectionnée</div>
          <div className="text-sm text-gray-600 mb-2">
            {marker[0].toFixed(6)}, {marker[1].toFixed(6)}
          </div>
          {address && (
            <div className="text-sm text-gray-700">{address}</div>
          )}
        </div>
      </Popup>
    </Marker>
  ) : null;
}

export default function LocationPicker({ onLocationSelect, initialLocation, className = "" }: LocationPickerProps) {
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number; address?: string } | null>(
    initialLocation ? { lat: initialLocation.lat, lng: initialLocation.lng } : null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [currentPosition, setCurrentPosition] = useState<{ lat: number; lng: number } | null>(null);
  const mapRef = useRef<any>(null);
  const { toast } = useToast();

  // Get user's current position
  useEffect(() => {
    getCurrentLocation()
      .then(coords => {
        setCurrentPosition({ lat: coords.latitude, lng: coords.longitude });
      })
      .catch(error => {
        console.warn("Could not get current location:", error);
      });
  }, []);

  const defaultCenter: LatLngTuple = selectedLocation 
    ? [selectedLocation.lat, selectedLocation.lng] 
    : currentPosition 
    ? [currentPosition.lat, currentPosition.lng] 
    : [51.505, -0.09]; // London default

  const handleLocationSelect = (location: { lat: number; lng: number; address?: string }) => {
    setSelectedLocation(location);
    onLocationSelect(location);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`
      );
      
      if (!response.ok) {
        throw new Error('Erreur de recherche');
      }

      const results = await response.json();
      
      if (results.length > 0) {
        const result = results[0];
        const location = {
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon),
          address: result.display_name
        };
        
        setSelectedLocation(location);
        onLocationSelect(location);
        
        // Center map on found location
        if (mapRef.current) {
          mapRef.current.setView([location.lat, location.lng], 15);
        }
        
        toast({
          title: "Lieu trouvé",
          description: result.display_name,
        });
      } else {
        toast({
          title: "Aucun résultat",
          description: "Aucun lieu trouvé pour cette recherche",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erreur de recherche",
        description: "Impossible de rechercher ce lieu",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleUseCurrentLocation = () => {
    getCurrentLocation()
      .then(async coords => {
        const address = await getAddressFromCoordinates(coords.latitude, coords.longitude);
        const location = {
          lat: coords.latitude,
          lng: coords.longitude,
          address
        };
        
        setSelectedLocation(location);
        onLocationSelect(location);
        
        // Center map on current location
        if (mapRef.current) {
          mapRef.current.setView([coords.latitude, coords.longitude], 15);
        }
        
        toast({
          title: "Position actuelle utilisée",
          description: address,
        });
      })
      .catch(error => {
        toast({
          title: "Erreur de géolocalisation",
          description: "Impossible d'obtenir votre position actuelle",
          variant: "destructive",
        });
      });
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Bar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Rechercher un lieu
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Rechercher une adresse, ville, pays..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={isSearching}>
              <Search className="w-4 h-4" />
            </Button>
          </div>
          
          <Button 
            onClick={handleUseCurrentLocation} 
            variant="outline" 
            className="w-full"
          >
            <Navigation className="w-4 h-4 mr-2" />
            Utiliser ma position actuelle
          </Button>
        </CardContent>
      </Card>

      {/* Selected Location Info */}
      {selectedLocation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Lieu sélectionné
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                </Badge>
              </div>
              
              {selectedLocation.address && (
                <div className="text-sm text-gray-700">
                  {selectedLocation.address}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Map */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Carte interactive
            <Badge variant="outline" className="ml-auto">
              Cliquez pour sélectionner
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-96 w-full">
            <MapContainer
              center={defaultCenter}
              zoom={13}
              style={{ height: "100%", width: "100%" }}
              ref={mapRef}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              <LocationMarker 
                position={selectedLocation ? [selectedLocation.lat, selectedLocation.lng] : null}
                onLocationSelect={handleLocationSelect}
              />
              
              {/* Show current position if available */}
              {currentPosition && (!selectedLocation || (
                selectedLocation.lat !== currentPosition.lat || 
                selectedLocation.lng !== currentPosition.lng
              )) && (
                <Marker position={[currentPosition.lat, currentPosition.lng]}>
                  <Popup>
                    <div className="p-2">
                      <div className="font-semibold mb-1">Votre position</div>
                      <div className="text-sm text-blue-600">
                        {currentPosition.lat.toFixed(6)}, {currentPosition.lng.toFixed(6)}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              )}
            </MapContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}