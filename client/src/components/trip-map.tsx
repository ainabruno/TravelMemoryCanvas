import { useState, useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle } from "react-leaflet";
import { Icon, LatLngTuple, LatLngBounds } from "leaflet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { MapPin, Camera, Route, Layers, ZoomIn, ZoomOut } from "lucide-react";
import "leaflet/dist/leaflet.css";

// Fix for default markers in React Leaflet
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Custom icons for different photo types
const createCustomIcon = (color: string) => new Icon({
  iconUrl: `data:image/svg+xml;base64,${btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 41" width="25" height="41">
      <path fill="${color}" stroke="#fff" stroke-width="2" d="M12.5 0C5.6 0 0 5.6 0 12.5c0 12.5 12.5 28.5 12.5 28.5s12.5-16 12.5-28.5C25 5.6 19.4 0 12.5 0z"/>
      <circle fill="#fff" cx="12.5" cy="12.5" r="6"/>
      <path fill="${color}" d="M12.5 8.5c-2.2 0-4 1.8-4 4s1.8 4 4 4 4-1.8 4-4-1.8-4-4-4z"/>
    </svg>
  `)}`,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const photoIcon = createCustomIcon('#3B82F6');
const tripStartIcon = createCustomIcon('#10B981');
const tripEndIcon = createCustomIcon('#EF4444');
const clusterIcon = createCustomIcon('#8B5CF6');

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

interface TripMapProps {
  trip?: any;
  photos: Photo[];
  height?: string;
  className?: string;
  showRoute?: boolean;
  showClusters?: boolean;
}

interface PhotoCluster {
  center: LatLngTuple;
  photos: Photo[];
  radius: number;
}

export default function TripMap({ 
  trip, 
  photos, 
  height = "400px", 
  className = "",
  showRoute = true,
  showClusters = true 
}: TripMapProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [mapView, setMapView] = useState<'satellite' | 'terrain' | 'street'>('street');

  // Convert photos to map points
  const mapPoints = useMemo(() => {
    return photos
      .filter(photo => photo.latitude && photo.longitude)
      .map(photo => ({
        ...photo,
        position: [parseFloat(photo.latitude!), parseFloat(photo.longitude!)] as LatLngTuple,
      }))
      .sort((a, b) => new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime());
  }, [photos]);

  // Calculate photo clusters
  const clusters = useMemo(() => {
    if (!showClusters || mapPoints.length === 0) return [];
    
    const clustersMap = new Map<string, PhotoCluster>();
    const clusterRadius = 0.01; // ~1km clustering radius
    
    mapPoints.forEach(point => {
      const gridKey = `${Math.floor(point.position[0] / clusterRadius)},${Math.floor(point.position[1] / clusterRadius)}`;
      
      if (!clustersMap.has(gridKey)) {
        clustersMap.set(gridKey, {
          center: point.position,
          photos: [],
          radius: 50,
        });
      }
      
      const cluster = clustersMap.get(gridKey)!;
      cluster.photos.push(point);
      
      // Update cluster center to average position
      const pointsWithPosition = cluster.photos.filter(p => (p as any).position);
      const avgLat = pointsWithPosition.reduce((sum, p) => sum + (p as any).position[0], 0) / pointsWithPosition.length;
      const avgLng = pointsWithPosition.reduce((sum, p) => sum + (p as any).position[1], 0) / pointsWithPosition.length;
      cluster.center = [avgLat, avgLng];
      cluster.radius = Math.min(100, 30 + cluster.photos.length * 5);
    });
    
    return Array.from(clustersMap.values()).filter(cluster => cluster.photos.length > 1);
  }, [mapPoints, showClusters]);

  // Calculate route path
  const routePoints = useMemo(() => {
    if (!showRoute || mapPoints.length < 2) return [];
    return mapPoints.map(point => point.position);
  }, [mapPoints, showRoute]);

  // Calculate map bounds
  const bounds = useMemo(() => {
    if (mapPoints.length === 0) return undefined;
    
    const lats = mapPoints.map(p => p.position[0]);
    const lngs = mapPoints.map(p => p.position[1]);
    
    return new LatLngBounds(
      [Math.min(...lats), Math.min(...lngs)],
      [Math.max(...lats), Math.max(...lngs)]
    );
  }, [mapPoints]);

  const defaultCenter: LatLngTuple = mapPoints.length > 0 ? mapPoints[0].position : [48.8566, 2.3522]; // Paris default

  // Tile layer URLs for different map views
  const tileLayerConfig = {
    street: {
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    },
    satellite: {
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      attribution: '&copy; <a href="https://www.esri.com/">Esri</a>'
    },
    terrain: {
      url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
      attribution: '&copy; <a href="https://opentopomap.org/">OpenTopoMap</a>'
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Map Controls */}
      <div className="flex items-center justify-between bg-white p-4 rounded-lg border">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-blue-600" />
          <span className="font-medium">
            {trip ? `${trip.title} - Map View` : 'Travel Map'}
          </span>
          <Badge variant="secondary">
            {mapPoints.length} photos
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Map Layer Selector */}
          <div className="flex bg-gray-100 rounded-md p-1">
            <Button
              variant={mapView === 'street' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setMapView('street')}
              className="text-xs"
            >
              Street
            </Button>
            <Button
              variant={mapView === 'satellite' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setMapView('satellite')}
              className="text-xs"
            >
              Satellite
            </Button>
            <Button
              variant={mapView === 'terrain' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setMapView('terrain')}
              className="text-xs"
            >
              Terrain
            </Button>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div style={{ height }} className="rounded-lg overflow-hidden border">
        {mapPoints.length === 0 ? (
          <div className="h-full flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-600">No GPS coordinates found in photos</p>
            </div>
          </div>
        ) : (
          <MapContainer
            center={defaultCenter}
            zoom={10}
            style={{ height: "100%", width: "100%" }}
            bounds={bounds}
            boundsOptions={{ padding: [20, 20] }}
          >
            <TileLayer
              attribution={tileLayerConfig[mapView].attribution}
              url={tileLayerConfig[mapView].url}
            />
            
            {/* Route Polyline */}
            {showRoute && routePoints.length > 1 && (
              <Polyline
                positions={routePoints}
                color="#3B82F6"
                weight={3}
                opacity={0.7}
                dashArray="5, 10"
              />
            )}
            
            {/* Photo Clusters */}
            {clusters.map((cluster, index) => (
              <Circle
                key={`cluster-${index}`}
                center={cluster.center}
                radius={cluster.radius}
                fillColor="#8B5CF6"
                fillOpacity={0.2}
                color="#8B5CF6"
                weight={2}
              >
                <Popup>
                  <div className="p-2">
                    <div className="font-semibold mb-2">Photo Cluster</div>
                    <div className="text-sm text-gray-600 mb-2">
                      {cluster.photos.length} photos in this area
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      {cluster.photos.slice(0, 6).map(photo => (
                        <img
                          key={photo.id}
                          src={photo.url}
                          alt={photo.originalName}
                          className="w-12 h-12 object-cover rounded cursor-pointer"
                          onClick={() => setSelectedPhoto(photo)}
                        />
                      ))}
                    </div>
                    {cluster.photos.length > 6 && (
                      <div className="text-xs text-gray-500 mt-1">
                        +{cluster.photos.length - 6} more photos
                      </div>
                    )}
                  </div>
                </Popup>
              </Circle>
            ))}
            
            {/* Individual Photo Markers */}
            {mapPoints.map((photo, index) => {
              const isFirst = index === 0;
              const isLast = index === mapPoints.length - 1;
              const icon = isFirst ? tripStartIcon : isLast ? tripEndIcon : photoIcon;
              
              return (
                <Marker
                  key={photo.id}
                  position={photo.position}
                  icon={icon}
                  eventHandlers={{
                    click: () => setSelectedPhoto(photo),
                  }}
                >
                  <Popup>
                    <div className="p-2 max-w-xs">
                      <div className="mb-2">
                        <img
                          src={photo.url}
                          alt={photo.originalName}
                          className="w-full h-32 object-cover rounded"
                        />
                      </div>
                      
                      <div className="space-y-1">
                        <div className="font-semibold text-sm truncate">
                          {photo.originalName}
                        </div>
                        
                        {photo.caption && (
                          <div className="text-sm text-gray-700">
                            {photo.caption}
                          </div>
                        )}
                        
                        {photo.location && (
                          <div className="text-xs text-gray-600 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {photo.location}
                          </div>
                        )}
                        
                        <div className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(photo.uploadedAt), { 
                            addSuffix: true, 
                            locale: fr 
                          })}
                        </div>
                        
                        <div className="flex items-center gap-2 mt-2">
                          {isFirst && (
                            <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                              Début
                            </Badge>
                          )}
                          {isLast && (
                            <Badge variant="secondary" className="text-xs bg-red-100 text-red-800">
                              Fin
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            #{index + 1}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        )}
      </div>

      {/* Trip Statistics */}
      {trip && mapPoints.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{mapPoints.length}</div>
              <div className="text-sm text-gray-600">Photos géolocalisées</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {new Set(mapPoints.map(p => p.location).filter(Boolean)).size}
              </div>
              <div className="text-sm text-gray-600">Lieux uniques</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{clusters.length}</div>
              <div className="text-sm text-gray-600">Groupes de photos</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">
                {routePoints.length > 1 ? '✓' : '✗'}
              </div>
              <div className="text-sm text-gray-600">Itinéraire tracé</div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}