import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from "react-leaflet";
import { Icon, LatLngTuple } from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default markers in react-leaflet
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Photo {
  id: number;
  filename: string;
  originalName: string;
  url: string;
  tripId: number | null;
  albumId: number | null;
  caption: string | null;
  location: string | null;
  latitude: string | null;
  longitude: string | null;
  uploadedAt: string;
  metadata: string | null;
}

interface Trip {
  id: number;
  title: string;
  description: string | null;
  location: string;
  startDate: string;
  endDate: string | null;
  coverPhotoUrl: string | null;
  latitude: string | null;
  longitude: string | null;
  routeData: string | null;
}

interface TripMapProps {
  trip?: Trip;
  photos?: Photo[];
  onLocationSelect?: (lat: number, lng: number) => void;
  editable?: boolean;
  height?: string;
  className?: string;
}

// Component to handle map clicks for location selection
function LocationSelector({ onLocationSelect }: { onLocationSelect?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      if (onLocationSelect) {
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

export default function TripMap({ 
  trip, 
  photos = [], 
  onLocationSelect, 
  editable = false, 
  height = "400px",
  className = ""
}: TripMapProps) {
  const [center, setCenter] = useState<LatLngTuple>([51.505, -0.09]); // Default: London
  const [zoom, setZoom] = useState(13);
  const [routePoints, setRoutePoints] = useState<LatLngTuple[]>([]);

  useEffect(() => {
    // Set map center based on trip location or first photo with coordinates
    if (trip?.latitude && trip?.longitude) {
      setCenter([parseFloat(trip.latitude), parseFloat(trip.longitude)]);
      setZoom(10);
    } else if (photos.length > 0) {
      const photoWithCoords = photos.find(p => p.latitude && p.longitude);
      if (photoWithCoords) {
        setCenter([parseFloat(photoWithCoords.latitude!), parseFloat(photoWithCoords.longitude!)]);
        setZoom(12);
      }
    }

    // Parse route data if available
    if (trip?.routeData) {
      try {
        const route = JSON.parse(trip.routeData);
        setRoutePoints(route);
      } catch (error) {
        console.error('Error parsing route data:', error);
      }
    }
  }, [trip, photos]);

  // Get photos with valid coordinates
  const geotaggedPhotos = photos.filter(photo => 
    photo.latitude && photo.longitude && 
    !isNaN(parseFloat(photo.latitude)) && 
    !isNaN(parseFloat(photo.longitude))
  );

  return (
    <div className={`rounded-lg overflow-hidden ${className}`} style={{ height }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
        className="z-0"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {editable && <LocationSelector onLocationSelect={onLocationSelect} />}
        
        {/* Trip main location marker */}
        {trip?.latitude && trip?.longitude && (
          <Marker position={[parseFloat(trip.latitude), parseFloat(trip.longitude)]}>
            <Popup>
              <div className="text-center">
                <h4 className="font-semibold text-adventure-blue">{trip.title}</h4>
                <p className="text-sm text-gray-600">{trip.location}</p>
                <p className="text-xs text-gray-500">
                  {new Date(trip.startDate).toLocaleDateString()}
                  {trip.endDate && ` - ${new Date(trip.endDate).toLocaleDateString()}`}
                </p>
              </div>
            </Popup>
          </Marker>
        )}
        
        {/* Photo location markers */}
        {geotaggedPhotos.map((photo) => (
          <Marker
            key={photo.id}
            position={[parseFloat(photo.latitude!), parseFloat(photo.longitude!)]}
            icon={new Icon({
              iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
              shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
              shadowSize: [41, 41]
            })}
          >
            <Popup>
              <div className="text-center max-w-48">
                <img 
                  src={photo.url} 
                  alt={photo.originalName}
                  className="w-full h-32 object-cover rounded mb-2"
                />
                <h5 className="font-medium text-sm">{photo.originalName}</h5>
                {photo.caption && (
                  <p className="text-xs text-gray-600 mt-1">{photo.caption}</p>
                )}
                {photo.location && (
                  <p className="text-xs text-gray-500 mt-1">{photo.location}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(photo.uploadedAt).toLocaleDateString()}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
        
        {/* Route polyline */}
        {routePoints.length > 1 && (
          <Polyline
            positions={routePoints}
            color="#ff6b35"
            weight={4}
            opacity={0.7}
          />
        )}
      </MapContainer>
    </div>
  );
}