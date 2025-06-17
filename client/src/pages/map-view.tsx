import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import TripMap from "@/components/trip-map";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Filter, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

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

export default function MapView() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTrip, setSelectedTrip] = useState<number | null>(null);

  const { data: photos = [], isLoading: photosLoading } = useQuery<Photo[]>({
    queryKey: ['/api/photos'],
  });

  const { data: trips = [], isLoading: tripsLoading } = useQuery<any[]>({
    queryKey: ['/api/trips'],
  });

  // Filter photos with GPS coordinates
  const geotaggedPhotos = photos.filter((photo: Photo) => 
    photo.latitude && photo.longitude && 
    !isNaN(parseFloat(photo.latitude)) && 
    !isNaN(parseFloat(photo.longitude))
  );

  // Filter photos based on search and trip selection
  const filteredPhotos = geotaggedPhotos.filter((photo: Photo) => {
    const matchesSearch = !searchQuery || 
      photo.originalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      photo.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      photo.caption?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTrip = !selectedTrip || photo.tripId === selectedTrip;
    
    return matchesSearch && matchesTrip;
  });

  const selectedTripData = selectedTrip ? trips.find((trip: any) => trip.id === selectedTrip) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Travel Map</h1>
        <p className="text-gray-600">Explore your photos and journeys on an interactive map</p>
      </div>

      {/* Controls */}
      <Card className="relative z-20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Map Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search photos by name, location, or caption..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            {/* Trip Filter */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedTrip === null ? "default" : "outline"}
                onClick={() => setSelectedTrip(null)}
                size="sm"
              >
                All Trips
              </Button>
              {trips.map((trip: any) => (
                <Button
                  key={trip.id}
                  variant={selectedTrip === trip.id ? "default" : "outline"}
                  onClick={() => setSelectedTrip(trip.id)}
                  size="sm"
                >
                  {trip.title}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">{geotaggedPhotos.length}</p>
                <p className="text-sm text-gray-600">Geotagged Photos</p>
              </div>
              <MapPin className="text-blue-500 w-8 h-8" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">{filteredPhotos.length}</p>
                <p className="text-sm text-gray-600">Filtered Results</p>
              </div>
              <Search className="text-green-500 w-8 h-8" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {new Set(geotaggedPhotos.map(p => p.location).filter(Boolean)).size}
                </p>
                <p className="text-sm text-gray-600">Unique Locations</p>
              </div>
              <Badge variant="secondary" className="text-orange-500">
                {selectedTripData ? selectedTripData.title : 'All'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Interactive Map */}
      <Card>
        <CardContent className="p-0">
          {photosLoading ? (
            <div className="h-96 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                <p className="text-gray-600">Loading map...</p>
              </div>
            </div>
          ) : (
            <TripMap 
              trip={selectedTripData}
              photos={filteredPhotos}
              height="600px"
              className="rounded-lg"
            />
          )}
        </CardContent>
      </Card>

      {/* Photo List */}
      {filteredPhotos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Photos on Map ({filteredPhotos.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {filteredPhotos.map((photo: Photo) => (
                <div key={photo.id} className="group cursor-pointer">
                  <div className="aspect-square rounded-lg overflow-hidden mb-2">
                    <img 
                      src={photo.url} 
                      alt={photo.originalName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <p className="text-xs text-gray-600 truncate">{photo.originalName}</p>
                  {photo.location && (
                    <p className="text-xs text-gray-400 truncate flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {photo.location}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {geotaggedPhotos.length === 0 && !photosLoading && (
        <Card>
          <CardContent className="p-8 text-center">
            <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Geotagged Photos</h3>
            <p className="text-gray-600 mb-4">
              Upload photos with GPS coordinates or manually add locations to see them on the map.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}