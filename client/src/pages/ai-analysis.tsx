import React from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import AutoAnalysisDashboard from "@/components/auto-analysis-dashboard";
import ObjectRecognition from "@/components/object-recognition";
import PageLayout from "@/components/page-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Brain, 
  Camera, 
  Eye, 
  Sparkles,
  Building,
  Utensils,
  MapPin,
  Tag,
  TrendingUp,
  Zap
} from "lucide-react";

export default function AIAnalysisPage() {
  // Fetch photos for analysis showcase
  const { data: photos = [], isLoading } = useQuery({
    queryKey: ['/api/photos'],
    queryFn: () => apiRequest('GET', '/api/photos').then(res => res.json()),
  });

  // Get sample analyzed photo for demonstration
  const samplePhoto = photos.find((photo: any) => {
    const metadata = photo.metadata ? JSON.parse(photo.metadata) : {};
    return metadata.analyzed;
  }) || photos[0];

  const getAnalysisStats = () => {
    const analyzedPhotos = photos.filter((photo: any) => {
      const metadata = photo.metadata ? JSON.parse(photo.metadata) : {};
      return metadata.analyzed;
    });

    return {
      total: photos.length,
      analyzed: analyzedPhotos.length,
      rate: photos.length > 0 ? (analyzedPhotos.length / photos.length) * 100 : 0
    };
  };

  const stats = getAnalysisStats();

  return (
    <PageLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Page Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <Brain className="w-8 h-8 text-purple-600" />
          <h1 className="text-3xl font-bold">Intelligence Artificielle</h1>
          <Badge variant="secondary" className="bg-purple-100 text-purple-800">
            <Sparkles className="w-3 h-3 mr-1" />
            Powered by GPT-4 Vision
          </Badge>
        </div>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Analysez automatiquement vos photos de voyage avec l'intelligence artificielle. 
          Identifiez des monuments, des plats, des objets et générez des tags intelligents 
          pour organiser vos souvenirs.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Camera className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-gray-600">Photos totales</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Eye className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-600">{stats.analyzed}</div>
            <div className="text-sm text-gray-600">Photos analysées</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-purple-600">{Math.round(stats.rate)}%</div>
            <div className="text-sm text-gray-600">Taux completion</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Zap className="w-8 h-8 text-orange-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-orange-600">4.0</div>
            <div className="text-sm text-gray-600">GPT-4 Vision</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dashboard">Tableau de bord</TabsTrigger>
          <TabsTrigger value="analysis" disabled={!samplePhoto}>
            Analyse détaillée
          </TabsTrigger>
          <TabsTrigger value="features">Fonctionnalités</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <AutoAnalysisDashboard />
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          {samplePhoto ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Photo Preview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="w-5 h-5" />
                    Photo d'exemple
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                    <img 
                      src={samplePhoto.url} 
                      alt={samplePhoto.originalName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-medium">{samplePhoto.originalName}</p>
                    {samplePhoto.caption && (
                      <p className="text-sm text-gray-600">{samplePhoto.caption}</p>
                    )}
                    {samplePhoto.location && (
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <MapPin className="w-3 h-3" />
                        {samplePhoto.location}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Analysis Results */}
              <div className="space-y-6">
                <ObjectRecognition 
                  photoId={samplePhoto.id}
                  photoUrl={samplePhoto.url}
                />
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Camera className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Aucune photo analysée</h3>
                <p className="text-gray-600">
                  Uploadez des photos et lancez l'analyse pour voir les résultats détaillés ici.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="features" className="space-y-6">
          {/* AI Features Showcase */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5 text-purple-600" />
                  Reconnaissance de monuments
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600">
                  Identifiez automatiquement les monuments célèbres, églises, musées et sites historiques dans vos photos.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                    <span className="text-sm">Nom exact du monument</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                    <span className="text-sm">Localisation géographique</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                    <span className="text-sm">Informations historiques</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Utensils className="w-5 h-5 text-orange-600" />
                  Identification culinaire
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600">
                  Reconnaissez les plats, spécialités locales et types de cuisine dans vos photos de voyage.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                    <span className="text-sm">Nom des plats spécifiques</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                    <span className="text-sm">Type de cuisine et origine</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                    <span className="text-sm">Description et ingrédients</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-blue-600" />
                  Analyse contextuelle
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600">
                  Comprenez le contexte de vos photos avec l'analyse des activités, émotions et atmosphères.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span className="text-sm">Activités détectées</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span className="text-sm">Émotions et ambiance</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span className="text-sm">Nombre de personnes</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="w-5 h-5 text-green-600" />
                  Tags intelligents
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600">
                  Générez automatiquement des tags pertinents pour organiser et retrouver facilement vos photos.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    <span className="text-sm">Tags géographiques</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    <span className="text-sm">Tags d'activités</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    <span className="text-sm">Tags thématiques</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Technical Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                Technologie GPT-4 Vision
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                Notre système utilise GPT-4 Vision d'OpenAI, le modèle d'intelligence artificielle le plus avancé 
                pour l'analyse d'images. Cette technologie combine la compréhension du langage naturel avec 
                la vision par ordinateur pour fournir des analyses précises et détaillées de vos photos.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-xl font-bold text-blue-600">95%+</div>
                  <div className="text-sm text-blue-800">Précision moyenne</div>
                </div>
                
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-xl font-bold text-green-600">50+</div>
                  <div className="text-sm text-green-800">Catégories d'objets</div>
                </div>
                
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-xl font-bold text-purple-600">1000+</div>
                  <div className="text-sm text-purple-800">Monuments connus</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
        </div>
      </div>
    </PageLayout>
  );
}