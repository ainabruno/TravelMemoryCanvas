import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { getCurrentLocation, calculateDistance, getAddressFromCoordinates, type GPSCoordinates } from "@/lib/gps-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  MapPin, 
  Navigation, 
  Compass, 
  Activity, 
  Play, 
  Pause, 
  Square,
  Route,
  Clock,
  TrendingUp
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface LocationPoint {
  id: string;
  coordinates: GPSCoordinates;
  timestamp: Date;
  address?: string;
  accuracy?: number;
  speed?: number;
  heading?: number;
}

interface LocationTrackerProps {
  tripId?: number;
  onLocationUpdate?: (location: LocationPoint) => void;
  autoTrack?: boolean;
}

export default function LocationTracker({ tripId, onLocationUpdate, autoTrack = false }: LocationTrackerProps) {
  const [isTracking, setIsTracking] = useState(autoTrack);
  const [currentLocation, setCurrentLocation] = useState<LocationPoint | null>(null);
  const [trackingHistory, setTrackingHistory] = useState<LocationPoint[]>([]);
  const [trackingStats, setTrackingStats] = useState({
    totalDistance: 0,
    totalTime: 0,
    averageSpeed: 0,
    pointsCount: 0,
  });
  
  const watchIdRef = useRef<number | null>(null);
  const trackingStartTimeRef = useRef<Date | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Save location point mutation
  const saveLocationMutation = useMutation({
    mutationFn: async (location: LocationPoint) => {
      if (!tripId) return null;
      const response = await apiRequest('POST', `/api/trips/${tripId}/locations`, {
        latitude: location.coordinates.latitude,
        longitude: location.coordinates.longitude,
        altitude: location.coordinates.altitude,
        accuracy: location.accuracy,
        speed: location.speed,
        heading: location.heading,
        timestamp: location.timestamp.toISOString(),
        address: location.address,
      });
      return response.json();
    },
  });

  // Get saved locations for trip
  const { data: savedLocations = [] } = useQuery({
    queryKey: ['/api/trips', tripId, 'locations'],
    queryFn: () => tripId ? apiRequest('GET', `/api/trips/${tripId}/locations`).then(res => res.json()) : Promise.resolve([]),
    enabled: !!tripId,
  });

  // Update tracking stats
  const updateStats = (newLocation: LocationPoint) => {
    if (trackingHistory.length === 0) {
      trackingStartTimeRef.current = new Date();
      setTrackingStats({
        totalDistance: 0,
        totalTime: 0,
        averageSpeed: 0,
        pointsCount: 1,
      });
      return;
    }

    const lastLocation = trackingHistory[trackingHistory.length - 1];
    const distance = calculateDistance(lastLocation.coordinates, newLocation.coordinates);
    const timeDiff = (newLocation.timestamp.getTime() - lastLocation.timestamp.getTime()) / 1000; // seconds
    const speed = distance > 0 ? (distance / timeDiff) * 3600 : 0; // km/h

    setTrackingStats(prev => {
      const newTotalDistance = prev.totalDistance + distance;
      const newTotalTime = trackingStartTimeRef.current 
        ? (newLocation.timestamp.getTime() - trackingStartTimeRef.current.getTime()) / 1000
        : prev.totalTime;
      const newAverageSpeed = newTotalTime > 0 ? (newTotalDistance / newTotalTime) * 3600 : 0;

      return {
        totalDistance: newTotalDistance,
        totalTime: newTotalTime,
        averageSpeed: newAverageSpeed,
        pointsCount: prev.pointsCount + 1,
      };
    });
  };

  // Handle location update
  const handleLocationUpdate = async (position: GeolocationPosition) => {
    const coordinates: GPSCoordinates = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      altitude: position.coords.altitude || undefined,
    };

    const locationPoint: LocationPoint = {
      id: Date.now().toString(),
      coordinates,
      timestamp: new Date(),
      accuracy: position.coords.accuracy,
      speed: position.coords.speed || undefined,
      heading: position.coords.heading || undefined,
    };

    try {
      // Get address for location
      const address = await getAddressFromCoordinates(coordinates.latitude, coordinates.longitude);
      locationPoint.address = address;
    } catch (error) {
      console.warn('Failed to get address for location:', error);
    }

    setCurrentLocation(locationPoint);
    
    if (isTracking) {
      setTrackingHistory(prev => [...prev, locationPoint]);
      updateStats(locationPoint);
      
      // Save to database if trip is active
      if (tripId) {
        saveLocationMutation.mutate(locationPoint);
      }
    }

    onLocationUpdate?.(locationPoint);
  };

  // Start location tracking
  const startTracking = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Géolocalisation non supportée",
        description: "Votre navigateur ne supporte pas la géolocalisation",
        variant: "destructive",
      });
      return;
    }

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 5000,
    };

    // Get initial location
    navigator.geolocation.getCurrentPosition(
      handleLocationUpdate,
      (error) => {
        toast({
          title: "Erreur de géolocalisation",
          description: "Impossible d'obtenir votre position actuelle",
          variant: "destructive",
        });
        console.error('Geolocation error:', error);
      },
      options
    );

    // Start watching position
    watchIdRef.current = navigator.geolocation.watchPosition(
      handleLocationUpdate,
      (error) => {
        console.error('Location tracking error:', error);
      },
      options
    );

    setIsTracking(true);
    trackingStartTimeRef.current = new Date();
    
    toast({
      title: "Suivi activé",
      description: "Votre position est maintenant suivie",
    });
  };

  // Stop location tracking
  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    
    setIsTracking(false);
    
    toast({
      title: "Suivi arrêté",
      description: "Le suivi de votre position a été arrêté",
    });
  };

  // Reset tracking data
  const resetTracking = () => {
    setTrackingHistory([]);
    setTrackingStats({
      totalDistance: 0,
      totalTime: 0,
      averageSpeed: 0,
      pointsCount: 0,
    });
    trackingStartTimeRef.current = null;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Auto-start tracking if enabled
  useEffect(() => {
    if (autoTrack && !isTracking) {
      startTracking();
    }
  }, [autoTrack]);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  return (
    <div className="space-y-4">
      {/* Current Location */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Position actuelle
            {isTracking && (
              <Badge variant="default" className="bg-green-100 text-green-800">
                <Activity className="w-3 h-3 mr-1" />
                En cours
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentLocation ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Navigation className="w-4 h-4 text-blue-600" />
                <span className="font-mono text-sm">
                  {currentLocation.coordinates.latitude.toFixed(6)}, {currentLocation.coordinates.longitude.toFixed(6)}
                </span>
              </div>
              
              {currentLocation.address && (
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-gray-600 mt-0.5" />
                  <span className="text-sm text-gray-700">{currentLocation.address}</span>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                {currentLocation.accuracy && (
                  <div>
                    <span className="text-gray-600">Précision:</span>
                    <span className="ml-1 font-medium">{Math.round(currentLocation.accuracy)}m</span>
                  </div>
                )}
                
                {currentLocation.speed && (
                  <div>
                    <span className="text-gray-600">Vitesse:</span>
                    <span className="ml-1 font-medium">{Math.round(currentLocation.speed * 3.6)} km/h</span>
                  </div>
                )}
                
                {currentLocation.heading && (
                  <div className="flex items-center gap-1">
                    <Compass className="w-3 h-3" />
                    <span className="text-gray-600">Direction:</span>
                    <span className="ml-1 font-medium">{Math.round(currentLocation.heading)}°</span>
                  </div>
                )}
                
                <div>
                  <span className="text-gray-600">Dernière MAJ:</span>
                  <span className="ml-1 font-medium">
                    {formatDistanceToNow(currentLocation.timestamp, { addSuffix: true, locale: fr })}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              <MapPin className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">Position non disponible</p>
            </div>
          )}

          {/* Control Buttons */}
          <div className="flex gap-2">
            {!isTracking ? (
              <Button onClick={startTracking} className="flex-1">
                <Play className="w-4 h-4 mr-2" />
                Démarrer le suivi
              </Button>
            ) : (
              <Button onClick={stopTracking} variant="outline" className="flex-1">
                <Pause className="w-4 h-4 mr-2" />
                Arrêter le suivi
              </Button>
            )}
            
            <Button onClick={resetTracking} variant="outline" size="icon">
              <Square className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tracking Statistics */}
      {(isTracking || trackingHistory.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Statistiques du trajet
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {trackingStats.totalDistance.toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">km parcourus</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {formatDuration(trackingStats.totalTime)}
                </div>
                <div className="text-sm text-gray-600">durée</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {trackingStats.averageSpeed.toFixed(1)}
                </div>
                <div className="text-sm text-gray-600">km/h moyenne</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {trackingStats.pointsCount}
                </div>
                <div className="text-sm text-gray-600">points GPS</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Location History */}
      {trackingHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Route className="w-5 h-5" />
              Historique des positions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {trackingHistory.slice().reverse().slice(0, 10).map((location, index) => (
                <div key={location.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {location.address || `${location.coordinates.latitude.toFixed(4)}, ${location.coordinates.longitude.toFixed(4)}`}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDistanceToNow(location.timestamp, { addSuffix: true, locale: fr })}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    <Clock className="w-3 h-3 inline mr-1" />
                    {location.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}