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
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<GeneratedVideo | null>(null);
  const [playbackInterval, setPlaybackInterval] = useState<NodeJS.Timeout | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [videoPhotos, setVideoPhotos] = useState<any[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Handle keyboard events for video player
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (showVideoPlayer && event.key === 'Escape') {
        if (playbackInterval) {
          clearInterval(playbackInterval);
          setPlaybackInterval(null);
        }
        setShowVideoPlayer(false);
        setSelectedVideo(null);
        setIsPlaying(false);
        setPlaybackTime(0);
      }
    };

    if (showVideoPlayer) {
      document.addEventListener('keydown', handleKeyPress);
      return () => document.removeEventListener('keydown', handleKeyPress);
    }
  }, [showVideoPlayer, playbackInterval]);
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
  const { data: existingVideos, isLoading: videosLoading, error: videosError } = useQuery({
    queryKey: ['/api/videos']
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
            Vidéos créées ({Array.isArray(existingVideos) ? existingVideos.length : 0})
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
          ) : !existingVideos || !Array.isArray(existingVideos) ? (
            <div className="text-center py-8 text-yellow-600">
              <p>Données vidéo non disponibles</p>
            </div>
          ) : existingVideos.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Video className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune vidéo créée</h3>
              <p className="text-gray-600 mb-4">Commencez par créer votre première vidéo avec vos photos de voyage</p>
              <Button 
                variant="outline" 
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              >
                Créer une vidéo
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {existingVideos.map((video: any) => (
                <div key={video.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow bg-white">
                  <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg mb-4 flex items-center justify-center relative overflow-hidden">
                    {video.thumbnailUrl ? (
                      <img 
                        src={video.thumbnailUrl} 
                        alt={video.title}
                        className="w-full h-full object-cover rounded-lg"
                        onError={(e) => {
                          console.log("Image failed to load:", video.thumbnailUrl);
                          e.currentTarget.style.display = 'none';
                        }}
                        onLoad={() => console.log("Image loaded:", video.thumbnailUrl)}
                      />
                    ) : null}
                    
                    {/* Fallback content when image fails or doesn't exist */}
                    {!video.thumbnailUrl && (
                      <div className="text-center">
                        <Video className="w-16 h-16 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Aperçu vidéo</p>
                      </div>
                    )}
                    
                    {/* Progress overlay for generating videos */}
                    {video.status === 'generating' && (
                      <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 rounded px-2 py-1">
                        <div className="flex items-center text-white text-xs">
                          <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent mr-1"></div>
                          <span>{video.progress}%</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold text-lg text-gray-900 mb-1">{video.title}</h4>
                      {video.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">{video.description}</p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>{formatTime(video.duration)}</span>
                      <Badge variant="outline" className="text-xs">
                        {video.quality}
                      </Badge>
                      <Badge 
                        variant={video.status === 'ready' ? 'default' : video.status === 'generating' ? 'secondary' : 'destructive'}
                        className="text-xs"
                      >
                        {video.status === 'ready' ? 'Prêt' : video.status === 'generating' ? 'Génération...' : 'Erreur'}
                      </Badge>
                    </div>
                    
                    {video.metadata && (
                      <div className="text-xs text-gray-500 space-y-1">
                        <div className="flex justify-between">
                          <span>{video.metadata.photoCount} photos</span>
                          <span>{video.metadata.fileSize}</span>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex gap-2 pt-2">
                      <Button 
                        size="sm" 
                        disabled={video.status !== 'ready'}
                        className="flex-1"
                        onClick={async () => {
                          setSelectedVideo(video);
                          setShowVideoPlayer(true);
                          
                          // Load photos for this video
                          try {
                            const response = await apiRequest('GET', `/api/videos/${video.id}/photos`);
                            const photos = await response.json();
                            setVideoPhotos(photos);
                            setCurrentPhotoIndex(0);
                            setPlaybackTime(0);
                          } catch (error) {
                            console.error('Error loading video photos:', error);
                            setVideoPhotos([]);
                          }
                        }}
                      >
                        <Play className="w-3 h-3 mr-1" />
                        Lire
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        disabled={video.status !== 'ready'}
                      >
                        <Download className="w-3 h-3" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        disabled={video.status !== 'ready'}
                      >
                        <Share className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Video Player Modal */}
      {showVideoPlayer && selectedVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50">
          <div className="relative w-full max-w-5xl mx-4">
            {/* Enhanced Close button */}
            <button
              onClick={() => {
                // Clear any active playback interval
                if (playbackInterval) {
                  clearInterval(playbackInterval);
                  setPlaybackInterval(null);
                }
                setShowVideoPlayer(false);
                setSelectedVideo(null);
                setIsPlaying(false);
                setPlaybackTime(0);
              }}
              className="absolute -top-16 right-0 text-white hover:text-gray-300 z-20 group"
            >
              <div className="flex items-center gap-3 bg-black bg-opacity-50 rounded-full px-4 py-2 hover:bg-opacity-70 transition-all">
                <span className="text-sm font-medium">Fermer (ESC)</span>
                <div className="w-8 h-8 rounded-full bg-white bg-opacity-30 flex items-center justify-center group-hover:bg-opacity-50 transition-all">
                  <span className="text-lg font-bold">×</span>
                </div>
              </div>
            </button>

            {/* Additional close overlay - click outside to close */}
            <div 
              className="absolute inset-0 -z-10"
              onClick={() => {
                if (playbackInterval) {
                  clearInterval(playbackInterval);
                  setPlaybackInterval(null);
                }
                setShowVideoPlayer(false);
                setSelectedVideo(null);
                setIsPlaying(false);
                setPlaybackTime(0);
              }}
            />

            {/* Video player container */}
            <div className="bg-black rounded-lg overflow-hidden">
              <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center relative">
                {/* Video slideshow with actual photos */}
                <div className="absolute inset-0">
                  {videoPhotos.length > 0 && videoPhotos[currentPhotoIndex] ? (
                    <div className="relative w-full h-full">
                      <img 
                        src={videoPhotos[currentPhotoIndex].url} 
                        alt={videoPhotos[currentPhotoIndex].caption}
                        className="w-full h-full object-cover transition-opacity duration-1000"
                      />
                      {/* Photo caption overlay */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                        <p className="text-white text-sm font-medium">
                          {videoPhotos[currentPhotoIndex].caption}
                        </p>
                        {videoPhotos[currentPhotoIndex].location && (
                          <p className="text-gray-300 text-xs mt-1 flex items-center">
                            <MapPin className="w-3 h-3 mr-1" />
                            {videoPhotos[currentPhotoIndex].location}
                          </p>
                        )}
                      </div>
                      {/* Photo counter */}
                      <div className="absolute top-4 right-4 bg-black bg-opacity-50 rounded-full px-3 py-1">
                        <span className="text-white text-xs">
                          {currentPhotoIndex + 1} / {videoPhotos.length}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <img 
                        src={selectedVideo.thumbnailUrl} 
                        alt={selectedVideo.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  {/* Play/Pause overlay when not playing */}
                  {!isPlaying && (
                    <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                      <div className="text-center text-white">
                        <div className="w-16 h-16 rounded-full bg-white bg-opacity-20 flex items-center justify-center mb-4 mx-auto">
                          <Play className="w-8 h-8 ml-1" />
                        </div>
                        <p className="text-sm opacity-75">
                          {videoPhotos.length > 0 ? `${videoPhotos.length} photos` : 'Aperçu de la vidéo'}
                        </p>
                        <p className="text-xs opacity-50 mt-1">Durée : {selectedVideo.duration}s • {selectedVideo.quality}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Video controls */}
              <div className="bg-gray-900 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-semibold">{selectedVideo.title}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Badge variant="secondary">{selectedVideo.template.replace('_', ' ')}</Badge>
                    <span>{selectedVideo.metadata.photoCount} photos</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mb-3">
                  <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${(playbackTime / selectedVideo.duration) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>{Math.floor(playbackTime / 60)}:{(playbackTime % 60).toString().padStart(2, '0')}</span>
                    <span>{Math.floor(selectedVideo.duration / 60)}:{(selectedVideo.duration % 60).toString().padStart(2, '0')}</span>
                  </div>
                </div>

                {/* Control buttons */}
                <div className="flex items-center justify-center gap-4">
                  <Button variant="ghost" size="sm" className="text-white hover:text-gray-300">
                    <SkipBack className="w-4 h-4" />
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    size="lg"
                    className="text-white hover:text-gray-300 w-12 h-12 rounded-full"
                    onClick={() => {
                      const newIsPlaying = !isPlaying;
                      setIsPlaying(newIsPlaying);
                      
                      if (newIsPlaying) {
                        // Start playback simulation
                        const interval = setInterval(() => {
                          setPlaybackTime(prevTime => {
                            const newTime = prevTime + 1;
                            if (newTime >= selectedVideo!.duration) {
                              clearInterval(interval);
                              setIsPlaying(false);
                              setPlaybackTime(0);
                              setCurrentPhotoIndex(0);
                              return 0;
                            }
                            
                            // Change photo every 8 seconds for cinematic effect
                            if (videoPhotos.length > 0 && newTime % 8 === 0) {
                              setCurrentPhotoIndex(prevIndex => 
                                (prevIndex + 1) % videoPhotos.length
                              );
                            }
                            
                            return newTime;
                          });
                        }, 1000);
                        setPlaybackInterval(interval);
                        
                        toast({
                          description: "Aperçu de la vidéo générée",
                          duration: 2000,
                        });
                      } else {
                        // Pause playback
                        if (playbackInterval) {
                          clearInterval(playbackInterval);
                          setPlaybackInterval(null);
                        }
                        toast({
                          description: "Vidéo mise en pause",
                          duration: 2000,
                        });
                      }
                    }}
                  >
                    {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
                  </Button>
                  
                  <Button variant="ghost" size="sm" className="text-white hover:text-gray-300">
                    <SkipForward className="w-4 h-4" />
                  </Button>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Button variant="ghost" size="sm" className="text-white hover:text-gray-300">
                      {volume > 0 ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    </Button>
                    <div className="w-20">
                      <Slider
                        value={[volume * 100]}
                        onValueChange={(value) => setVolume(value[0] / 100)}
                        max={100}
                        step={1}
                        className="text-white"
                      />
                    </div>
                  </div>

                  {/* Close button in controls */}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-white hover:text-red-400 ml-6 border border-white/30"
                    onClick={() => {
                      if (playbackInterval) {
                        clearInterval(playbackInterval);
                        setPlaybackInterval(null);
                      }
                      setShowVideoPlayer(false);
                      setSelectedVideo(null);
                      setIsPlaying(false);
                      setPlaybackTime(0);
                    }}
                  >
                    <span className="text-xs mr-1">Fermer</span>
                    <span className="text-lg">×</span>
                  </Button>
                </div>

                {/* Video metadata */}
                <div className="mt-4 pt-3 border-t border-gray-700">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-gray-400">Qualité</div>
                      <div className="text-white font-medium">{selectedVideo.quality}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-400">Format</div>
                      <div className="text-white font-medium">{selectedVideo.aspectRatio}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-400">Transitions</div>
                      <div className="text-white font-medium">{selectedVideo.metadata.transitionCount}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-400">Musique</div>
                      <div className="text-white font-medium">{selectedVideo.metadata.musicTrack || 'Aucune'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}