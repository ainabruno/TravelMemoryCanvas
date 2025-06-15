import React, { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  User, 
  ScanFace,
  UserCheck,
  UserX,
  Eye,
  Camera,
  Download,
  Share,
  Settings,
  Zap,
  AlertTriangle,
  CheckCircle,
  Clock,
  Tag,
  Search,
  Filter,
  RefreshCw,
  Edit
} from "lucide-react";

interface FaceDetectionProps {
  photoId?: number;
  albumId?: number;
  className?: string;
}

interface DetectedFace {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  personId?: string;
  personName?: string;
  age?: number;
  gender?: string;
  emotion?: string;
  ethnicity?: string;
  landmarks?: FaceLandmark[];
  isVerified?: boolean;
}

interface FaceLandmark {
  type: 'left_eye' | 'right_eye' | 'nose' | 'mouth' | 'left_eyebrow' | 'right_eyebrow';
  x: number;
  y: number;
}

interface Person {
  id: string;
  name: string;
  photoCount: number;
  firstSeen: string;
  lastSeen: string;
  avatarUrl?: string;
  isFamily?: boolean;
  isFriend?: boolean;
  notes?: string;
  tags?: string[];
}

interface FaceAnalysisResult {
  faces: DetectedFace[];
  totalFaces: number;
  uniquePeople: number;
  groupSize: 'solo' | 'couple' | 'small_group' | 'large_group';
  mood: 'happy' | 'serious' | 'neutral' | 'mixed';
  setting: 'indoor' | 'outdoor' | 'unknown';
  confidence: number;
}

