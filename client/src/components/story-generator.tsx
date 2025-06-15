import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  BookOpen, 
  Sparkles, 
  RefreshCw,
  Download,
  Share,
  Eye,
  Calendar,
  MapPin,
  Camera,
  Users,
  Heart,
  Clock,
  Edit3,
  Save,
  Wand2,
  FileText,
  Copy,
  CheckCircle
} from "lucide-react";

interface StoryGeneratorProps {
  tripId?: number;
  albumId?: number;
  className?: string;
}

interface TravelStory {
  id: string;
  title: string;
  content: string;
  style: 'narrative' | 'diary' | 'blog' | 'social' | 'formal';
  mood: 'adventurous' | 'romantic' | 'peaceful' | 'exciting' | 'nostalgic';
  length: 'short' | 'medium' | 'long';
  includePhotos: boolean;
  includeMap: boolean;
  includeStats: boolean;
  generatedAt: string;
  wordCount: number;
  readingTime: number;
  highlights: string[];
  photos: Array<{
    id: number;
    url: string;
    caption: string;
    location?: string;
  }>;
}

interface StorySettings {
  style: 'narrative' | 'diary' | 'blog' | 'social' | 'formal';
  mood: 'adventurous' | 'romantic' | 'peaceful' | 'exciting' | 'nostalgic';
  length: 'short' | 'medium' | 'long';
  includePhotos: boolean;
  includeMap: boolean;
  includeStats: boolean;
  focusPoints: string[];
  personalTouch: boolean;
  language: 'french' | 'english';
}

const storyStyles = {
  narrative: {
    name: "Récit narratif",
    description: "Histoire fluide et engageante",
    icon: BookOpen,
    color: "bg-blue-100 text-blue-800"
  },
  diary: {
    name: "Journal intime",
    description: "Style personnel et authentique",
    icon: Edit3,
    color: "bg-purple-100 text-purple-800"
  },
  blog: {
    name: "Article de blog",
    description: "Format informatif et structuré",
    icon: FileText,
    color: "bg-green-100 text-green-800"
  },
  social: {
    name: "Post réseaux sociaux",
    description: "Court et accrocheur",
    icon: Share,
    color: "bg-pink-100 text-pink-800"
  },
  formal: {
    name: "Rapport de voyage",
    description: "Style professionnel et détaillé",
    icon: Calendar,
    color: "bg-gray-100 text-gray-800"
  }
};

const storyMoods = {
  adventurous: { name: "Aventurier", emoji: "🏔️" },
  romantic: { name: "Romantique", emoji: "💕" },
  peaceful: { name: "Paisible", emoji: "🌸" },
  exciting: { name: "Excitant", emoji: "⚡" },
  nostalgic: { name: "Nostalgique", emoji: "🌅" }
};

