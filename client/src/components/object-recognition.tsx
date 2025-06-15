import React, { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Camera, 
  Eye, 
  MapPin, 
  Utensils, 
  Building, 
  Trees, 
  Car, 
  Users, 
  Zap,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Tag,
  Info
} from "lucide-react";

interface ObjectRecognitionProps {
  photoId: number;
  photoUrl: string;
  onTagsUpdated?: (tags: string[]) => void;
}

interface RecognitionResult {
  objects: ObjectDetection[];
  landmarks: LandmarkInfo[];
  food: FoodInfo[];
  people: PeopleInfo[];
  activities: string[];
  mood: string;
  description: string;
  suggestedTags: string[];
  confidence: number;
}

interface ObjectDetection {
  name: string;
  category: string;
  confidence: number;
  description?: string;
}

interface LandmarkInfo {
  name: string;
  type: string;
  location?: string;
  historicalInfo?: string;
  confidence: number;
}

interface FoodInfo {
  name: string;
  cuisine: string;
  description?: string;
  confidence: number;
}

interface PeopleInfo {
  count: number;
  activities: string[];
  emotions: string[];
}

const categoryIcons = {
  monument: Building,
  food: Utensils,
  nature: Trees,
  transportation: Car,
  people: Users,
  object: Tag,
  location: MapPin,
  activity: Zap,
};

const categoryColors = {
  monument: "bg-purple-100 text-purple-800",
  food: "bg-orange-100 text-orange-800",
  nature: "bg-green-100 text-green-800",
  transportation: "bg-blue-100 text-blue-800",
  people: "bg-pink-100 text-pink-800",
  object: "bg-gray-100 text-gray-800",
  location: "bg-red-100 text-red-800",
  activity: "bg-yellow-100 text-yellow-800",
};

