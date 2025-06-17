import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import FaceDetection from "@/components/face-detection";
import PageLayout from "@/components/page-layout";
import { ScanFace, Users, Camera, Brain, ArrowLeft } from "lucide-react";

export default function FaceDetectionPage() {
  const [, setLocation] = useLocation();
  
  // Fetch photos for face detection
  const { data: photos = [] } = useQuery({
    queryKey: ['/api/photos'],
  });

  // Fetch albums for batch analysis
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
                  <p className="text-2xl font-bold">12</p>
                </div>
                <Brain className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Face Detection Component */}
        <FaceDetection 
          photoId={Array.isArray(photos) && photos.length > 0 ? photos[0]?.id : undefined}
        />
      </div>
    </PageLayout>
  );
}