import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import PhotoBookCreator from "@/components/photo-book-creator";
import PageLayout from "@/components/page-layout";
import { BookOpen, Image as ImageIcon, Layout, Palette, ArrowLeft } from "lucide-react";

export default function PhotoBooksPage() {
  const [, setLocation] = useLocation();
  
  // Fetch trips for photo book creation
  const { data: trips = [] } = useQuery({
    queryKey: ['/api/trips'],
  });

  // Fetch albums for photo book creation
  const { data: albums = [] } = useQuery({
    queryKey: ['/api/albums'],
  });

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setLocation('/')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour au menu
            </Button>
          </div>
          <h1 className="text-3xl font-bold mb-2">Création de livres photo</h1>
          <p className="text-gray-600">
            Transformez vos plus beaux souvenirs de voyage en magnifiques livres photo personnalisés
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
                <BookOpen className="w-8 h-8 text-blue-500" />
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
                <ImageIcon className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Livres créés</p>
                  <p className="text-2xl font-bold">3</p>
                </div>
                <Layout className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Thèmes</p>
                  <p className="text-2xl font-bold">12</p>
                </div>
                <Palette className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Recent Trips */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Voyages récents
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
                              {new Date(trip.startDate).toLocaleDateString('fr-FR')}
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

          {/* Recent Albums */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                Albums récents
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

          {/* Features */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Fonctionnalités IA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-2 border rounded">
                  <Layout className="w-8 h-8 text-blue-500" />
                  <div>
                    <h4 className="font-medium text-sm">Mise en page automatique</h4>
                    <p className="text-xs text-gray-600">IA optimise la disposition</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-2 border rounded">
                  <Palette className="w-8 h-8 text-green-500" />
                  <div>
                    <h4 className="font-medium text-sm">Sélection intelligente</h4>
                    <p className="text-xs text-gray-600">Choix des meilleures photos</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-2 border rounded">
                  <BookOpen className="w-8 h-8 text-purple-500" />
                  <div>
                    <h4 className="font-medium text-sm">Génération de texte</h4>
                    <p className="text-xs text-gray-600">Légendes automatiques</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Photo Book Creator */}
        <PhotoBookCreator 
          tripId={Array.isArray(trips) && trips.length > 0 ? trips[0]?.id : undefined}
        />
      </div>
    </PageLayout>
  );
}