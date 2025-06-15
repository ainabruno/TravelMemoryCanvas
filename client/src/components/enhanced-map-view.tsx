import React, { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, LayersControl, useMap } from "react-leaflet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  MapPin, 
  Route, 
  Camera, 
  Calendar, 
  Clock, 
  Filter, 
  Layers, 
  Settings, 
  TrendingUp,
  Globe,
  Navigation,
  Zap,
  Eye,
  BarChart3,
  Play,
  Pause
} from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default markers in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface EnhancedMapViewProps {
  className?: string;
}

interface MapStyle {
  id: string;
  name: string;
  url: string;
  attribution: string;
  description: string;
}

interface MapLayer {
  id: string;
  name: string;
  type: 'photos' | 'routes' | 'clusters' | 'heatmap' | 'timeline';
  visible: boolean;
  color: string;
  opacity: number;
}

export function EnhancedMapView({ className = "" }: EnhancedMapViewProps) {
  const [selectedTrip, setSelectedTrip] = useState<string>('all');
  const [selectedStyle, setSelectedStyle] = useState<string>('standard');
  const [dateRange, setDateRange] = useState<{start: string, end: string}>({
    start: '',
    end: ''
  });
  const [clusterRadius, setClusterRadius] = useState<number>(0.5);
  const [activeTab, setActiveTab] = useState<string>('map');
  const [currentTimelineIndex, setCurrentTimelineIndex] = useState<number>(0);
  const [timelineAutoPlay, setTimelineAutoPlay] = useState<boolean>(false);
  const [timelineSpeed, setTimelineSpeed] = useState<'slow' | 'normal' | 'fast'>('normal');
  const [layers, setLayers] = useState<MapLayer[]>([
    { id: 'photos', name: 'Photos', type: 'photos', visible: true, color: '#3B82F6', opacity: 0.8 },
    { id: 'routes', name: 'Trajets', type: 'routes', visible: true, color: '#EF4444', opacity: 0.6 },
    { id: 'clusters', name: 'Groupes', type: 'clusters', visible: false, color: '#10B981', opacity: 0.4 },
    { id: 'heatmap', name: 'Carte de chaleur', type: 'heatmap', visible: false, color: '#F59E0B', opacity: 0.5 },
    { id: 'timeline', name: 'Chronologie', type: 'timeline', visible: false, color: '#8B5CF6', opacity: 0.7 }
  ]);

  const mapStyles: MapStyle[] = [
    {
      id: 'standard',
      name: 'Standard',
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '© OpenStreetMap contributors',
      description: 'Vue standard claire et détaillée'
    },
    {
      id: 'satellite',
      name: 'Satellite',
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: 'Esri, DigitalGlobe, GeoEye, Earthstar Geographics',
      description: 'Images satellite haute résolution'
    },
    {
      id: 'terrain',
      name: 'Relief',
      url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
      attribution: '© OpenTopoMap contributors',
      description: 'Carte topographique avec relief'
    },
    {
      id: 'dark',
      name: 'Sombre',
      url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      attribution: '© CARTO',
      description: 'Thème sombre moderne'
    }
  ];

  // Fetch trips for filter
  const { data: trips = [] } = useQuery({
    queryKey: ["/api/trips"],
  });

  // Fetch enhanced map data
  const { data: mapData, isLoading, refetch } = useQuery({
    queryKey: ["/api/maps/enhanced-data", selectedTrip, dateRange.start, dateRange.end, selectedStyle],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedTrip !== 'all') params.append('tripId', selectedTrip);
      if (dateRange.start) params.append('startDate', dateRange.start);
      if (dateRange.end) params.append('endDate', dateRange.end);
      params.append('style', selectedStyle);
      
      const response = await fetch(`/api/maps/enhanced-data?${params}`);
      if (!response.ok) throw new Error('Failed to fetch map data');
      return response.json();
    }
  });

  const toggleLayer = (layerId: string) => {
    setLayers(prev => prev.map(layer => 
      layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
    ));
  };

  const updateLayerProperty = (layerId: string, property: keyof MapLayer, value: any) => {
    setLayers(prev => prev.map(layer => 
      layer.id === layerId ? { ...layer, [property]: value } : layer
    ));
  };

  const selectedMapStyle = mapStyles.find(style => style.id === selectedStyle) || mapStyles[0];

  const MapController = () => {
    const map = useMap();
    
    useEffect(() => {
      if (mapData?.bounds && mapData.photos.length > 0) {
        const bounds = L.latLngBounds(
          [mapData.bounds.southwest[0], mapData.bounds.southwest[1]],
          [mapData.bounds.northeast[0], mapData.bounds.northeast[1]]
        );
        map.fitBounds(bounds, { padding: [20, 20] });
      }
    }, [mapData, map]);

    // Sync map with timeline
    useEffect(() => {
      if (mapData?.timeline && mapData.timeline[currentTimelineIndex]) {
        const currentItem = mapData.timeline[currentTimelineIndex];
        map.setView(currentItem.coordinates, 15, {
          animate: true,
          duration: 1
        });
      }
    }, [currentTimelineIndex, mapData?.timeline, map]);

    return null;
  };

  const createCustomIcon = (color: string, size: 'small' | 'medium' | 'large' = 'medium') => {
    const sizes = { small: 20, medium: 25, large: 30 };
    const iconSize = sizes[size];
    
    return L.divIcon({
      html: `<div style="background-color: ${color}; width: ${iconSize}px; height: ${iconSize}px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
      className: 'custom-marker',
      iconSize: [iconSize, iconSize],
      iconAnchor: [iconSize/2, iconSize/2]
    });
  };

  const formatDistance = (meters: number) => {
    if (meters < 1000) return `${Math.round(meters)}m`;
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const formatDuration = (milliseconds: number) => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${minutes}min`;
    return `${minutes}min`;
  };

  const calculateTimeBetween = (timestamp1: number, timestamp2: number) => {
    const diff = Math.abs(timestamp2 - timestamp1);
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) return `+${hours}h ${minutes}min`;
    if (minutes > 0) return `+${minutes}min`;
    return 'Maintenant';
  };

  // Auto-play timeline effect
  useEffect(() => {
    if (!timelineAutoPlay || !mapData?.timeline) return;

    const speeds = { slow: 3000, normal: 2000, fast: 1000 };
    const interval = setInterval(() => {
      setCurrentTimelineIndex(prev => {
        if (prev >= mapData.timeline.length - 1) {
          setTimelineAutoPlay(false);
          return 0;
        }
        return prev + 1;
      });
    }, speeds[timelineSpeed]);

    return () => clearInterval(interval);
  }, [timelineAutoPlay, timelineSpeed, mapData?.timeline]);

  // Reset timeline index when map data changes
  useEffect(() => {
    setCurrentTimelineIndex(0);
  }, [mapData]);

  if (isLoading) {
    return (
      <div className={`${className} p-6`}>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} space-y-6`}>
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Globe className="w-8 h-8 text-blue-600" />
              Cartes Personnalisées
            </h1>
            <p className="text-gray-600 mt-1">
              Explorez vos voyages avec des visualisations cartographiques avancées
            </p>
          </div>
          <Badge variant="secondary" className="text-sm">
            {mapData?.stats?.totalPhotos || 0} photos géolocalisées
          </Badge>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Voyage</label>
            <Select value={selectedTrip} onValueChange={setSelectedTrip}>
              <SelectTrigger>
                <SelectValue placeholder="Tous les voyages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les voyages</SelectItem>
                {trips.map((trip: any) => (
                  <SelectItem key={trip.id} value={trip.id.toString()}>
                    {trip.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Style de carte</label>
            <Select value={selectedStyle} onValueChange={setSelectedStyle}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {mapStyles.map(style => (
                  <SelectItem key={style.id} value={style.id}>
                    {style.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Date de début</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Date de fin</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="map" className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Carte Interactive
          </TabsTrigger>
          <TabsTrigger value="timeline" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Timeline
          </TabsTrigger>
          <TabsTrigger value="layers" className="flex items-center gap-2">
            <Layers className="w-4 h-4" />
            Calques
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Analyses
          </TabsTrigger>
        </TabsList>

        <TabsContent value="map" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Map */}
            <div className="lg:col-span-3">
              <Card>
                <CardContent className="p-0">
                  <div className="h-[600px] rounded-lg overflow-hidden">
                    {mapData && (
                      <MapContainer
                        center={mapData.bounds?.center || [46.603354, 1.888334]}
                        zoom={6}
                        style={{ height: "100%", width: "100%" }}
                        className="rounded-lg"
                      >
                        <TileLayer
                          url={selectedMapStyle.url}
                          attribution={selectedMapStyle.attribution}
                        />
                        
                        <MapController />

                        {/* Photos markers */}
                        {layers.find(l => l.id === 'photos')?.visible && mapData.photos.map((photo: any) => (
                          <Marker
                            key={photo.id}
                            position={photo.coordinates}
                            icon={createCustomIcon(layers.find(l => l.id === 'photos')?.color || '#3B82F6')}
                          >
                            <Popup>
                              <div className="space-y-2">
                                <img 
                                  src={photo.url} 
                                  alt={photo.caption || photo.originalName}
                                  className="w-32 h-24 object-cover rounded"
                                />
                                <div className="text-sm">
                                  <p className="font-medium">{photo.caption || photo.originalName}</p>
                                  {photo.location && <p className="text-gray-600">{photo.location}</p>}
                                  <p className="text-gray-500 text-xs">
                                    {new Date(photo.uploadedAt).toLocaleDateString('fr-FR')}
                                  </p>
                                </div>
                              </div>
                            </Popup>
                          </Marker>
                        ))}

                        {/* Routes */}
                        {layers.find(l => l.id === 'routes')?.visible && mapData.routes?.map((route: any) => (
                          <Polyline
                            key={route.id}
                            positions={route.coordinates}
                            color={layers.find(l => l.id === 'routes')?.color || '#EF4444'}
                            opacity={layers.find(l => l.id === 'routes')?.opacity || 0.6}
                            weight={3}
                          >
                            <Popup>
                              <div className="text-sm space-y-1">
                                <p className="font-medium">Trajet</p>
                                <p>Distance: {formatDistance(route.distance)}</p>
                                <p>Durée: {formatDuration(route.duration)}</p>
                                <p>Date: {route.date}</p>
                              </div>
                            </Popup>
                          </Polyline>
                        ))}

                        {/* Clusters */}
                        {layers.find(l => l.id === 'clusters')?.visible && mapData.clusters?.map((cluster: any) => (
                          <Circle
                            key={cluster.id}
                            center={cluster.center}
                            radius={cluster.radius}
                            color={layers.find(l => l.id === 'clusters')?.color || '#10B981'}
                            fillColor={layers.find(l => l.id === 'clusters')?.color || '#10B981'}
                            fillOpacity={layers.find(l => l.id === 'clusters')?.opacity || 0.4}
                          >
                            <Popup>
                              <div className="text-sm space-y-1">
                                <p className="font-medium">Groupe de photos</p>
                                <p>{cluster.photoCount} photos</p>
                                <p>Rayon: {formatDistance(cluster.radius)}</p>
                              </div>
                            </Popup>
                          </Circle>
                        ))}
                      </MapContainer>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Map Info Panel */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Statistiques
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {mapData?.stats && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Photos</span>
                        <Badge variant="secondary">{mapData.stats.totalPhotos}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Lieux uniques</span>
                        <Badge variant="secondary">{mapData.stats.uniqueLocations}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Distance totale</span>
                        <Badge variant="secondary">{formatDistance(mapData.stats.totalDistance)}</Badge>
                      </div>
                      {mapData.stats.dateRange && (
                        <div className="pt-2 border-t">
                          <p className="text-sm text-gray-600">Période</p>
                          <p className="text-xs text-gray-500">
                            {new Date(mapData.stats.dateRange.start).toLocaleDateString('fr-FR')} - {new Date(mapData.stats.dateRange.end).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Style de carte
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="font-medium text-sm">{selectedMapStyle.name}</p>
                      <p className="text-xs text-gray-600">{selectedMapStyle.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          {mapData?.timeline && mapData.timeline.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Timeline Map View */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      Carte Synchronisée
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="h-[500px] rounded-lg overflow-hidden">
                      <MapContainer
                        center={mapData.timeline[currentTimelineIndex]?.coordinates || [46.603354, 1.888334]}
                        zoom={12}
                        style={{ height: "100%", width: "100%" }}
                        className="rounded-lg"
                      >
                        <TileLayer
                          url={selectedMapStyle.url}
                          attribution={selectedMapStyle.attribution}
                        />
                        
                        <MapController />

                        {/* Current timeline marker */}
                        {mapData.timeline[currentTimelineIndex] && (
                          <Marker
                            position={mapData.timeline[currentTimelineIndex].coordinates}
                            icon={createCustomIcon('#EF4444', 'large')}
                          >
                            <Popup>
                              <div className="space-y-2">
                                <img 
                                  src={mapData.timeline[currentTimelineIndex].url} 
                                  alt={mapData.timeline[currentTimelineIndex].caption}
                                  className="w-32 h-24 object-cover rounded"
                                />
                                <div className="text-sm">
                                  <p className="font-medium">{mapData.timeline[currentTimelineIndex].caption}</p>
                                  <p className="text-gray-600">{mapData.timeline[currentTimelineIndex].location}</p>
                                  <p className="text-gray-500 text-xs">
                                    {new Date(mapData.timeline[currentTimelineIndex].timestamp).toLocaleString('fr-FR')}
                                  </p>
                                </div>
                              </div>
                            </Popup>
                          </Marker>
                        )}

                        {/* Timeline trail */}
                        {mapData.timeline.slice(0, currentTimelineIndex + 1).map((item: any, index: number) => (
                          <Marker
                            key={`trail-${item.id}`}
                            position={item.coordinates}
                            icon={createCustomIcon(index === currentTimelineIndex ? '#EF4444' : '#10B981', 'small')}
                          />
                        ))}

                        {/* Route path */}
                        {currentTimelineIndex > 0 && (
                          <Polyline
                            positions={mapData.timeline.slice(0, currentTimelineIndex + 1).map((item: any) => item.coordinates)}
                            color="#3B82F6"
                            opacity={0.7}
                            weight={3}
                          />
                        )}
                      </MapContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Timeline Controls Panel */}
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      Contrôles Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Playback Controls */}
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant={timelineAutoPlay ? "default" : "outline"}
                        onClick={() => setTimelineAutoPlay(!timelineAutoPlay)}
                        className="flex items-center gap-1"
                      >
                        {timelineAutoPlay ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        {timelineAutoPlay ? 'Pause' : 'Lecture'}
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setTimelineSpeed(timelineSpeed === 'slow' ? 'normal' : timelineSpeed === 'normal' ? 'fast' : 'slow')}
                        className="flex items-center gap-1"
                      >
                        <Zap className="w-4 h-4" />
                        {timelineSpeed === 'slow' ? 'Lent' : timelineSpeed === 'normal' ? 'Normal' : 'Rapide'}
                      </Button>
                    </div>

                    {/* Progress Slider */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Position</label>
                      <Slider
                        value={[currentTimelineIndex]}
                        onValueChange={([value]) => setCurrentTimelineIndex(value)}
                        max={mapData.timeline.length - 1}
                        min={0}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Début</span>
                        <span>{currentTimelineIndex + 1} / {mapData.timeline.length}</span>
                        <span>Fin</span>
                      </div>
                    </div>

                    {/* Quick Navigation */}
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setCurrentTimelineIndex(0)}
                        disabled={currentTimelineIndex === 0}
                      >
                        Début
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setCurrentTimelineIndex(Math.floor(mapData.timeline.length / 2))}
                      >
                        Milieu
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setCurrentTimelineIndex(mapData.timeline.length - 1)}
                        disabled={currentTimelineIndex === mapData.timeline.length - 1}
                      >
                        Fin
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Current Item Display */}
                {mapData.timeline[currentTimelineIndex] && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Photo Actuelle</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <img 
                          src={mapData.timeline[currentTimelineIndex].url} 
                          alt={mapData.timeline[currentTimelineIndex].caption}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {mapData.timeline[currentTimelineIndex].caption || `Photo ${currentTimelineIndex + 1}`}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {new Date(mapData.timeline[currentTimelineIndex].timestamp).toLocaleString('fr-FR', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                          {mapData.timeline[currentTimelineIndex].location && (
                            <div className="mt-2">
                              <Badge variant="secondary" className="text-xs">
                                <MapPin className="w-3 h-3 mr-1" />
                                {mapData.timeline[currentTimelineIndex].location}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Timeline Statistics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Statistiques</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Photos total</span>
                        <Badge variant="secondary">{mapData.timeline.length}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Progression</span>
                        <Badge variant="secondary">
                          {Math.round(((currentTimelineIndex + 1) / mapData.timeline.length) * 100)}%
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Durée totale</span>
                        <Badge variant="secondary">
                          {formatDuration(mapData.timeline[mapData.timeline.length - 1].timestamp - mapData.timeline[0].timestamp)}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune timeline disponible</h3>
                <p className="text-gray-600">
                  Ajoutez des photos avec des coordonnées GPS pour créer une timeline interactive.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="layers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="w-5 h-5" />
                Gestion des calques
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {layers.map(layer => (
                    <div key={layer.id} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={layer.visible}
                            onCheckedChange={() => toggleLayer(layer.id)}
                          />
                          <div>
                            <p className="font-medium">{layer.name}</p>
                            <p className="text-sm text-gray-600 capitalize">{layer.type}</p>
                          </div>
                        </div>
                        <div 
                          className="w-6 h-6 rounded-full border-2 border-white shadow"
                          style={{ backgroundColor: layer.color }}
                        />
                      </div>
                      
                      {layer.visible && (
                        <div className="space-y-3 pl-8">
                          <div>
                            <label className="text-sm font-medium text-gray-700">Couleur</label>
                            <input
                              type="color"
                              value={layer.color}
                              onChange={(e) => updateLayerProperty(layer.id, 'color', e.target.value)}
                              className="w-full h-8 rounded border mt-1"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-700">
                              Opacité: {Math.round(layer.opacity * 100)}%
                            </label>
                            <Slider
                              value={[layer.opacity]}
                              onValueChange={([value]) => updateLayerProperty(layer.id, 'opacity', value)}
                              max={1}
                              min={0}
                              step={0.1}
                              className="mt-2"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Route className="w-5 h-5" />
                  Trajets
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {mapData?.routes?.map((route: any, index: number) => (
                      <div key={route.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-sm">Trajet {index + 1}</p>
                            <p className="text-xs text-gray-600">{route.date}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{formatDistance(route.distance)}</p>
                            <p className="text-xs text-gray-600">{formatDuration(route.duration)}</p>
                          </div>
                        </div>
                      </div>
                    )) || <p className="text-gray-500 text-sm">Aucun trajet disponible</p>}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="w-5 h-5" />
                  Groupes de photos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {mapData?.clusters?.map((cluster: any, index: number) => (
                      <div key={cluster.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-sm">Groupe {index + 1}</p>
                            <p className="text-xs text-gray-600">
                              {cluster.photos.length} photo{cluster.photos.length > 1 ? 's' : ''}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{formatDistance(cluster.radius)}</p>
                            <p className="text-xs text-gray-600">rayon</p>
                          </div>
                        </div>
                      </div>
                    )) || <p className="text-gray-500 text-sm">Aucun groupe disponible</p>}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {mapData?.timeline && mapData.timeline.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Timeline Interactive
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Timeline Controls */}
                  <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setTimelineSpeed(timelineSpeed === 'slow' ? 'normal' : timelineSpeed === 'normal' ? 'fast' : 'slow')}
                      className="flex items-center gap-1"
                    >
                      <Zap className="w-3 h-3" />
                      {timelineSpeed === 'slow' ? 'Lent' : timelineSpeed === 'normal' ? 'Normal' : 'Rapide'}
                    </Button>
                    <Button
                      size="sm"
                      variant={timelineAutoPlay ? "default" : "outline"}
                      onClick={() => setTimelineAutoPlay(!timelineAutoPlay)}
                      className="flex items-center gap-1"
                    >
                      {timelineAutoPlay ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                      {timelineAutoPlay ? 'Pause' : 'Lecture'}
                    </Button>
                    <div className="flex-1">
                      <Slider
                        value={[currentTimelineIndex]}
                        onValueChange={([value]) => setCurrentTimelineIndex(value)}
                        max={mapData.timeline.length - 1}
                        min={0}
                        step={1}
                        className="w-full"
                      />
                    </div>
                  </div>

                  {/* Current Item Display */}
                  {mapData.timeline[currentTimelineIndex] && (
                    <div className="p-4 border rounded-lg bg-blue-50 border-blue-200">
                      <div className="flex items-start gap-3">
                        <div className="w-3 h-3 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                        <div className="flex-1">
                          <h4 className="font-semibold text-blue-900">
                            {mapData.timeline[currentTimelineIndex].caption || `Photo ${currentTimelineIndex + 1}`}
                          </h4>
                          <p className="text-sm text-blue-700 mt-1">
                            {new Date(mapData.timeline[currentTimelineIndex].timestamp).toLocaleString('fr-FR', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                          {mapData.timeline[currentTimelineIndex].location && (
                            <Badge variant="secondary" className="mt-2">
                              <MapPin className="w-3 h-3 mr-1" />
                              {mapData.timeline[currentTimelineIndex].location}
                            </Badge>
                          )}
                          <div className="mt-3 text-xs text-blue-600">
                            Position {currentTimelineIndex + 1} sur {mapData.timeline.length}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Timeline Visualization */}
                  <div className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                    <ScrollArea className="h-64">
                      <div className="space-y-3 pb-4">
                        {mapData.timeline.map((item: any, index: number) => (
                          <div 
                            key={item.id} 
                            className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                              index === currentTimelineIndex 
                                ? 'bg-blue-100 border border-blue-300 shadow-sm' 
                                : index < currentTimelineIndex 
                                  ? 'bg-green-50 border border-green-200' 
                                  : 'hover:bg-gray-50 border border-transparent'
                            }`}
                            onClick={() => setCurrentTimelineIndex(index)}
                          >
                            <div className={`w-3 h-3 rounded-full flex-shrink-0 mt-1 ${
                              index === currentTimelineIndex 
                                ? 'bg-blue-500 ring-2 ring-blue-200' 
                                : index < currentTimelineIndex 
                                  ? 'bg-green-500' 
                                  : 'bg-gray-300'
                            }`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className={`text-sm font-medium truncate ${
                                  index === currentTimelineIndex ? 'text-blue-900' : 'text-gray-900'
                                }`}>
                                  {item.caption || `Photo ${index + 1}`}
                                </p>
                                {index === currentTimelineIndex && (
                                  <Eye className="w-4 h-4 text-blue-500" />
                                )}
                              </div>
                              <p className={`text-xs mt-1 ${
                                index === currentTimelineIndex ? 'text-blue-700' : 'text-gray-500'
                              }`}>
                                {new Date(item.timestamp).toLocaleString('fr-FR')}
                              </p>
                              {item.location && (
                                <div className="mt-2">
                                  <Badge 
                                    variant={index === currentTimelineIndex ? "default" : "outline"} 
                                    className="text-xs"
                                  >
                                    {item.location}
                                  </Badge>
                                </div>
                              )}
                              {index < mapData.timeline.length - 1 && (
                                <div className="mt-2 text-xs text-gray-400">
                                  {calculateTimeBetween(item.timestamp, mapData.timeline[index + 1].timestamp)}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>

                  {/* Timeline Statistics */}
                  <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <p className="text-lg font-bold text-gray-900">
                        {formatDuration(mapData.timeline[mapData.timeline.length - 1].timestamp - mapData.timeline[0].timestamp)}
                      </p>
                      <p className="text-xs text-gray-600">Durée totale</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-gray-900">
                        {Math.round((mapData.timeline[mapData.timeline.length - 1].timestamp - mapData.timeline[0].timestamp) / (mapData.timeline.length - 1) / (1000 * 60))}min
                      </p>
                      <p className="text-xs text-gray-600">Intervalle moyen</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}