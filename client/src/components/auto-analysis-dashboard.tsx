import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  Zap, 
  Camera, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw,
  Sparkles,
  Eye,
  MapPin,
  Utensils,
  Building,
  Tag,
  Play,
  Pause,
  Settings
} from "lucide-react";

interface AutoAnalysisDashboardProps {
  className?: string;
}

interface AnalysisProgress {
  total: number;
  completed: number;
  failed: number;
  inProgress: number;
  currentPhoto?: {
    id: number;
    url: string;
    originalName: string;
  };
}

export default function AutoAnalysisDashboard({ className = "" }: AutoAnalysisDashboardProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState<AnalysisProgress>({
    total: 0,
    completed: 0,
    failed: 0,
    inProgress: 0
  });
  const [autoAnalysisEnabled, setAutoAnalysisEnabled] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch photos for analysis
  const { data: photos = [], isLoading } = useQuery({
    queryKey: ['/api/photos'],
    queryFn: () => apiRequest('GET', '/api/photos').then(res => res.json()),
  });

  // Get unanalyzed photos
  const unanalyzedPhotos = photos.filter((photo: any) => {
    const metadata = photo.metadata ? JSON.parse(photo.metadata) : {};
    return !metadata.analyzed;
  });

  // Batch analysis mutation
  const batchAnalysisMutation = useMutation({
    mutationFn: async (photoIds: number[]) => {
      setIsAnalyzing(true);
      setAnalysisProgress({
        total: photoIds.length,
        completed: 0,
        failed: 0,
        inProgress: photoIds.length
      });

      // Process photos in batches to avoid overwhelming the API
      const batchSize = 3;
      const results: Array<{photoId: number, success: boolean, result?: any, error?: string}> = [];
      
      for (let i = 0; i < photoIds.length; i += batchSize) {
        const batch = photoIds.slice(i, i + batchSize);
        
        try {
          const batchResults = await Promise.allSettled(
            batch.map(async (photoId) => {
              const photo = photos.find((p: any) => p.id === photoId);
              setAnalysisProgress(prev => ({ ...prev, currentPhoto: photo }));
              
              const response = await apiRequest('POST', `/api/photos/${photoId}/analyze`, {
                photoUrl: photo?.url,
                analysisType: 'comprehensive'
              });
              
              return response.json();
            })
          );

          batchResults.forEach((result, index) => {
            const photoId = batch[index];
            if (result.status === 'fulfilled') {
              results.push({ photoId, success: true, result: result.value });
              setAnalysisProgress(prev => ({
                ...prev,
                completed: prev.completed + 1,
                inProgress: prev.inProgress - 1
              }));
            } else {
              results.push({ photoId, success: false, error: result.reason });
              setAnalysisProgress(prev => ({
                ...prev,
                failed: prev.failed + 1,
                inProgress: prev.inProgress - 1
              }));
            }
          });

          // Small delay between batches to respect API limits
          if (i + batchSize < photoIds.length) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (error) {
          // Handle batch error
          batch.forEach(photoId => {
            results.push({ photoId, success: false, error: 'Batch processing failed' });
            setAnalysisProgress(prev => ({
              ...prev,
              failed: prev.failed + 1,
              inProgress: prev.inProgress - 1
            }));
          });
        }
      }

      return { results };
    },
    onSuccess: (data) => {
      setIsAnalyzing(false);
      setAnalysisProgress(prev => ({ ...prev, currentPhoto: undefined }));
      queryClient.invalidateQueries({ queryKey: ['/api/photos'] });
      
      const successCount = data.results.filter(r => r.success).length;
      const failureCount = data.results.filter(r => !r.success).length;
      
      toast({
        title: "Analyse terminée",
        description: `${successCount} photos analysées avec succès, ${failureCount} échecs`,
      });
    },
    onError: (error) => {
      setIsAnalyzing(false);
      setAnalysisProgress(prev => ({ ...prev, currentPhoto: undefined }));
      toast({
        title: "Erreur d'analyse",
        description: "Impossible de terminer l'analyse automatique",
        variant: "destructive",
      });
    },
  });

  // Single photo analysis mutation
  const singleAnalysisMutation = useMutation({
    mutationFn: async (photoId: number) => {
      const photo = photos.find((p: any) => p.id === photoId);
      if (!photo) throw new Error("Photo not found");

      const response = await apiRequest('POST', `/api/photos/${photoId}/analyze`, {
        photoUrl: photo.url,
        analysisType: 'comprehensive'
      });
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/photos'] });
      toast({
        title: "Photo analysée",
        description: "L'analyse de la photo est terminée",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'analyser cette photo",
        variant: "destructive",
      });
    },
  });

  const handleStartBatchAnalysis = () => {
    const photoIds = unanalyzedPhotos.map((photo: any) => photo.id);
    if (photoIds.length === 0) {
      toast({
        title: "Aucune photo à analyser",
        description: "Toutes les photos ont déjà été analysées",
      });
      return;
    }
    batchAnalysisMutation.mutate(photoIds);
  };

  const handleAnalyzeSinglePhoto = (photoId: number) => {
    singleAnalysisMutation.mutate(photoId);
  };

  const getProgressPercentage = () => {
    if (analysisProgress.total === 0) return 0;
    return (analysisProgress.completed / analysisProgress.total) * 100;
  };

  const getAnalysisStats = () => {
    const analyzedPhotos = photos.filter((photo: any) => {
      const metadata = photo.metadata ? JSON.parse(photo.metadata) : {};
      return metadata.analyzed;
    });

    return {
      total: photos.length,
      analyzed: analyzedPhotos.length,
      pending: unanalyzedPhotos.length,
      rate: photos.length > 0 ? (analyzedPhotos.length / photos.length) * 100 : 0
    };
  };

  const stats = getAnalysisStats();

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Analysis Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Analyse automatique des photos
            {autoAnalysisEnabled && (
              <Badge variant="default" className="bg-green-100 text-green-800">
                <Zap className="w-3 h-3 mr-1" />
                Activé
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-blue-800">Photos totales</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.analyzed}</div>
              <div className="text-sm text-green-800">Analysées</div>
            </div>
            
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
              <div className="text-sm text-orange-800">En attente</div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{Math.round(stats.rate)}%</div>
              <div className="text-sm text-purple-800">Taux completion</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progression globale</span>
              <span>{stats.analyzed}/{stats.total}</span>
            </div>
            <Progress value={stats.rate} className="w-full" />
          </div>

          {/* Auto Analysis Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <Label htmlFor="auto-analysis" className="text-sm font-medium">
                Analyse automatique des nouvelles photos
              </Label>
              <p className="text-xs text-gray-600 mt-1">
                Analyser automatiquement chaque nouvelle photo uploadée
              </p>
            </div>
            <Switch
              id="auto-analysis"
              checked={autoAnalysisEnabled}
              onCheckedChange={setAutoAnalysisEnabled}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button 
              onClick={handleStartBatchAnalysis}
              disabled={isAnalyzing || unanalyzedPhotos.length === 0}
              className="flex-1"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Analyse en cours...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Analyser toutes ({unanalyzedPhotos.length})
                </>
              )}
            </Button>
            
            <Button variant="outline" disabled={isAnalyzing}>
              <Settings className="w-4 h-4 mr-2" />
              Paramètres
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Current Analysis Progress */}
      {isAnalyzing && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin" />
              Analyse en cours
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Photos traitées</span>
                <span>{analysisProgress.completed + analysisProgress.failed}/{analysisProgress.total}</span>
              </div>
              <Progress value={getProgressPercentage()} className="w-full" />
            </div>

            {analysisProgress.currentPhoto && (
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <img 
                  src={analysisProgress.currentPhoto.url} 
                  alt={analysisProgress.currentPhoto.originalName}
                  className="w-12 h-12 object-cover rounded"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium">Analyse en cours</p>
                  <p className="text-xs text-gray-600">{analysisProgress.currentPhoto.originalName}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-green-600">✓ {analysisProgress.completed}</span>
                    <span className="text-red-600">✗ {analysisProgress.failed}</span>
                    <span className="text-blue-600">⟳ {analysisProgress.inProgress}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recent Analysis Results */}
      {!isAnalyzing && unanalyzedPhotos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Photos en attente d'analyse
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {unanalyzedPhotos.slice(0, 6).map((photo: any) => (
                <div key={photo.id} className="group relative">
                  <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                    <img 
                      src={photo.url} 
                      alt={photo.originalName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg">
                    <Button
                      size="sm"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleAnalyzeSinglePhoto(photo.id)}
                      disabled={singleAnalysisMutation.isPending}
                    >
                      <Eye className="w-3 h-3" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-600 mt-2 truncate">{photo.originalName}</p>
                </div>
              ))}
            </div>
            
            {unanalyzedPhotos.length > 6 && (
              <div className="text-center mt-4">
                <p className="text-sm text-gray-600">
                  +{unanalyzedPhotos.length - 6} autres photos en attente
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Feature Showcase */}
      <Card>
        <CardHeader>
          <CardTitle>Capacités de reconnaissance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <Building className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <h4 className="font-medium text-sm">Monuments</h4>
              <p className="text-xs text-gray-600">Identification des sites historiques</p>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <Utensils className="w-8 h-8 text-orange-600 mx-auto mb-2" />
              <h4 className="font-medium text-sm">Cuisine</h4>
              <p className="text-xs text-gray-600">Reconnaissance des plats et cuisines</p>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <MapPin className="w-8 h-8 text-red-600 mx-auto mb-2" />
              <h4 className="font-medium text-sm">Lieux</h4>
              <p className="text-xs text-gray-600">Géolocalisation intelligente</p>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <Tag className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <h4 className="font-medium text-sm">Tags</h4>
              <p className="text-xs text-gray-600">Étiquetage automatique</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}