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
  BarChart3
} from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default markers in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="map" className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Carte Interactive
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
                  Chronologie
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-48">
                  <div className="space-y-2">
                    {mapData.timeline.map((item: any, index: number) => (
                      <div key={item.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {item.caption || `Photo ${index + 1}`}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(item.timestamp).toLocaleString('fr-FR')}
                          </p>
                        </div>
                        {item.location && (
                          <Badge variant="outline" className="text-xs">
                            {item.location}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}