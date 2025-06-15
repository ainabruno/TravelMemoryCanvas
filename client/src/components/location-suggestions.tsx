import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { 
  MapPin, 
  Star, 
  Calendar, 
  Users, 
  Plane, 
  Clock,
  Heart,
  TrendingUp,
  Filter,
  Search,
  Navigation,
  Globe,
  Camera,
  Utensils,
  Building,
  Trees,
  Sparkles,
  RefreshCw,
  Plus
} from "lucide-react";

interface LocationSuggestion {
  id: string;
  name: string;
  country: string;
  region: string;
  category: 'city' | 'nature' | 'beach' | 'mountain' | 'cultural' | 'adventure';
  description: string;
  highlights: string[];
  bestTime: string;
  duration: string;
  difficulty: 'easy' | 'medium' | 'hard';
  budget: 'low' | 'medium' | 'high';
  rating: number;
  imageUrl: string;
  latitude: number;
  longitude: number;
  weatherScore: number;
  popularityScore: number;
  matchScore: number;
  distance?: number;
  travelTime?: string;
  estimatedCost?: number;
  activities: string[];
  nearbyAttractions: string[];
  localCuisine: string[];
  safetyRating: number;
  touristSeason: 'low' | 'medium' | 'high';
  accessibility: boolean;
}

interface SuggestionFilters {
  budget: 'any' | 'low' | 'medium' | 'high';
  duration: number;
  categories: string[];
  maxDistance: number;
  weatherImportance: boolean;
  safetyImportance: boolean;
  avoidCrowds: boolean;
  accessibilityNeeded: boolean;
  currentLocation: { lat: number; lng: number } | null;
}

const categoryIcons = {
  city: Building,
  nature: Trees,
  beach: Globe,
  mountain: Navigation,
  cultural: Camera,
  adventure: TrendingUp,
};

const categoryColors = {
  city: "bg-blue-100 text-blue-800",
  nature: "bg-green-100 text-green-800",
  beach: "bg-cyan-100 text-cyan-800",
  mountain: "bg-gray-100 text-gray-800",
  cultural: "bg-purple-100 text-purple-800",
  adventure: "bg-orange-100 text-orange-800",
};