export default function StoryGenerator({ tripId, albumId, className = "" }: StoryGeneratorProps) {
  const [settings, setSettings] = useState<StorySettings>({
    style: 'narrative',
    mood: 'adventurous',
    length: 'medium',
    includePhotos: true,
    includeMap: false,
    includeStats: false,
    focusPoints: [],
    personalTouch: true,
    language: 'french'
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
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

  // Fetch related photos
  const { data: photos = [] } = useQuery({
    queryKey: tripId ? ['/api/photos/trip', tripId] : ['/api/photos/album', albumId],
    queryFn: () => {
      const endpoint = tripId ? `/api/photos/trip/${tripId}` : `/api/photos/album/${albumId}`;
      return apiRequest('GET', endpoint).then(res => res.json());
    },
    enabled: !!(tripId || albumId)
  });

  // Fetch existing stories
  const { data: existingStories = [] } = useQuery({
    queryKey: ['/api/stories', tripId || albumId],
    queryFn: () => {
      const params = tripId ? `tripId=${tripId}` : `albumId=${albumId}`;
      return apiRequest('GET', `/api/stories?${params}`).then(res => res.json());
    },
    enabled: !!(tripId || albumId)
  });

  // Generate story mutation
  const generateStoryMutation = useMutation({
    mutationFn: async () => {
      setIsGenerating(true);
      setGenerationProgress(0);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 15;
        });
      }, 800);

      const response = await apiRequest('POST', '/api/stories/generate', {
        tripId,
        albumId,
        settings,
        customPrompt,
        photos: photos.slice(0, 10), // Limit photos for performance
        tripData
      });

      clearInterval(progressInterval);
      setGenerationProgress(100);

      return response.json();
    },
    onSuccess: (story: TravelStory) => {
      setIsGenerating(false);
      setGenerationProgress(0);
      setEditedContent(story.content);
      queryClient.invalidateQueries({ queryKey: ['/api/stories'] });
      
      toast({
        title: "Récit généré avec succès",
        description: `${story.wordCount} mots - ${story.readingTime} min de lecture`,
      });
    },
    onError: () => {
      setIsGenerating(false);
      setGenerationProgress(0);
      toast({
        title: "Erreur de génération",
        description: "Impossible de générer le récit",
        variant: "destructive",
      });
    },
  });

  // Save story mutation
  const saveStoryMutation = useMutation({
    mutationFn: async (storyData: Partial<TravelStory>) => {
      const response = await apiRequest('POST', '/api/stories', {
        ...storyData,
        tripId,
        albumId,
        settings
      });
      return response.json();
    },
    onSuccess: () => {
      setEditMode(false);
      queryClient.invalidateQueries({ queryKey: ['/api/stories'] });
      toast({
        title: "Récit sauvegardé",
        description: "Votre histoire a été enregistrée",
      });
    },
  });

  const updateSettings = (key: keyof StorySettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleGenerateStory = () => {
    if (!tripData && !photos.length) {
      toast({
        title: "Données insuffisantes",
        description: "Ajoutez des photos ou des informations de voyage",
        variant: "destructive",
      });
      return;
    }
    generateStoryMutation.mutate();
  };

  const handleSaveStory = () => {
    if (!editedContent.trim()) {
      toast({
        title: "Contenu vide",
        description: "Ajoutez du contenu avant de sauvegarder",
        variant: "destructive",
      });
      return;
    }

    const wordCount = editedContent.split(' ').length;
    const readingTime = Math.ceil(wordCount / 200);

    saveStoryMutation.mutate({
      id: `story-${Date.now()}`,
      title: tripData?.title || `Récit de voyage`,
      content: editedContent,
      style: settings.style,
      mood: settings.mood,
      length: settings.length,
      includePhotos: settings.includePhotos,
      includeMap: settings.includeMap,
      includeStats: settings.includeStats,
      wordCount,
      readingTime,
      highlights: [],
      photos: settings.includePhotos ? photos.slice(0, 5).map((photo: any) => ({
        id: photo.id,
        url: photo.url,
        caption: photo.caption || '',
        location: photo.location
      })) : [],
      generatedAt: new Date().toISOString()
    });
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(editedContent);
    toast({
      title: "Copié",
      description: "Le récit a été copié dans le presse-papiers",
    });
  };

  const latestStory = existingStories[0];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-purple-600" />
            Génération de récits
          </h2>
          <p className="text-gray-600">
            Transformez vos souvenirs en histoires captivantes
          </p>
        </div>
        {tripData && (
          <Badge variant="outline" className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {tripData.title}
          </Badge>
        )}
      </div>

      {/* Settings Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="w-5 h-5" />
            Paramètres du récit
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Style Selection */}
          <div>
            <Label className="text-sm font-medium">Style de récit</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mt-2">
              {Object.entries(storyStyles).map(([key, style]) => {
                const IconComponent = style.icon;
                return (
                  <Button
                    key={key}
                    variant={settings.style === key ? "default" : "outline"}
                    onClick={() => updateSettings('style', key)}
                    className="h-auto p-3 flex flex-col items-center gap-2"
                  >
                    <IconComponent className="w-4 h-4" />
                    <div className="text-center">
                      <div className="text-xs font-medium">{style.name}</div>
                      <div className="text-xs text-gray-500">{style.description}</div>
                    </div>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Mood and Length */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="text-sm font-medium">Ambiance</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {Object.entries(storyMoods).map(([key, mood]) => (
                  <Button
                    key={key}
                    variant={settings.mood === key ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateSettings('mood', key)}
                    className="flex items-center gap-1"
                  >
                    <span>{mood.emoji}</span>
                    {mood.name}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Longueur</Label>
              <div className="flex gap-2 mt-2">
                {[
                  { key: 'short', name: 'Court', desc: '~200 mots' },
                  { key: 'medium', name: 'Moyen', desc: '~500 mots' },
                  { key: 'long', name: 'Long', desc: '~1000 mots' }
                ].map((length) => (
                  <Button
                    key={length.key}
                    variant={settings.length === length.key ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateSettings('length', length.key)}
                    className="flex flex-col"
                  >
                    <span className="text-xs font-medium">{length.name}</span>
                    <span className="text-xs text-gray-500">{length.desc}</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="include-photos"
                checked={settings.includePhotos}
                onCheckedChange={(checked) => updateSettings('includePhotos', checked)}
              />
              <Label htmlFor="include-photos" className="text-sm">Inclure photos</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="include-map"
                checked={settings.includeMap}
                onCheckedChange={(checked) => updateSettings('includeMap', checked)}
              />
              <Label htmlFor="include-map" className="text-sm">Inclure carte</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="personal-touch"
                checked={settings.personalTouch}
                onCheckedChange={(checked) => updateSettings('personalTouch', checked)}
              />
              <Label htmlFor="personal-touch" className="text-sm">Touche personnelle</Label>
            </div>
          </div>

          {/* Custom Prompt */}
          <div>
            <Label htmlFor="custom-prompt" className="text-sm font-medium">
              Instructions personnalisées (optionnel)
            </Label>
            <Textarea
              id="custom-prompt"
              placeholder="Ajoutez des détails spécifiques ou des instructions pour personnaliser votre récit..."
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              className="mt-2"
              rows={3}
            />
          </div>

          {/* Generate Button */}
          <Button 
            onClick={handleGenerateStory}
            disabled={isGenerating || generateStoryMutation.isPending}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Génération en cours...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Générer le récit
              </>
            )}
          </Button>

          {/* Generation Progress */}
          {isGenerating && (
            <div className="space-y-2">
              <Progress value={generationProgress} className="w-full" />
              <p className="text-xs text-center text-gray-600">
                {generationProgress < 30 && "Analyse des photos et données..."}
                {generationProgress >= 30 && generationProgress < 60 && "Génération du contenu..."}
                {generationProgress >= 60 && generationProgress < 90 && "Structuration du récit..."}
                {generationProgress >= 90 && "Finalisation..."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generated/Edited Story */}
      {editedContent && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Votre récit de voyage
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditMode(!editMode)}
                >
                  <Edit3 className="w-3 h-3 mr-1" />
                  {editMode ? 'Aperçu' : 'Modifier'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyToClipboard}
                >
                  <Copy className="w-3 h-3 mr-1" />
                  Copier
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <FileText className="w-3 h-3" />
                {editedContent.split(' ').length} mots
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {Math.ceil(editedContent.split(' ').length / 200)} min lecture
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {editMode ? (
              <div className="space-y-4">
                <Textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="min-h-[300px]"
                  placeholder="Modifiez votre récit ici..."
                />
                <div className="flex gap-2">
                  <Button 
                    onClick={handleSaveStory}
                    disabled={saveStoryMutation.isPending}
                  >
                    <Save className="w-3 h-3 mr-1" />
                    Sauvegarder
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setEditMode(false)}
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            ) : (
              <div className="prose max-w-none">
                <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                  {editedContent}
                </div>
                {settings.includePhotos && photos.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6 pt-6 border-t">
                    {photos.slice(0, 6).map((photo: any) => (
                      <div key={photo.id} className="space-y-2">
                        <img 
                          src={photo.url} 
                          alt={photo.caption || photo.originalName}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        {photo.caption && (
                          <p className="text-xs text-gray-600">{photo.caption}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Existing Stories */}
      {existingStories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Récits sauvegardés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {existingStories.map((story: TravelStory) => (
                <div key={story.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{story.title}</h4>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                      <span className="flex items-center gap-1">
                        <Badge variant="secondary" className={storyStyles[story.style].color}>
                          {storyStyles[story.style].name}
                        </Badge>
                      </span>
                      <span>{story.wordCount} mots</span>
                      <span>{story.readingTime} min</span>
                      <span>{new Date(story.generatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditedContent(story.content)}
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      Voir
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigator.clipboard.writeText(story.content)}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}