export default function ObjectRecognition({ photoId, photoUrl, onTagsUpdated }: ObjectRecognitionProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [selectedObject, setSelectedObject] = useState<ObjectDetection | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch existing recognition data
  const { data: recognitionData, isLoading } = useQuery({
    queryKey: ['/api/photos', photoId, 'recognition'],
    queryFn: () => apiRequest('GET', `/api/photos/${photoId}/recognition`).then(res => res.json()),
  });

  // Start recognition analysis
  const recognitionMutation = useMutation({
    mutationFn: async () => {
      setIsAnalyzing(true);
      setAnalysisProgress(0);
      
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setAnalysisProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);

      const response = await apiRequest('POST', `/api/photos/${photoId}/analyze`, {
        photoUrl,
        analysisType: 'comprehensive'
      });
      
      clearInterval(progressInterval);
      setAnalysisProgress(100);
      
      return response.json();
    },
    onSuccess: (result: RecognitionResult) => {
      setIsAnalyzing(false);
      setAnalysisProgress(0);
      queryClient.invalidateQueries({ queryKey: ['/api/photos', photoId, 'recognition'] });
      
      if (onTagsUpdated) {
        onTagsUpdated(result.suggestedTags);
      }
      
      toast({
        title: "Analyse terminée",
        description: `${result.objects.length} objets détectés avec ${Math.round(result.confidence * 100)}% de confiance`,
      });
    },
    onError: (error) => {
      setIsAnalyzing(false);
      setAnalysisProgress(0);
      toast({
        title: "Erreur d'analyse",
        description: "Impossible d'analyser cette photo",
        variant: "destructive",
      });
    },
  });

  // Auto-apply suggested tags
  const applyTagsMutation = useMutation({
    mutationFn: async (tags: string[]) => {
      const response = await apiRequest('PUT', `/api/photos/${photoId}/tags`, {
        tags: tags
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/photos', photoId] });
      toast({
        title: "Tags appliqués",
        description: "Les tags suggérés ont été ajoutés à la photo",
      });
    },
  });

  const handleStartAnalysis = () => {
    recognitionMutation.mutate();
  };

  const handleApplyTags = () => {
    if (recognitionData?.suggestedTags) {
      applyTagsMutation.mutate(recognitionData.suggestedTags);
    }
  };

  const getObjectsByCategory = (category: string) => {
    return recognitionData?.objects?.filter((obj: ObjectDetection) => obj.category === category) || [];
  };

  const renderObjectCard = (obj: ObjectDetection) => {
    const IconComponent = categoryIcons[obj.category as keyof typeof categoryIcons] || Tag;
    const colorClass = categoryColors[obj.category as keyof typeof categoryColors] || categoryColors.object;
    
    return (
      <div
        key={`${obj.name}-${obj.category}`}
        className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
        onClick={() => setSelectedObject(obj)}
      >
        <div className="flex items-center gap-2 mb-2">
          <IconComponent className="w-4 h-4" />
          <span className="font-medium text-sm">{obj.name}</span>
          <Badge variant="secondary" className={`text-xs ${colorClass}`}>
            {Math.round(obj.confidence * 100)}%
          </Badge>
        </div>
        {obj.description && (
          <p className="text-xs text-gray-600 line-clamp-2">{obj.description}</p>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Analysis Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Reconnaissance d'objets
            {recognitionData && (
              <Badge variant="secondary" className="ml-auto">
                <CheckCircle className="w-3 h-3 mr-1" />
                Analysée
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isAnalyzing ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span className="text-sm">Analyse en cours...</span>
              </div>
              <Progress value={analysisProgress} className="w-full" />
              <p className="text-xs text-gray-600">
                {analysisProgress < 30 && "Chargement de l'image..."}
                {analysisProgress >= 30 && analysisProgress < 60 && "Détection des objets..."}
                {analysisProgress >= 60 && analysisProgress < 90 && "Analyse des détails..."}
                {analysisProgress >= 90 && "Finalisation..."}
              </p>
            </div>
          ) : !recognitionData ? (
            <div className="text-center py-4">
              <Camera className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 mb-4">Cette photo n'a pas encore été analysée</p>
              <Button onClick={handleStartAnalysis} disabled={recognitionMutation.isPending}>
                <Sparkles className="w-4 h-4 mr-2" />
                Lancer l'analyse
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {recognitionData.objects?.length || 0}
                  </div>
                  <div className="text-xs text-blue-800">Objets détectés</div>
                </div>
                
                <div className="p-3 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {recognitionData.landmarks?.length || 0}
                  </div>
                  <div className="text-xs text-purple-800">Monuments</div>
                </div>
                
                <div className="p-3 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {recognitionData.food?.length || 0}
                  </div>
                  <div className="text-xs text-orange-800">Plats identifiés</div>
                </div>
                
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {Math.round((recognitionData.confidence || 0) * 100)}%
                  </div>
                  <div className="text-xs text-green-800">Confiance</div>
                </div>
              </div>

              {/* Description */}
              {recognitionData.description && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    Description intelligente
                  </h4>
                  <p className="text-sm text-gray-700">{recognitionData.description}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button 
                  onClick={handleStartAnalysis} 
                  variant="outline" 
                  size="sm"
                  disabled={recognitionMutation.isPending}
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Re-analyser
                </Button>
                
                {recognitionData.suggestedTags?.length > 0 && (
                  <Button 
                    onClick={handleApplyTags}
                    size="sm"
                    disabled={applyTagsMutation.isPending}
                  >
                    <Tag className="w-3 h-3 mr-1" />
                    Appliquer les tags ({recognitionData.suggestedTags.length})
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recognition Results */}
      {recognitionData && (
        <>
          {/* Landmarks */}
          {recognitionData.landmarks?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  Monuments et lieux
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recognitionData.landmarks.map((landmark: LandmarkInfo, index: number) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{landmark.name}</h4>
                        <Badge variant="outline">{landmark.type}</Badge>
                      </div>
                      {landmark.location && (
                        <p className="text-sm text-gray-600 mb-1">📍 {landmark.location}</p>
                      )}
                      {landmark.historicalInfo && (
                        <p className="text-xs text-gray-500">{landmark.historicalInfo}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-gray-500">Confiance:</span>
                        <Progress value={landmark.confidence * 100} className="w-20 h-2" />
                        <span className="text-xs">{Math.round(landmark.confidence * 100)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Food */}
          {recognitionData.food?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Utensils className="w-5 h-5" />
                  Nourriture identifiée
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {recognitionData.food.map((food: FoodInfo, index: number) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{food.name}</h4>
                        <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                          {food.cuisine}
                        </Badge>
                      </div>
                      {food.description && (
                        <p className="text-xs text-gray-600 mb-2">{food.description}</p>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Confiance:</span>
                        <Progress value={food.confidence * 100} className="w-16 h-2" />
                        <span className="text-xs">{Math.round(food.confidence * 100)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Objects by Category */}
          {recognitionData.objects?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="w-5 h-5" />
                  Objets détectés
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(categoryIcons).map(([category, IconComponent]) => {
                    const objects = getObjectsByCategory(category);
                    if (objects.length === 0) return null;
                    
                    return (
                      <div key={category}>
                        <h4 className="font-medium mb-2 flex items-center gap-2 capitalize">
                          <IconComponent className="w-4 h-4" />
                          {category === 'monument' ? 'Monuments' : 
                           category === 'food' ? 'Nourriture' :
                           category === 'nature' ? 'Nature' :
                           category === 'transportation' ? 'Transport' :
                           category === 'people' ? 'Personnes' :
                           category === 'location' ? 'Lieux' :
                           category === 'activity' ? 'Activités' : 'Objets'}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                          {objects.map(renderObjectCard)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* People and Activities */}
          {recognitionData.people && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Personnes et activités
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-4 text-sm">
                    <span className="font-medium">Nombre de personnes:</span>
                    <Badge>{recognitionData.people.count}</Badge>
                  </div>
                  
                  {recognitionData.people.activities?.length > 0 && (
                    <div>
                      <span className="font-medium text-sm">Activités:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {recognitionData.people.activities.map((activity: string, index: number) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {activity}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {recognitionData.people.emotions?.length > 0 && (
                    <div>
                      <span className="font-medium text-sm">Émotions détectées:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {recognitionData.people.emotions.map((emotion: string, index: number) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {emotion}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Suggested Tags */}
          {recognitionData.suggestedTags?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Tags suggérés
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {recognitionData.suggestedTags.map((tag: string, index: number) => (
                    <Badge key={index} variant="outline" className="cursor-pointer hover:bg-gray-100">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Object Detail Dialog */}
      {selectedObject && (
        <Dialog open={!!selectedObject} onOpenChange={() => setSelectedObject(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {React.createElement(categoryIcons[selectedObject.category as keyof typeof categoryIcons] || Tag, { className: "w-5 h-5" })}
                {selectedObject.name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Catégorie:</span>
                <Badge className={categoryColors[selectedObject.category as keyof typeof categoryColors]}>
                  {selectedObject.category}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Confiance:</span>
                <Progress value={selectedObject.confidence * 100} className="w-32" />
                <span className="text-sm">{Math.round(selectedObject.confidence * 100)}%</span>
              </div>
              
              {selectedObject.description && (
                <div>
                  <span className="text-sm font-medium">Description:</span>
                  <p className="text-sm text-gray-600 mt-1">{selectedObject.description}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}