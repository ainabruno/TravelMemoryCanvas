import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import StoryGenerator from "@/components/story-generator";
import { BookOpen, FileText, Clock, Users } from "lucide-react";

export default function StoryGenerationPage() {
  // Fetch trips for story generation
  const { data: trips = [] } = useQuery({
    queryKey: ['/api/trips'],
  });

  // Fetch albums for story generation
  const { data: albums = [] } = useQuery({
    queryKey: ['/api/albums'],
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Génération de récits</h1>
        <p className="text-gray-600">
          Transformez vos photos et souvenirs de voyage en histoires captivantes grâce à l'intelligence artificielle
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Voyages</p>
                <p className="text-2xl font-bold">{trips.length}</p>
              </div>
              <BookOpen className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Albums</p>
                <p className="text-2xl font-bold">{albums.length}</p>
              </div>
              <FileText className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Récits générés</p>
                <p className="text-2xl font-bold">3</p>
              </div>
              <Clock className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Collaborateurs</p>
                <p className="text-2xl font-bold">8</p>
              </div>
              <Users className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Source Selection */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Trips */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Générer depuis un voyage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {trips.length > 0 ? (
                trips.slice(0, 5).map((trip: any) => (
                  <div key={trip.id} className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium">{trip.title}</h4>
                        <p className="text-sm text-gray-600">{trip.location}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {trip.startDate ? new Date(trip.startDate).toLocaleDateString('fr-FR') : 'Date non définie'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-4">
                  Aucun voyage disponible
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Albums */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Générer depuis un album
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {albums.length > 0 ? (
                albums.slice(0, 5).map((album: any) => (
                  <div key={album.id} className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium">{album.title}</h4>
                        <p className="text-sm text-gray-600">{album.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {album.photoCount || 0} photos
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-4">
                  Aucun album disponible
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Story Generator */}
        <div className="lg:col-span-1">
          <StoryGenerator 
            tripId={trips.length > 0 ? trips[0].id : undefined}
            className="h-full"
          />
        </div>
      </div>

      {/* Main Story Generator */}
      <div className="mt-8">
        <StoryGenerator 
          tripId={trips.length > 0 ? trips[0].id : undefined}
        />
      </div>
    </div>
  );
}