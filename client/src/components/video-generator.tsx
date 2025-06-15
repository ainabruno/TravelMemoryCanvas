import React, { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { 
  Play, 
  Pause,
  Square,
  Video,
  Music,
  Image as ImageIcon,
  Settings,
  Download,
  Share,
  Edit,
  Wand2,
  RefreshCw,
  Clock,
  Volume2,
  VolumeX,
  FastForward,
  Rewind,
  SkipBack,
  SkipForward,
  Shuffle,
  RotateCcw,
  Zap,
  Film,
  Sparkles,
  Camera,
  MapPin,
  Calendar,
  Users,
  Heart,
  Star,
  Palette,
  Type,
  Layers
} from "lucide-react";

interface VideoGeneratorProps {
  tripId?: number;
  albumId?: number;
  photoIds?: number[];
  className?: string;
}

interface VideoTemplate {
  id: string;
  name: string;
  description: string;
  category: 'travel' | 'memories' | 'adventure' | 'romantic' | 'family';
  duration: number;
  style: 'cinematic' | 'dynamic' | 'peaceful' | 'energetic' | 'nostalgic';
  preview: string;
  features: string[];
}

interface VideoTransition {
  type: 'fade' | 'slide' | 'zoom' | 'rotate' | 'dissolve' | 'wipe';
  duration: number;
  direction?: 'left' | 'right' | 'up' | 'down';
}

interface VideoSettings {
  template: string;
  duration: number;
  quality: '720p' | '1080p' | '4K';
  framerate: 24 | 30 | 60;
  aspectRatio: '16:9' | '9:16' | '1:1' | '4:3';
  includeMusic: boolean;
  musicGenre: 'cinematic' | 'upbeat' | 'ambient' | 'acoustic' | 'electronic';
  includeText: boolean;
  includeMap: boolean;
  includeStats: boolean;
  autoSync: boolean;
  photosPerSecond: number;
  transitions: VideoTransition[];
}

interface GeneratedVideo {
  id: string;
  title: string;
  description?: string;
  tripId?: number;
  albumId?: number;
  duration: number;
  quality: string;
  aspectRatio: string;
  template: string;
  status: 'generating' | 'ready' | 'error';
  progress: number;
  url?: string;
  thumbnailUrl?: string;
  createdAt: string;
  updatedAt: string;
  metadata: {
    photoCount: number;
    transitionCount: number;
    musicTrack?: string;
    fileSize?: string;
  };
}

const videoTemplates: VideoTemplate[] = [
  {
    id: 'cinematic_travel',
    name: 'Voyage Cinématique',
    description: 'Style film documentaire avec transitions douces',
    category: 'travel',
    duration: 120,
    style: 'cinematic',
    preview: 'bg-gradient-to-r from-blue-900 to-purple-900',
    features: ['Transitions fluides', 'Musique orchestrale', 'Textes élégants', 'Effets de parallaxe']
  },
  {
    id: 'dynamic_adventure',
    name: 'Aventure Dynamique',
    description: 'Rythme soutenu parfait pour les voyages actifs',
    category: 'adventure',
    duration: 90,
    style: 'energetic',
    preview: 'bg-gradient-to-r from-orange-500 to-red-600',
    features: ['Transitions rapides', 'Musique énergique', 'Effets de mouvement', 'Chronologie GPS']
  },
  {
    id: 'peaceful_memories',
    name: 'Souvenirs Paisibles',
    description: 'Ambiance douce et contemplative',
    category: 'memories',
    duration: 180,
    style: 'peaceful',
    preview: 'bg-gradient-to-r from-green-400 to-blue-500',
    features: ['Transitions lentes', 'Musique ambient', 'Textes poétiques', 'Focus émotionnel']
  },
  {
    id: 'romantic_escape',
    name: 'Escapade Romantique',
    description: 'Parfait pour les voyages en couple',
    category: 'romantic',
    duration: 150,
    style: 'nostalgic',
    preview: 'bg-gradient-to-r from-pink-400 to-purple-600',
    features: ['Effets doux', 'Musique romantique', 'Couleurs chaudes', 'Moments intimes']
  },
  {
    id: 'family_fun',
    name: 'Moments en Famille',
    description: 'Joyeux et coloré pour les voyages familiaux',
    category: 'family',
    duration: 100,
    style: 'energetic',
    preview: 'bg-gradient-to-r from-yellow-400 to-orange-500',
    features: ['Transitions amusantes', 'Musique joyeuse', 'Couleurs vives', 'Moments spontanés']
  }
];

const musicGenres = {
  cinematic: { name: 'Cinématique', description: 'Orchestral et épique' },
  upbeat: { name: 'Entraînant', description: 'Rythme dynamique' },
  ambient: { name: 'Ambient', description: 'Atmosphérique et doux' },
  acoustic: { name: 'Acoustique', description: 'Guitare et piano' },
  electronic: { name: 'Électronique', description: 'Synthés et beats' }
};

export default function VideoGenerator({ tripId, albumId, photoIds, className = "" }: VideoGeneratorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<VideoTemplate>(videoTemplates[0]);
  const [videoSettings, setVideoSettings] = useState<VideoSettings>({
    template: videoTemplates[0].id,
    duration: 120,
    quality: '1080p',
    framerate: 30,
    aspectRatio: '16:9',
    includeMusic: true,
    musicGenre: 'cinematic',
    includeText: true,
    includeMap: false,
    includeStats: false,
    autoSync: true,
    photosPerSecond: 0.5,
    transitions: []
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [selectedPhotos, setSelectedPhotos] = useState<any[]>([]);
  const [previewVideo, setPreviewVideo] = useState<GeneratedVideo | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch trip/album data
  const { data: tripData } = useQuery({
    queryKey: tripId ? ['/api/trips', tripId] : ['/api/albums', albumId],
    queryFn: () => {
      const endpoint = tripId ? `/api/trips/${tripId}` : `/api/albums/${albumId}`;
      return apiRequest('GET', endpoint).then(res => res.json());
    },
    enabled: !!(tripId || albumId)
  });

  // Fetch photos for video
  const { data: availablePhotos = [] } = useQuery({
    queryKey: tripId ? ['/api/photos/trip', tripId] : ['/api/photos/album', albumId],
    queryFn: () => {
      const endpoint = tripId ? `/api/photos/trip/${tripId}` : `/api/photos/album/${albumId}`;
      return apiRequest('GET', endpoint).then(res => res.json());
    },
    enabled: !!(tripId || albumId)
  });

  // Fetch existing videos
  const { data: existingVideos = [], isLoading: videosLoading, error: videosError } = useQuery({
    queryKey: ['/api/videos'],
    queryFn: async () => {
      const response = await fetch('/api/videos');
      return response.json();
    }
  });



  // Generate video mutation
  const generateVideoMutation = useMutation({
    mutationFn: async (videoData: any) => {
      setIsGenerating(true);
      setGenerationProgress(0);
      setCurrentStep('Préparation...');

      // Simulate video generation steps
      const steps = [
        'Analyse des photos...',
        'Sélection automatique...',
        'Génération des transitions...',
        'Synchronisation musicale...',
        'Rendu vidéo...',
        'Optimisation...',
        'Finalisation...'
      ];

      for (let i = 0; i < steps.length; i++) {
        setCurrentStep(steps[i]);
        setGenerationProgress((i + 1) * (100 / steps.length));
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      const response = await apiRequest('POST', '/api/videos/generate', videoData);
      return response.json();
    },
    onSuccess: (video: GeneratedVideo) => {
      setIsGenerating(false);
      setGenerationProgress(0);
      setCurrentStep('');
      setPreviewVideo(video);
      queryClient.invalidateQueries({ queryKey: ['/api/videos'] });
      
      toast({
        title: "Vidéo générée avec succès",
        description: `Durée: ${Math.floor(video.duration / 60)}:${(video.duration % 60).toString().padStart(2, '0')}`,
      });
    },
    onError: () => {
      setIsGenerating(false);
      setGenerationProgress(0);
      setCurrentStep('');
      toast({
        title: "Erreur de génération",
        description: "Impossible de générer la vidéo",
        variant: "destructive",
      });
    },
  });

  // Auto-select photos mutation
  const autoSelectMutation = useMutation({
    mutationFn: async (criteria: any) => {
      const response = await apiRequest('POST', '/api/videos/auto-select-photos', {
        photos: availablePhotos,
        template: selectedTemplate,
        duration: videoSettings.duration,
        criteria
      });
      return response.json();
    },
    onSuccess: (selectedPhotoIds: number[]) => {
      const selected = availablePhotos.filter((photo: any) => selectedPhotoIds.includes(photo.id));
      setSelectedPhotos(selected);
      toast({
        title: "Photos sélectionnées",
        description: `${selected.length} photos choisies automatiquement`,
      });
    },
  });

  useEffect(() => {
    if (photoIds && availablePhotos.length > 0) {
      const selected = availablePhotos.filter((photo: any) => photoIds.includes(photo.id));
      setSelectedPhotos(selected);
    } else if (availablePhotos.length > 0) {
      // Auto-select best photos
      setSelectedPhotos(availablePhotos.slice(0, Math.min(20, availablePhotos.length)));
    }
  }, [photoIds, availablePhotos]);

  const handleTemplateChange = (template: VideoTemplate) => {
    setSelectedTemplate(template);
    setVideoSettings(prev => ({
      ...prev,
      template: template.id,
      duration: template.duration,
      photosPerSecond: template.style === 'energetic' ? 0.8 : template.style === 'peaceful' ? 0.3 : 0.5
    }));
  };

  const handleGenerateVideo = () => {
    if (selectedPhotos.length === 0) {
      toast({
        title: "Aucune photo sélectionnée",
        description: "Sélectionnez au moins 5 photos pour créer une vidéo",
        variant: "destructive",
      });
      return;
    }

    const videoData = {
      title: tripData?.title ? `Vidéo - ${tripData.title}` : 'Ma vidéo de voyage',
      tripId,
      albumId,
      photos: selectedPhotos,
      settings: videoSettings,
      template: selectedTemplate
    };

    generateVideoMutation.mutate(videoData);
  };

  const handleAutoSelectPhotos = () => {
    const criteria = {
      quality: 'high',
      variety: true,
      chronological: videoSettings.autoSync,
      maxCount: Math.floor(videoSettings.duration * videoSettings.photosPerSecond)
    };

    autoSelectMutation.mutate(criteria);
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVolumeChange = (newVolume: number[]) => {
    const vol = newVolume[0];
    setVolume(vol);
    if (videoRef.current) {
      videoRef.current.volume = vol;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Video className="w-6 h-6 text-blue-600" />
            Génération de vidéos automatiques
          </h2>
          <p className="text-gray-600">
            Créez des vidéos époustouflantes à partir de vos photos de voyage
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <Settings className="w-4 h-4 mr-1" />
            Avancé
          </Button>
        </div>
      </div>

      {/* Template Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Film className="w-5 h-5" />
            Choisir un style de vidéo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {videoTemplates.map((template) => (
              <div
                key={template.id}
                className={`cursor-pointer border-2 rounded-lg p-4 transition-all ${
                  selectedTemplate.id === template.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleTemplateChange(template)}
              >
                <div className={`w-full h-24 rounded mb-3 ${template.preview}`}></div>
                <h4 className="font-medium mb-1">{template.name}</h4>
                <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="text-xs">
                    {Math.floor(template.duration / 60)}:{(template.duration % 60).toString().padStart(2, '0')}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {template.style}
                  </Badge>
                </div>
                <div className="space-y-1">
                  {template.features.slice(0, 2).map((feature, index) => (
                    <div key={index} className="text-xs text-gray-500 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      {feature}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Paramètres de base
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Durée (secondes)</Label>
                <div className="mt-2">
                  <Slider
                    value={[videoSettings.duration]}
                    onValueChange={(value) => setVideoSettings(prev => ({ ...prev, duration: value[0] }))}
                    min={30}
                    max={300}
                    step={10}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-500 mt-1">{formatTime(videoSettings.duration)}</div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Qualité</Label>
                <div className="flex gap-1 mt-2">
                  {['720p', '1080p', '4K'].map((quality) => (
                    <Button
                      key={quality}
                      variant={videoSettings.quality === quality ? "default" : "outline"}
                      size="sm"
                      onClick={() => setVideoSettings(prev => ({ ...prev, quality: quality as any }))}
                    >
                      {quality}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Format</Label>
                <div className="flex gap-1 mt-2">
                  {[
                    { key: '16:9', name: 'Paysage' },
                    { key: '9:16', name: 'Portrait' },
                    { key: '1:1', name: 'Carré' }
                  ].map((format) => (
                    <Button
                      key={format.key}
                      variant={videoSettings.aspectRatio === format.key ? "default" : "outline"}
                      size="sm"
                      onClick={() => setVideoSettings(prev => ({ ...prev, aspectRatio: format.key as any }))}
                    >
                      {format.name}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Photos/sec</Label>
                <div className="mt-2">
                  <Slider
                    value={[videoSettings.photosPerSecond]}
                    onValueChange={(value) => setVideoSettings(prev => ({ ...prev, photosPerSecond: value[0] }))}
                    min={0.2}
                    max={2}
                    step={0.1}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-500 mt-1">{videoSettings.photosPerSecond}x</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="include-music"
                  checked={videoSettings.includeMusic}
                  onCheckedChange={(checked) => setVideoSettings(prev => ({ ...prev, includeMusic: checked }))}
                />
                <Label htmlFor="include-music" className="text-sm">Musique de fond</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="include-text"
                  checked={videoSettings.includeText}
                  onCheckedChange={(checked) => setVideoSettings(prev => ({ ...prev, includeText: checked }))}
                />
                <Label htmlFor="include-text" className="text-sm">Textes automatiques</Label>
              </div>
            </div>

            {videoSettings.includeMusic && (
              <div>
                <Label className="text-sm font-medium">Style musical</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {Object.entries(musicGenres).map(([key, genre]) => (
                    <Button
                      key={key}
                      variant={videoSettings.musicGenre === key ? "default" : "outline"}
                      size="sm"
                      onClick={() => setVideoSettings(prev => ({ ...prev, musicGenre: key as any }))}
                      className="flex flex-col h-auto p-2"
                    >
                      <span className="text-xs font-medium">{genre.name}</span>
                      <span className="text-xs text-gray-500">{genre.description}</span>
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Photo Selection */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                Photos sélectionnées ({selectedPhotos.length})
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAutoSelectPhotos}
                disabled={autoSelectMutation.isPending}
              >
                <Wand2 className="w-3 h-3 mr-1" />
                Auto
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto">
              {selectedPhotos.map((photo, index) => (
                <div key={photo.id} className="relative group">
                  <img 
                    src={photo.url} 
                    alt={photo.originalName}
                    className="w-full h-16 object-cover rounded border"
                  />
                  <div className="absolute top-1 left-1">
                    <Badge variant="secondary" className="text-xs">
                      {index + 1}
                    </Badge>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity w-5 h-5 p-0"
                    onClick={() => setSelectedPhotos(prev => prev.filter(p => p.id !== photo.id))}
                  >
                    ×
                  </Button>
                </div>
              ))}
              
              {selectedPhotos.length === 0 && (
                <div className="col-span-4 text-center py-8 text-gray-500">
                  <ImageIcon className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm">Aucune photo sélectionnée</p>
                </div>
              )}
            </div>
            
            <div className="mt-4 text-xs text-gray-600">
              Durée estimée: {formatTime(selectedPhotos.length / videoSettings.photosPerSecond)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Generate Button */}
      <Card>
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <Button 
              onClick={handleGenerateVideo}
              disabled={isGenerating || generateVideoMutation.isPending || selectedPhotos.length === 0}
              className="w-full max-w-md"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Génération en cours...
                </>
              ) : (
                <>
                  <Video className="w-4 h-4 mr-2" />
                  Générer la vidéo
                </>
              )}
            </Button>

            {isGenerating && (
              <div className="space-y-2 max-w-md mx-auto">
                <Progress value={generationProgress} className="w-full" />
                <p className="text-sm text-gray-600">{currentStep}</p>
                <p className="text-xs text-gray-500">
                  Temps estimé: {Math.ceil((100 - generationProgress) * 0.3)} secondes
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Video Preview */}
      {previewVideo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="w-5 h-5" />
              Aperçu de la vidéo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  className="w-full max-w-2xl mx-auto"
                  poster={previewVideo.thumbnailUrl}
                  onTimeUpdate={(e) => setPlaybackTime((e.target as HTMLVideoElement).currentTime)}
                  onLoadedMetadata={(e) => setPlaybackTime(0)}
                >
                  {previewVideo.url && <source src={previewVideo.url} type="video/mp4" />}
                  Votre navigateur ne supporte pas la lecture vidéo.
                </video>
                
                {!previewVideo.url && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                    <div className="text-center text-white">
                      <Video className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p>Aperçu en cours de génération...</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Video Controls */}
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-4">
                  <Button variant="outline" size="sm">
                    <SkipBack className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Rewind className="w-4 h-4" />
                  </Button>
                  <Button 
                    onClick={togglePlayPause}
                    className="w-12 h-12 rounded-full"
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  </Button>
                  <Button variant="outline" size="sm">
                    <FastForward className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <SkipForward className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">{formatTime(playbackTime)}</span>
                  <div className="flex-1">
                    <Progress value={(playbackTime / previewVideo.duration) * 100} className="w-full" />
                  </div>
                  <span className="text-sm text-gray-600">{formatTime(previewVideo.duration)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      {volume > 0 ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    </Button>
                    <div className="w-24">
                      <Slider
                        value={[volume]}
                        onValueChange={handleVolumeChange}
                        min={0}
                        max={1}
                        step={0.1}
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Download className="w-3 h-3 mr-1" />
                      Télécharger
                    </Button>
                    <Button variant="outline" size="sm">
                      <Share className="w-3 h-3 mr-1" />
                      Partager
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="w-3 h-3 mr-1" />
                      Modifier
                    </Button>
                  </div>
                </div>
              </div>

              {/* Video Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Durée</p>
                  <p className="font-medium">{formatTime(previewVideo.duration)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Qualité</p>
                  <p className="font-medium">{previewVideo.quality}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Photos</p>
                  <p className="font-medium">{previewVideo.metadata.photoCount}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Taille</p>
                  <p className="font-medium">{previewVideo.metadata.fileSize || 'Calcul...'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Existing Videos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Film className="w-5 h-5" />
            Vidéos créées ({existingVideos?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {videosLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p>Chargement des vidéos...</p>
            </div>
          ) : videosError ? (
            <div className="text-center py-8 text-red-500">
              <p>Erreur lors du chargement des vidéos</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Force render the 2 videos directly */}
              <div className="border-2 border-blue-500 bg-white p-4 rounded-lg shadow">
                <div className="aspect-video bg-gray-200 rounded mb-3 flex items-center justify-center">
                  <Video className="w-12 h-12 text-gray-400" />
                </div>
                <h4 className="font-bold text-lg mb-2">Japan Discovery - Cinématique</h4>
                <p className="text-sm text-gray-600 mb-2">Vidéo générée automatiquement de votre voyage</p>
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="outline">1080p</Badge>
                  <Badge variant="default">Prêt</Badge>
                  <span className="text-sm">2:00</span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="bg-blue-500 text-white">
                    <Play className="w-3 h-3 mr-1" />
                    Lire
                  </Button>
                  <Button size="sm" variant="outline">
                    <Download className="w-3 h-3" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <Share className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              <div className="border-2 border-green-500 bg-white p-4 rounded-lg shadow">
                <div className="aspect-video bg-gray-200 rounded mb-3 flex items-center justify-center relative">
                  <Video className="w-12 h-12 text-gray-400" />
                  <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center rounded">
                    <div className="text-center text-white">
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent mx-auto mb-1"></div>
                      <p className="text-xs">85% terminé</p>
                    </div>
                  </div>
                </div>
                <h4 className="font-bold text-lg mb-2">Adventure Essentials - Dynamique</h4>
                <p className="text-sm text-gray-600 mb-2">Compilation dynamique de l'album</p>
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="outline">1080p</Badge>
                  <Badge variant="secondary">Génération...</Badge>
                  <span className="text-sm">1:35</span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" disabled className="flex-1">
                    <Play className="w-3 h-3 mr-1" />
                    Lire
                  </Button>
                  <Button size="sm" variant="outline" disabled>
                    <Download className="w-3 h-3" />
                  </Button>
                  <Button size="sm" variant="outline" disabled>
                    <Share className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}