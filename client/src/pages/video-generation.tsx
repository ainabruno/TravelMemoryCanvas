import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import VideoGenerator from "@/components/video-generator";
import { Video, Play, Film, Music, Camera, Settings } from "lucide-react";

export default function VideoGenerationPage() {
  // Fetch trips for video generation
  const { data: trips = [] } = useQuery({
    queryKey: ['/api/trips'],
  });

  // Fetch albums for video generation
  const { data: albums = [] } = useQuery({
    queryKey: ['/api/albums'],
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Génération de vidéos automatiques</h1>
        <p className="text-gray-600">
          Créez des vidéos époustouflantes à partir de vos photos de voyage avec l'intelligence artificielle
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Voyages</p>
                <p className="text-2xl font-bold">{Array.isArray(trips) ? trips.length : 0}</p>
              </div>
              <Camera className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Albums</p>
                <p className="text-2xl font-bold">{Array.isArray(albums) ? albums.length : 0}</p>
              </div>
              <Film className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Vidéos créées</p>
                <p className="text-2xl font-bold">2</p>
              </div>
              <Video className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Templates</p>
                <p className="text-2xl font-bold">5</p>
              </div>
              <Settings className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Features Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* AI Features */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="w-5 h-5" />
              Fonctionnalités IA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-2 border rounded">
                <Play className="w-8 h-8 text-blue-500" />
                <div>
                  <h4 className="font-medium text-sm">Montage automatique</h4>
                  <p className="text-xs text-gray-600">Sélection et organisation intelligente</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-2 border rounded">
                <Music className="w-8 h-8 text-green-500" />
                <div>
                  <h4 className="font-medium text-sm">Synchronisation musicale</h4>
                  <p className="text-xs text-gray-600">Musique adaptée au rythme</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-2 border rounded">
                <Film className="w-8 h-8 text-purple-500" />
                <div>
                  <h4 className="font-medium text-sm">Transitions dynamiques</h4>
                  <p className="text-xs text-gray-600">Effets visuels professionnels</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Video Templates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Film className="w-5 h-5" />
              Styles disponibles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-sm">Voyage Cinématique</h4>
                  <Badge variant="secondary" className="text-xs">Epic</Badge>
                </div>
                <p className="text-xs text-gray-600">Style documentaire avec musique orchestrale</p>
              </div>

              <div className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-sm">Aventure Dynamique</h4>
                  <Badge variant="secondary" className="text-xs">Énergique</Badge>
                </div>
                <p className="text-xs text-gray-600">Rythme soutenu pour voyages actifs</p>
              </div>

              <div className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-sm">Souvenirs Paisibles</h4>
                  <Badge variant="secondary" className="text-xs">Relaxant</Badge>
                </div>
                <p className="text-xs text-gray-600">Ambiance douce et contemplative</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Export Options */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Options d'export
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 border rounded-lg">
                <h4 className="font-medium text-sm mb-1">Qualités disponibles</h4>
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-xs">720p</Badge>
                  <Badge variant="outline" className="text-xs">1080p</Badge>
                  <Badge variant="outline" className="text-xs">4K</Badge>
                </div>
              </div>

              <div className="p-3 border rounded-lg">
                <h4 className="font-medium text-sm mb-1">Formats supportés</h4>
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-xs">MP4</Badge>
                  <Badge variant="outline" className="text-xs">MOV</Badge>
                  <Badge variant="outline" className="text-xs">WebM</Badge>
                </div>
              </div>

              <div className="p-3 border rounded-lg">
                <h4 className="font-medium text-sm mb-1">Ratios d'aspect</h4>
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-xs">16:9</Badge>
                  <Badge variant="outline" className="text-xs">9:16</Badge>
                  <Badge variant="outline" className="text-xs">1:1</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Source Selection */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Trips */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Créer depuis un voyage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.isArray(trips) && trips.length > 0 ? (
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
              <Film className="w-5 h-5" />
              Créer depuis un album
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.isArray(albums) && albums.length > 0 ? (
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
      </div>

      {/* Main Video Generator */}
      <VideoGenerator 
        tripId={Array.isArray(trips) && trips.length > 0 ? trips[0]?.id : undefined}
      />
    </div>
  );
}