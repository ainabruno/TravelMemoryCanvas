import React, { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Shield, 
  Eye, 
  EyeOff, 
  Scan, 
  Settings, 
  Download, 
  Upload, 
  AlertTriangle, 
  CheckCircle, 
  X,
  Play,
  Pause,
  RotateCcw,
  Zap,
  Lock,
  Globe,
  Users,
  Baby,
  UserCheck,
  FileImage,
  Palette,
  Sliders,
  Target,
  Activity,
  BarChart3,
  Info,
  Filter,
  Sparkles,
  Brain,
  Database,
  Clock,
  Star,
  Heart,
  Share2
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface DetectedPerson {
  id: string;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  confidence: number;
  isChild: boolean;
  estimatedAge?: number;
  faceVisible: boolean;
  bodyParts: {
    face?: { x: number; y: number; width: number; height: number };
    torso?: { x: number; y: number; width: number; height: number };
    hands?: Array<{ x: number; y: number; width: number; height: number }>;
  };
  identificationRisk: 'low' | 'medium' | 'high';
  suggestedAnonymization: string[];
}

interface AnonymizationSettings {
  mode: 'face_only' | 'partial' | 'full' | 'smart';
  blurIntensity: number;
  pixelationLevel?: number;
  useEmojiOverlay?: boolean;
  preserveArtistic?: boolean;
  childProtection: boolean;
  whitelistedFaces?: string[];
  customMasks?: {
    type: 'blur' | 'pixelate' | 'emoji' | 'solid' | 'artistic';
    color?: string;
    pattern?: string;
  };
}

interface AnonymizationResult {
  processedImageUrl: string;
  originalImageUrl: string;
  detectedPersons: DetectedPerson[];
  anonymizationApplied: {
    method: string;
    areas: Array<{
      x: number;
      y: number;
      width: number;
      height: number;
      type: string;
    }>;
  };
  processingTime: number;
  qualityScore: number;
  privacyScore: number;
  metadata: {
    totalPersons: number;
    childrenDetected: number;
    facesAnonymized: number;
    bodiesAnonymized: number;
  };
}

interface PrivacyPolicy {
  id: string;
  name: string;
  description: string;
  rules: {
    anonymizeChildren: boolean;
    anonymizeAdults: boolean;
    minimumBlurLevel: number;
    allowFaceRecognition: boolean;
    retainOriginal: boolean;
    shareWithThirdParties: boolean;
  };
  compliance: string[];
}

export default function IntelligentAnonymization() {
  const [activeTab, setActiveTab] = useState("upload");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [detectedPersons, setDetectedPersons] = useState<DetectedPerson[]>([]);
  const [anonymizationSettings, setAnonymizationSettings] = useState<AnonymizationSettings>({
    mode: 'smart',
    blurIntensity: 7,
    childProtection: true,
    customMasks: { type: 'blur' }
  });
  const [selectedPrivacyPolicy, setSelectedPrivacyPolicy] = useState<string>('standard');
  const [showPreview, setShowPreview] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Fetch privacy policies
  const { data: privacyPolicies } = useQuery<PrivacyPolicy[]>({
    queryKey: ["/api/anonymization/policies"],
  });

  // Detect persons mutation
  const detectPersonsMutation = useMutation({
    mutationFn: async (imageUrl: string) => {
      return await apiRequest("/api/anonymization/detect", "POST", { imageUrl });
    },
    onSuccess: (data: any) => {
      setDetectedPersons(data.persons || []);
      toast({
        title: "Détection terminée",
        description: `${data.persons?.length || 0} personne(s) détectée(s)`,
      });
    },
  });

  // Apply anonymization mutation
  const anonymizeMutation = useMutation<AnonymizationResult, Error, { imageUrl: string; settings: AnonymizationSettings }>({
    mutationFn: async ({ imageUrl, settings }: { imageUrl: string; settings: AnonymizationSettings }) => {
      return await apiRequest("/api/anonymization/apply", "POST", { 
        imageUrl, 
        detectedPersons, 
        settings 
      }) as Promise<AnonymizationResult>;
    },
    onSuccess: (data: AnonymizationResult) => {
      setProcessingProgress(100);
      toast({
        title: "Anonymisation terminée",
        description: `Score de confidentialité: ${Math.round(data.privacyScore * 100)}%`,
      });
    },
  });

  // Get suggested settings mutation
  const suggestSettingsMutation = useMutation({
    mutationFn: async (context: string) => {
      return await apiRequest("/api/anonymization/suggest", "POST", { 
        imageUrl: selectedImage,
        detectedPersons, 
        sharingContext: context 
      });
    },
    onSuccess: (data: any) => {
      setAnonymizationSettings(data as AnonymizationSettings);
      toast({
        title: "Paramètres optimisés",
        description: "Les paramètres ont été ajustés automatiquement",
      });
    },
  });

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        setSelectedImage(imageUrl);
        setSelectedImageFile(file);
        setDetectedPersons([]);
        setProcessingProgress(0);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDetectPersons = () => {
    if (!selectedImage) return;
    detectPersonsMutation.mutate(selectedImage);
  };

  const handleApplyAnonymization = () => {
    if (!selectedImage) return;
    setProcessingProgress(0);
    
    // Simulate processing progress
    const interval = setInterval(() => {
      setProcessingProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return prev;
        }
        return prev + 10;
      });
    }, 500);

    anonymizeMutation.mutate({
      imageUrl: selectedImage,
      settings: anonymizationSettings
    });
  };

  const handleSuggestSettings = (context: string) => {
    if (!selectedImage || detectedPersons.length === 0) return;
    suggestSettingsMutation.mutate(context);
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-orange-600 bg-orange-100';
      case 'high': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'face_only': return <Eye className="w-4 h-4" />;
      case 'partial': return <Sliders className="w-4 h-4" />;
      case 'full': return <EyeOff className="w-4 h-4" />;
      case 'smart': return <Brain className="w-4 h-4" />;
      default: return <Shield className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-8 h-8 text-blue-600" />
            Anonymisation Intelligente
          </h1>
          <p className="text-gray-600 mt-1">
            Protection automatique de l'identité avec IA avancée
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            IA GPT-4 Vision
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <Lock className="w-3 h-3" />
            RGPD Conforme
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="upload">Télécharger</TabsTrigger>
          <TabsTrigger value="detect">Détecter</TabsTrigger>
          <TabsTrigger value="configure">Configurer</TabsTrigger>
          <TabsTrigger value="process">Traiter</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Téléchargement d'Image
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <FileImage className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-semibold text-gray-700 mb-2">
                  Glissez une image ici ou cliquez pour sélectionner
                </p>
                <p className="text-sm text-gray-500">
                  Formats supportés: JPG, PNG, WebP (max 10MB)
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>

              {selectedImage && (
                <div className="space-y-4">
                  <div className="relative">
                    <img 
                      src={selectedImage} 
                      alt="Image sélectionnée" 
                      className="max-w-full h-auto rounded-lg border shadow-sm"
                      style={{ maxHeight: '400px' }}
                    />
                    {detectedPersons.length > 0 && (
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-blue-600 text-white">
                          {detectedPersons.length} personne(s) détectée(s)
                        </Badge>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Button 
                      onClick={handleDetectPersons}
                      disabled={detectPersonsMutation.isPending}
                      className="flex items-center gap-2"
                    >
                      <Scan className="w-4 h-4" />
                      {detectPersonsMutation.isPending ? "Analyse en cours..." : "Détecter les personnes"}
                    </Button>
                    
                    <Button 
                      variant="outline"
                      onClick={() => setActiveTab("detect")}
                      disabled={detectedPersons.length === 0}
                    >
                      Suivant
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="detect" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Personnes Détectées
              </CardTitle>
            </CardHeader>
            <CardContent>
              {detectedPersons.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {detectedPersons.map((person, index) => (
                      <Card key={person.id} className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-semibold text-blue-600">
                                {index + 1}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium">Personne {index + 1}</p>
                              <p className="text-xs text-gray-500">
                                Confiance: {Math.round(person.confidence * 100)}%
                              </p>
                            </div>
                          </div>
                          <Badge className={getRiskColor(person.identificationRisk)}>
                            {person.identificationRisk}
                          </Badge>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-between">
                            <span>Enfant:</span>
                            <Badge variant={person.isChild ? "destructive" : "secondary"}>
                              {person.isChild ? "Oui" : "Non"}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Visage visible:</span>
                            <Badge variant={person.faceVisible ? "destructive" : "secondary"}>
                              {person.faceVisible ? "Oui" : "Non"}
                            </Badge>
                          </div>
                          {person.estimatedAge && (
                            <div className="flex items-center justify-between">
                              <span>Âge estimé:</span>
                              <span className="font-medium">{person.estimatedAge} ans</span>
                            </div>
                          )}
                        </div>

                        <div className="mt-3">
                          <p className="text-xs text-gray-600 mb-1">Suggestions:</p>
                          <div className="flex flex-wrap gap-1">
                            {person.suggestedAnonymization.map((suggestion, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {suggestion}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-4">
                      <div className="text-sm text-gray-600">
                        Total: {detectedPersons.length} personne(s)
                      </div>
                      <div className="text-sm text-gray-600">
                        Enfants: {detectedPersons.filter(p => p.isChild).length}
                      </div>
                      <div className="text-sm text-gray-600">
                        Risque élevé: {detectedPersons.filter(p => p.identificationRisk === 'high').length}
                      </div>
                    </div>
                    <Button onClick={() => setActiveTab("configure")}>
                      Configurer l'anonymisation
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Scan className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Aucune personne détectée
                  </h3>
                  <p className="text-gray-600">
                    Téléchargez une image et lancez la détection pour continuer.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="configure" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Configuration Rapide
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Label>Contexte de partage</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'private', label: 'Privé', icon: Lock },
                      { id: 'family', label: 'Famille', icon: Heart },
                      { id: 'friends', label: 'Amis', icon: Users },
                      { id: 'public', label: 'Public', icon: Globe }
                    ].map(({ id, label, icon: Icon }) => (
                      <Button
                        key={id}
                        variant="outline"
                        className="flex items-center gap-2 justify-start h-auto p-3"
                        onClick={() => handleSuggestSettings(id)}
                        disabled={suggestSettingsMutation.isPending}
                      >
                        <Icon className="w-4 h-4" />
                        <div className="text-left">
                          <div className="font-medium">{label}</div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Politique de confidentialité</Label>
                  <Select value={selectedPrivacyPolicy} onValueChange={setSelectedPrivacyPolicy}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {privacyPolicies?.map((policy) => (
                        <SelectItem key={policy.id} value={policy.id}>
                          <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4" />
                            <div>
                              <div className="font-medium">{policy.name}</div>
                              <div className="text-xs text-gray-500">{policy.description}</div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Advanced Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Paramètres Avancés
                  </div>
                  <Switch 
                    checked={showAdvancedSettings}
                    onCheckedChange={setShowAdvancedSettings}
                  />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    {getModeIcon(anonymizationSettings.mode)}
                    Mode d'anonymisation
                  </Label>
                  <Select 
                    value={anonymizationSettings.mode} 
                    onValueChange={(value) => setAnonymizationSettings(prev => ({ 
                      ...prev, 
                      mode: value as any 
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="face_only">Visages uniquement</SelectItem>
                      <SelectItem value="partial">Partiel</SelectItem>
                      <SelectItem value="full">Complet</SelectItem>
                      <SelectItem value="smart">Intelligent (recommandé)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label>Intensité du flou: {anonymizationSettings.blurIntensity}</Label>
                  <Slider
                    value={[anonymizationSettings.blurIntensity]}
                    onValueChange={([value]) => setAnonymizationSettings(prev => ({ 
                      ...prev, 
                      blurIntensity: value 
                    }))}
                    min={1}
                    max={10}
                    step={1}
                    className="w-full"
                  />
                </div>

                {showAdvancedSettings && (
                  <>
                    <div className="space-y-3">
                      <Label>Type de masque</Label>
                      <Select 
                        value={anonymizationSettings.customMasks?.type || 'blur'} 
                        onValueChange={(value) => setAnonymizationSettings(prev => ({ 
                          ...prev, 
                          customMasks: { ...prev.customMasks, type: value as any }
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="blur">Flou</SelectItem>
                          <SelectItem value="pixelate">Pixelisation</SelectItem>
                          <SelectItem value="emoji">Emoji</SelectItem>
                          <SelectItem value="solid">Couleur unie</SelectItem>
                          <SelectItem value="artistic">Artistique</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="childProtection">Protection enfants renforcée</Label>
                      <Switch
                        id="childProtection"
                        checked={anonymizationSettings.childProtection}
                        onCheckedChange={(checked) => setAnonymizationSettings(prev => ({ 
                          ...prev, 
                          childProtection: checked 
                        }))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="preserveArtistic">Préserver l'aspect artistique</Label>
                      <Switch
                        id="preserveArtistic"
                        checked={anonymizationSettings.preserveArtistic || false}
                        onCheckedChange={(checked) => setAnonymizationSettings(prev => ({ 
                          ...prev, 
                          preserveArtistic: checked 
                        }))}
                      />
                    </div>
                  </>
                )}

                <Button 
                  onClick={() => setActiveTab("process")}
                  className="w-full"
                  disabled={detectedPersons.length === 0}
                >
                  Lancer l'anonymisation
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="process" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Traitement en Cours
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {processingProgress > 0 && processingProgress < 100 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Progression</span>
                    <span className="text-sm text-gray-600">{processingProgress}%</span>
                  </div>
                  <Progress value={processingProgress} className="w-full" />
                  <p className="text-sm text-gray-600 text-center">
                    Analyse et application de l'anonymisation...
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">Configuration Actuelle</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span>Mode:</span>
                      <Badge variant="outline" className="flex items-center gap-1">
                        {getModeIcon(anonymizationSettings.mode)}
                        {anonymizationSettings.mode}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Intensité du flou:</span>
                      <span className="font-medium">{anonymizationSettings.blurIntensity}/10</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Protection enfants:</span>
                      <Badge variant={anonymizationSettings.childProtection ? "destructive" : "secondary"}>
                        {anonymizationSettings.childProtection ? "Activée" : "Désactivée"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Type de masque:</span>
                      <span className="font-medium">{anonymizationSettings.customMasks?.type}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Statistiques</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-3 bg-gray-50 rounded">
                      <p className="text-2xl font-bold text-blue-600">{detectedPersons.length}</p>
                      <p className="text-xs text-gray-600">Personnes</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded">
                      <p className="text-2xl font-bold text-orange-600">
                        {detectedPersons.filter(p => p.isChild).length}
                      </p>
                      <p className="text-xs text-gray-600">Enfants</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded">
                      <p className="text-2xl font-bold text-red-600">
                        {detectedPersons.filter(p => p.identificationRisk === 'high').length}
                      </p>
                      <p className="text-xs text-gray-600">Risque élevé</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded">
                      <p className="text-2xl font-bold text-green-600">
                        {detectedPersons.filter(p => p.faceVisible).length}
                      </p>
                      <p className="text-xs text-gray-600">Visages</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4">
                <Button 
                  onClick={handleApplyAnonymization}
                  disabled={anonymizeMutation.isPending || processingProgress > 0}
                  className="flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  {anonymizeMutation.isPending ? "Traitement..." : "Appliquer l'anonymisation"}
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => setActiveTab("configure")}
                  disabled={anonymizeMutation.isPending}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Modifier la configuration
                </Button>

                {processingProgress === 100 && (
                  <Button 
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Télécharger le résultat
                  </Button>
                )}
              </div>

              {anonymizeMutation.data && (
                <Alert className="mt-6">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Anonymisation terminée avec succès! Score de confidentialité: {Math.round(anonymizeMutation.data.privacyScore * 100)}% | 
                    Qualité préservée: {Math.round(anonymizeMutation.data.qualityScore * 100)}% | 
                    Temps de traitement: {anonymizeMutation.data.processingTime}ms
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}