export default function FaceDetection({ photoId, albumId, className = "" }: FaceDetectionProps) {
  const [selectedFace, setSelectedFace] = useState<DetectedFace | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [tagMode, setTagMode] = useState(false);
  const [newPersonName, setNewPersonName] = useState('');
  const [personNotes, setPersonNotes] = useState('');
  const [autoDetection, setAutoDetection] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch photo for analysis
  const { data: photo } = useQuery({
    queryKey: photoId ? ['/api/photos', photoId] : ['/api/photos', 'none'],
    queryFn: () => photoId ? apiRequest('GET', `/api/photos/${photoId}`).then(res => res.json()) : null,
    enabled: !!photoId
  });

  // Fetch album photos for batch analysis
  const { data: albumPhotos = [] } = useQuery({
    queryKey: albumId ? ['/api/photos/album', albumId] : ['/api/photos'],
    queryFn: () => {
      const endpoint = albumId ? `/api/photos/album/${albumId}` : '/api/photos';
      return apiRequest('GET', endpoint).then(res => res.json());
    }
  });

  // Fetch detected faces
  const { data: detectedFaces = [] } = useQuery({
    queryKey: ['/api/faces', photoId || 'all'],
    queryFn: () => {
      const endpoint = photoId ? `/api/faces/photo/${photoId}` : '/api/faces';
      return apiRequest('GET', endpoint).then(res => res.json());
    }
  });

  // Fetch known people
  const { data: knownPeople = [] } = useQuery({
    queryKey: ['/api/people'],
    queryFn: () => apiRequest('GET', '/api/people').then(res => res.json())
  });

  // Face detection mutation
  const detectFacesMutation = useMutation({
    mutationFn: async (data: { photoId?: number; albumId?: number; settings?: any }) => {
      setIsAnalyzing(true);
      setAnalysisProgress(0);

      const progressInterval = setInterval(() => {
        setAnalysisProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);

      const response = await apiRequest('POST', '/api/faces/detect', data);
      
      clearInterval(progressInterval);
      setAnalysisProgress(100);

      return response.json();
    },
    onSuccess: (result: FaceAnalysisResult) => {
      setIsAnalyzing(false);
      setAnalysisProgress(0);
      queryClient.invalidateQueries({ queryKey: ['/api/faces'] });
      
      toast({
        title: "Détection terminée",
        description: `${result.totalFaces} visages détectés, ${result.uniquePeople} personnes uniques`,
      });
    },
    onError: () => {
      setIsAnalyzing(false);
      setAnalysisProgress(0);
      toast({
        title: "Erreur de détection",
        description: "Impossible d'analyser les visages",
        variant: "destructive",
      });
    },
  });

  // Tag person mutation
  const tagPersonMutation = useMutation({
    mutationFn: async (data: { faceId: string; personName: string; isNewPerson: boolean; notes?: string }) => {
      return apiRequest('POST', '/api/faces/tag', data).then(res => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/faces'] });
      queryClient.invalidateQueries({ queryKey: ['/api/people'] });
      setTagMode(false);
      setNewPersonName('');
      setPersonNotes('');
      toast({
        title: "Personne taguée",
        description: "Le visage a été associé à la personne",
      });
    },
  });

  // Batch analysis mutation
  const batchAnalysisMutation = useMutation({
    mutationFn: async () => {
      const photos = albumId ? albumPhotos : albumPhotos.slice(0, 20);
      
      for (let i = 0; i < photos.length; i++) {
        setAnalysisProgress((i / photos.length) * 100);
        await apiRequest('POST', '/api/faces/detect', { photoId: photos[i].id });
        
        // Small delay to prevent overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      return { analyzed: photos.length };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['/api/faces'] });
      toast({
        title: "Analyse en lot terminée",
        description: `${result.analyzed} photos analysées`,
      });
    },
  });

  const handleDetectFaces = () => {
    if (photoId) {
      detectFacesMutation.mutate({ photoId });
    } else if (albumId) {
      detectFacesMutation.mutate({ albumId });
    }
  };

  const handleBatchAnalysis = () => {
    setIsAnalyzing(true);
    batchAnalysisMutation.mutate();
  };

  const handleTagPerson = () => {
    if (!selectedFace || !newPersonName.trim()) return;

    tagPersonMutation.mutate({
      faceId: selectedFace.id,
      personName: newPersonName.trim(),
      isNewPerson: !knownPeople.find((p: Person) => p.name.toLowerCase() === newPersonName.toLowerCase()),
      notes: personNotes
    });
  };

  const drawFaceBoxes = () => {
    if (!canvasRef.current || !imageRef.current || !photo) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = imageRef.current;

    if (!ctx) return;

    // Set canvas size to match image
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw face boxes
    detectedFaces.forEach((face: DetectedFace) => {
      ctx.strokeStyle = face.personName ? '#10b981' : '#ef4444';
      ctx.lineWidth = 3;
      ctx.strokeRect(
        face.x * canvas.width,
        face.y * canvas.height,
        face.width * canvas.width,
        face.height * canvas.height
      );

      // Draw person name or "Unknown"
      if (face.personName || !face.personName) {
        ctx.fillStyle = face.personName ? '#10b981' : '#ef4444';
        ctx.font = '16px sans-serif';
        ctx.fillText(
          face.personName || 'Inconnu',
          face.x * canvas.width,
          face.y * canvas.height - 5
        );
      }

      // Draw confidence score
      ctx.fillStyle = '#6b7280';
      ctx.font = '12px sans-serif';
      ctx.fillText(
        `${Math.round(face.confidence * 100)}%`,
        face.x * canvas.width,
        (face.y + face.height) * canvas.height + 15
      );
    });
  };

  useEffect(() => {
    if (photo && detectedFaces.length > 0) {
      // Wait for image to load before drawing
      if (imageRef.current?.complete) {
        drawFaceBoxes();
      }
    }
  }, [photo, detectedFaces]);

  const filteredPeople = knownPeople.filter((person: Person) =>
    person.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalFaces = detectedFaces.length;
  const identifiedFaces = detectedFaces.filter((face: DetectedFace) => face.personName).length;
  const unknownFaces = totalFaces - identifiedFaces;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <ScanFace className="w-6 h-6 text-blue-600" />
            Détection de visages
          </h2>
          <p className="text-gray-600">
            Identifiez automatiquement les personnes dans vos photos
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="w-4 h-4 mr-1" />
            Paramètres
          </Button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Paramètres de détection
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="auto-detection"
                checked={autoDetection}
                onCheckedChange={setAutoDetection}
              />
              <Label htmlFor="auto-detection">Détection automatique lors de l'upload</Label>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Seuil de confiance</Label>
                <Input type="range" min="0.1" max="1" step="0.1" defaultValue="0.7" className="mt-1" />
              </div>
              <div>
                <Label className="text-sm font-medium">Taille minimale du visage</Label>
                <Input type="range" min="20" max="200" defaultValue="50" className="mt-1" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Visages détectés</p>
                <p className="text-2xl font-bold">{totalFaces}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Identifiés</p>
                <p className="text-2xl font-bold text-green-600">{identifiedFaces}</p>
              </div>
              <UserCheck className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Inconnus</p>
                <p className="text-2xl font-bold text-red-600">{unknownFaces}</p>
              </div>
              <UserX className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Personnes</p>
                <p className="text-2xl font-bold">{knownPeople.length}</p>
              </div>
              <User className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detection Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Analyser les visages
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            {photoId && (
              <Button 
                onClick={handleDetectFaces}
                disabled={isAnalyzing || detectFacesMutation.isPending}
              >
                <ScanFace className="w-4 h-4 mr-2" />
                Analyser cette photo
              </Button>
            )}
            
            <Button 
              onClick={handleBatchAnalysis}
              disabled={isAnalyzing || batchAnalysisMutation.isPending}
              variant="outline"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Analyse en lot
            </Button>
          </div>

          {/* Progress */}
          {isAnalyzing && (
            <div className="space-y-2">
              <Progress value={analysisProgress} className="w-full" />
              <p className="text-xs text-center text-gray-600">
                {analysisProgress < 30 && "Préparation de l'analyse..."}
                {analysisProgress >= 30 && analysisProgress < 60 && "Détection des visages..."}
                {analysisProgress >= 60 && analysisProgress < 90 && "Analyse des caractéristiques..."}
                {analysisProgress >= 90 && "Finalisation..."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Photo with Face Detection */}
      {photo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Visages détectés
              <Badge variant="secondary">{detectedFaces.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <img
                ref={imageRef}
                src={photo.url}
                alt={photo.originalName}
                className="w-full max-w-2xl rounded-lg"
                onLoad={drawFaceBoxes}
              />
              <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 w-full h-full pointer-events-none"
                style={{ maxWidth: '100%', height: 'auto' }}
                onClick={(e) => {
                  // Handle face selection for tagging
                  const rect = canvasRef.current?.getBoundingClientRect();
                  if (!rect) return;
                  
                  const x = (e.clientX - rect.left) / rect.width;
                  const y = (e.clientY - rect.top) / rect.height;
                  
                  const clickedFace = detectedFaces.find((face: DetectedFace) => 
                    x >= face.x && x <= face.x + face.width &&
                    y >= face.y && y <= face.y + face.height
                  );
                  
                  if (clickedFace) {
                    setSelectedFace(clickedFace);
                    setTagMode(true);
                  }
                }}
              />
            </div>

            {/* Face List */}
            {detectedFaces.length > 0 && (
              <div className="mt-4 space-y-2">
                <h4 className="font-medium">Visages détectés:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {detectedFaces.map((face: DetectedFace) => (
                    <div key={face.id} className="border rounded-lg p-3 flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={face.personName ? "default" : "secondary"}>
                            {face.personName || "Inconnu"}
                          </Badge>
                          <span className="text-sm text-gray-600">
                            {Math.round(face.confidence * 100)}% confiance
                          </span>
                        </div>
                        {face.age && (
                          <p className="text-xs text-gray-500 mt-1">
                            {face.age} ans • {face.gender} • {face.emotion}
                          </p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedFace(face);
                          setTagMode(true);
                        }}
                      >
                        <Tag className="w-3 h-3 mr-1" />
                        Taguer
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tagging Modal */}
      {tagMode && selectedFace && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="w-5 h-5" />
              Identifier la personne
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="person-name">Nom de la personne</Label>
              <Input
                id="person-name"
                value={newPersonName}
                onChange={(e) => setNewPersonName(e.target.value)}
                placeholder="Entrez le nom..."
                className="mt-1"
              />
            </div>

            {/* Suggestions from known people */}
            {knownPeople.length > 0 && (
              <div>
                <Label className="text-sm font-medium">Personnes connues:</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {knownPeople.slice(0, 6).map((person: Person) => (
                    <Button
                      key={person.id}
                      variant="outline"
                      size="sm"
                      onClick={() => setNewPersonName(person.name)}
                    >
                      {person.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="person-notes">Notes (optionnel)</Label>
              <Textarea
                id="person-notes"
                value={personNotes}
                onChange={(e) => setPersonNotes(e.target.value)}
                placeholder="Ajoutez des notes sur cette personne..."
                className="mt-1"
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleTagPerson}
                disabled={!newPersonName.trim() || tagPersonMutation.isPending}
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Confirmer
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  setTagMode(false);
                  setSelectedFace(null);
                  setNewPersonName('');
                  setPersonNotes('');
                }}
              >
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Known People */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Personnes identifiées
            <Badge variant="secondary">{knownPeople.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-gray-400" />
              <Input
                placeholder="Rechercher une personne..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPeople.length > 0 ? (
                filteredPeople.map((person: Person) => (
                  <Card key={person.id} className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{person.name}</h4>
                        <p className="text-sm text-gray-600">{person.photoCount} photos</p>
                        <div className="flex gap-1 mt-1">
                          {person.isFamily && <Badge variant="secondary" className="text-xs">Famille</Badge>}
                          {person.isFriend && <Badge variant="secondary" className="text-xs">Ami</Badge>}
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        <Edit className="w-3 h-3" />
                      </Button>
                    </div>
                  </Card>
                ))
              ) : (
                <p className="text-center text-gray-500 col-span-full py-8">
                  {searchQuery ? 'Aucune personne trouvée' : 'Aucune personne identifiée'}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}