export default function LocationSuggestions() {
  const [activeTab, setActiveTab] = useState('suggestions');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<SuggestionFilters>({
    budget: 'any',
    duration: 7,
    categories: [],
    maxDistance: 5000,
    weatherImportance: true,
    safetyImportance: true,
    avoidCrowds: false,
    accessibilityNeeded: false,
    currentLocation: null,
  });
  const [showFilters, setShowFilters] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user travel history for personalization
  const { data: travelHistory = [] } = useQuery({
    queryKey: ['/api/analytics/travel-history'],
    queryFn: () => apiRequest('GET', '/api/analytics/travel-history').then(res => res.json()),
  });

  // Fetch location suggestions
  const { data: suggestions = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/suggestions/locations', filters, searchQuery],
    queryFn: () => apiRequest('POST', '/api/suggestions/locations', {
      filters,
      searchQuery,
      userHistory: travelHistory
    }).then(res => res.json()),
  });

  // Get current location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFilters(prev => ({
            ...prev,
            currentLocation: {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            }
          }));
          toast({
            title: "Position mise à jour",
            description: "Les suggestions sont maintenant personnalisées selon votre localisation",
          });
        },
        (error) => {
          toast({
            title: "Impossible d'obtenir la position",
            description: "Vérifiez les permissions de géolocalisation",
            variant: "destructive",
          });
        }
      );
    }
  };

  // Save location as favorite
  const saveFavoriteMutation = useMutation({
    mutationFn: async (location: LocationSuggestion) => {
      const response = await apiRequest('POST', '/api/favorites/locations', {
        locationId: location.id,
        name: location.name,
        country: location.country,
        category: location.category,
        coordinates: { lat: location.latitude, lng: location.longitude }
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Lieu sauvegardé",
        description: "Ajouté à vos favoris",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/favorites'] });
    },
  });

  // Create trip from suggestion
  const createTripMutation = useMutation({
    mutationFn: async (location: LocationSuggestion) => {
      const response = await apiRequest('POST', '/api/trips', {
        title: `Voyage à ${location.name}`,
        description: location.description,
        location: `${location.name}, ${location.country}`,
        startDate: new Date().toISOString(),
        endDate: null,
        suggestedDuration: location.duration,
        suggestedBudget: location.budget,
        coordinates: { lat: location.latitude, lng: location.longitude }
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Voyage créé",
        description: "Nouveau voyage ajouté à votre planification",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/trips'] });
    },
  });

  const updateFilters = (key: keyof SuggestionFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleCategory = (category: string) => {
    setFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 75) return "text-blue-600";
    if (score >= 60) return "text-orange-600";
    return "text-gray-600";
  };

  const renderSuggestionCard = (suggestion: LocationSuggestion) => {
    const IconComponent = categoryIcons[suggestion.category] || MapPin;
    const categoryColor = categoryColors[suggestion.category] || categoryColors.city;

    return (
      <Card key={suggestion.id} className="overflow-hidden hover:shadow-lg transition-shadow">
        <div className="relative">
          <img 
            src={suggestion.imageUrl} 
            alt={suggestion.name}
            className="w-full h-48 object-cover"
          />
          <div className="absolute top-3 right-3">
            <Badge className={`${categoryColor} font-medium`}>
              <IconComponent className="w-3 h-3 mr-1" />
              {suggestion.category}
            </Badge>
          </div>
          <div className="absolute top-3 left-3">
            <Badge variant="secondary" className="bg-white/90 text-gray-800">
              <Star className="w-3 h-3 mr-1 fill-yellow-400 text-yellow-400" />
              {suggestion.rating.toFixed(1)}
            </Badge>
          </div>
        </div>

        <CardContent className="p-4 space-y-4">
          <div>
            <h3 className="font-bold text-lg flex items-center gap-2">
              {suggestion.name}
              <Badge 
                variant="outline" 
                className={`text-sm ${getMatchScoreColor(suggestion.matchScore)}`}
              >
                {suggestion.matchScore}% match
              </Badge>
            </h3>
            <p className="text-gray-600 text-sm flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {suggestion.country}, {suggestion.region}
            </p>
          </div>

          <p className="text-sm text-gray-700 line-clamp-2">
            {suggestion.description}
          </p>

          {/* Key Information */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-blue-600" />
              <span>{suggestion.duration}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-green-600" />
              <span>{suggestion.bestTime}</span>
            </div>
            {suggestion.distance && (
              <div className="flex items-center gap-1">
                <Navigation className="w-3 h-3 text-purple-600" />
                <span>{Math.round(suggestion.distance)} km</span>
              </div>
            )}
            {suggestion.estimatedCost && (
              <div className="flex items-center gap-1">
                <span className="text-orange-600">€</span>
                <span>{suggestion.estimatedCost}€</span>
              </div>
            )}
          </div>

          {/* Highlights */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Points forts</Label>
            <div className="flex flex-wrap gap-1">
              {suggestion.highlights.slice(0, 3).map((highlight, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {highlight}
                </Badge>
              ))}
            </div>
          </div>

          {/* Activities */}
          {suggestion.activities.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs font-medium">Activités</Label>
              <div className="flex flex-wrap gap-1">
                {suggestion.activities.slice(0, 4).map((activity, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {activity}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => saveFavoriteMutation.mutate(suggestion)}
              disabled={saveFavoriteMutation.isPending}
              className="flex-1"
            >
              <Heart className="w-3 h-3 mr-1" />
              Sauvegarder
            </Button>
            <Button
              size="sm"
              onClick={() => createTripMutation.mutate(suggestion)}
              disabled={createTripMutation.isPending}
              className="flex-1"
            >
              <Plus className="w-3 h-3 mr-1" />
              Planifier
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-600" />
            Suggestions de destinations
          </h2>
          <p className="text-gray-600">
            Découvrez de nouveaux lieux personnalisés selon vos préférences
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={getCurrentLocation}
            size="sm"
          >
            <Navigation className="w-4 h-4 mr-2" />
            Ma position
          </Button>
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isLoading}
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                placeholder="Rechercher une destination..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filtres
            </Button>
          </div>

          {showFilters && (
            <div className="space-y-4 pt-4 border-t">
              {/* Categories */}
              <div>
                <Label className="text-sm font-medium">Catégories</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {Object.entries(categoryIcons).map(([category, IconComponent]) => (
                    <Button
                      key={category}
                      variant={filters.categories.includes(category) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleCategory(category)}
                      className="flex items-center gap-1"
                    >
                      <IconComponent className="w-3 h-3" />
                      {category}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div>
                <Label className="text-sm font-medium">
                  Durée du voyage: {filters.duration} jours
                </Label>
                <Slider
                  value={[filters.duration]}
                  onValueChange={([value]) => updateFilters('duration', value)}
                  max={30}
                  min={1}
                  step={1}
                  className="mt-2"
                />
              </div>

              {/* Budget */}
              <div>
                <Label className="text-sm font-medium">Budget</Label>
                <div className="flex gap-2 mt-2">
                  {['any', 'low', 'medium', 'high'].map((budget) => (
                    <Button
                      key={budget}
                      variant={filters.budget === budget ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateFilters('budget', budget)}
                    >
                      {budget === 'any' ? 'Tous' : 
                       budget === 'low' ? 'Économique' :
                       budget === 'medium' ? 'Moyen' : 'Élevé'}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Preferences */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="weather"
                    checked={filters.weatherImportance}
                    onCheckedChange={(checked) => updateFilters('weatherImportance', checked)}
                  />
                  <Label htmlFor="weather" className="text-sm">Météo favorable</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="safety"
                    checked={filters.safetyImportance}
                    onCheckedChange={(checked) => updateFilters('safetyImportance', checked)}
                  />
                  <Label htmlFor="safety" className="text-sm">Sécurité prioritaire</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="crowds"
                    checked={filters.avoidCrowds}
                    onCheckedChange={(checked) => updateFilters('avoidCrowds', checked)}
                  />
                  <Label htmlFor="crowds" className="text-sm">Éviter les foules</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="accessibility"
                    checked={filters.accessibilityNeeded}
                    onCheckedChange={(checked) => updateFilters('accessibilityNeeded', checked)}
                  />
                  <Label htmlFor="accessibility" className="text-sm">Accessibilité</Label>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Suggestions Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <div className="animate-pulse">
                <div className="w-full h-48 bg-gray-200"></div>
                <div className="p-4 space-y-3">
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-16 bg-gray-200 rounded"></div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : suggestions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {suggestions.map(renderSuggestionCard)}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucune suggestion trouvée</h3>
            <p className="text-gray-600 mb-4">
              Essayez d'ajuster vos filtres ou votre recherche
            </p>
            <Button onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Réessayer
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}