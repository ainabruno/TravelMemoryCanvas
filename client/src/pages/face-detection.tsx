import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import FaceDetection from "@/components/face-detection";
import { ScanFace, Users, Camera, Brain } from "lucide-react";

export default function FaceDetectionPage() {
  // Fetch photos for face detection
  const { data: photos = [] } = useQuery({
    queryKey: ['/api/photos'],
  });

  // Fetch albums for batch analysis
  const { data: albums = [] } = useQuery({
    queryKey: ['/api/albums'],
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Détection de visages intelligente</h1>
        <p className="text-gray-600">
          Identifiez automatiquement les personnes dans vos photos de voyage grâce à l'intelligence artificielle
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Photos totales</p>
                <p className="text-2xl font-bold">{Array.isArray(photos) ? photos.length : 0}</p>
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
              <Users className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Visages détectés</p>
                <p className="text-2xl font-bold">47</p>
              </div>
              <ScanFace className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Personnes identifiées</p>
                <p className="text-2xl font-bold">8</p>
              </div>
              <Brain className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Photos for Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Recent Photos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Photos récentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.isArray(photos) && photos.length > 0 ? (
                photos.slice(0, 5).map((photo: any) => (
                  <div key={photo.id} className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <img 
                        src={photo.url} 
                        alt={photo.originalName}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{photo.originalName}</h4>
                        <p className="text-xs text-gray-600">{photo.location || 'Emplacement non défini'}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {new Date(photo.uploadedAt).toLocaleDateString('fr-FR')}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-4">
                  Aucune photo disponible
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Albums for Batch Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Albums à analyser
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.isArray(albums) && albums.length > 0 ? (
                albums.slice(0, 5).map((album: any) => (
                  <div key={album.id} className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{album.title}</h4>
                        <p className="text-xs text-gray-600">{album.description}</p>
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

        {/* Detection Features */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              Fonctionnalités IA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-2 border rounded">
                <ScanFace className="w-8 h-8 text-blue-500" />
                <div>
                  <h4 className="font-medium text-sm">Détection automatique</h4>
                  <p className="text-xs text-gray-600">Identification des visages en temps réel</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-2 border rounded">
                <Users className="w-8 h-8 text-green-500" />
                <div>
                  <h4 className="font-medium text-sm">Reconnaissance faciale</h4>
                  <p className="text-xs text-gray-600">Identification des personnes connues</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-2 border rounded">
                <Brain className="w-8 h-8 text-purple-500" />
                <div>
                  <h4 className="font-medium text-sm">Analyse des émotions</h4>
                  <p className="text-xs text-gray-600">Détection des expressions faciales</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Face Detection Component */}
      <FaceDetection 
        photoId={Array.isArray(photos) && photos.length > 0 ? photos[0]?.id : undefined}
      />
    </div>
  );
}