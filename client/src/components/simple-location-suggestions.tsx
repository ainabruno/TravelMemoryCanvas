import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { 
  MapPin, 
  Star, 
  Calendar, 
  Clock,
  Heart,
  Filter,
  Search,
  Navigation,
  Building,
  Trees,
  Globe,
  Sparkles,
  RefreshCw,
  Plus
} from "lucide-react";

interface LocationSuggestion {
  id: string;
  name: string;
  country: string;
  category: string;
  description: string;
  highlights: string[];
  bestTime: string;
  duration: string;
  budget: string;
  rating: number;
  imageUrl: string;
  matchScore: number;
  estimatedCost?: number;
  activities: string[];
}

const categoryIcons = {
  city: Building,
  nature: Trees,
  beach: Globe,
  mountain: Navigation,
  cultural: Building,
  adventure: Navigation,
};

const categoryColors = {
  city: "bg-blue-100 text-blue-800",
  nature: "bg-green-100 text-green-800",
  beach: "bg-cyan-100 text-cyan-800",
  mountain: "bg-gray-100 text-gray-800",
  cultural: "bg-purple-100 text-purple-800",
  adventure: "bg-orange-100 text-orange-800",
};

export default function SimpleLocationSuggestions() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBudget, setSelectedBudget] = useState('any');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch travel history
  const { data: travelHistory = {} } = useQuery({
    queryKey: ['/api/analytics/travel-history'],
    queryFn: () => apiRequest('GET', '/api/analytics/travel-history').then(res => res.json()),
  });

  // Fetch suggestions
  const { data: suggestions = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/suggestions/locations', selectedBudget, selectedCategories, searchQuery],
    queryFn: () => apiRequest('POST', '/api/suggestions/locations', {
      filters: {
        budget: selectedBudget,
        categories: selectedCategories,
        weatherImportance: true,
        safetyImportance: true,
        avoidCrowds: false,
        accessibilityNeeded: false,
      },
      searchQuery,
      userHistory: travelHistory
    }).then(res => res.json()),
  });

  // Save favorite
  const saveFavoriteMutation = useMutation({
    mutationFn: async (location: LocationSuggestion) => {
      const response = await apiRequest('POST', '/api/favorites/locations', {
        locationId: location.id,
        name: location.name,
        country: location.country,
        category: location.category,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Lieu sauvegardé",
        description: "Ajouté à vos favoris",
      });
    },
  });

  // Create trip
  const createTripMutation = useMutation({
    mutationFn: async (location: LocationSuggestion) => {
      const response = await apiRequest('POST', '/api/trips', {
        title: `Voyage à ${location.name}`,
        description: location.description,
        location: `${location.name}, ${location.country}`,
        startDate: new Date().toISOString(),
        endDate: null,
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

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 75) return "text-blue-600";
    if (score >= 60) return "text-orange-600";
    return "text-gray-600";
  };

  const renderSuggestionCard = (suggestion: LocationSuggestion) => {
    const IconComponent = categoryIcons[suggestion.category as keyof typeof categoryIcons] || MapPin;
    const categoryColor = categoryColors[suggestion.category as keyof typeof categoryColors] || categoryColors.city;

    return (
      <Card key={suggestion.id} className="overflow-hidden hover:shadow-lg transition-shadow">
        <div className="relative">
          <img 
            src={suggestion.imageUrl} 
            alt={suggestion.name}
            className="w-full h-48 object-cover"
            onError={(e) => {
              // Fallback si l'image ne se charge pas
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                parent.innerHTML = `<div class="w-full h-48 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center"><svg class="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg></div>`;
              }
            }}
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
              {suggestion.country}
            </p>
          </div>

          <p className="text-sm text-gray-700 line-clamp-2">
            {suggestion.description}
          </p>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-blue-600" />
              <span>{suggestion.duration}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-green-600" />
              <span>{suggestion.bestTime}</span>
            </div>
            {suggestion.estimatedCost && (
              <div className="flex items-center gap-1">
                <span className="text-orange-600">€</span>
                <span>{suggestion.estimatedCost}€</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <span className="text-purple-600">Budget: {suggestion.budget}</span>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-medium">Points forts</span>
            <div className="flex flex-wrap gap-1">
              {suggestion.highlights.slice(0, 3).map((highlight, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {highlight}
                </Badge>
              ))}
            </div>
          </div>

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
                <span className="text-sm font-medium">Catégories</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {Object.entries(categoryIcons).map(([category, IconComponent]) => (
                    <Button
                      key={category}
                      variant={selectedCategories.includes(category) ? "default" : "outline"}
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

              {/* Budget */}
              <div>
                <span className="text-sm font-medium">Budget</span>
                <div className="flex gap-2 mt-2">
                  {['any', 'low', 'medium', 'high'].map((budget) => (
                    <Button
                      key={budget}
                      variant={selectedBudget === budget ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedBudget(budget)}
                    >
                      {budget === 'any' ? 'Tous' : 
                       budget === 'low' ? 'Économique' :
                       budget === 'medium' ? 'Moyen' : 'Élevé'}
                    </Button>
                  ))}
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