import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Instagram, 
  Facebook, 
  Download, 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  MapPin, 
  Calendar,
  User,
  Image as ImageIcon,
  Settings,
  Link as LinkIcon,
  RefreshCw,
  Filter,
  Grid,
  List,
  Search
} from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface SocialAccount {
  id: string;
  platform: 'instagram' | 'facebook';
  username: string;
  displayName: string;
  profilePicture: string;
  isConnected: boolean;
  lastSync: string | null;
  photoCount: number;
  permissions: string[];
}

interface SocialPhoto {
  id: string;
  platform: 'instagram' | 'facebook';
  originalId: string;
  url: string;
  thumbnailUrl: string;
  caption: string;
  createdTime: string;
  location?: {
    name: string;
    latitude?: number;
    longitude?: number;
  };
  tags: string[];
  likes: number;
  comments: number;
  isImported: boolean;
  importedAt?: string;
  tripId?: number;
  albumId?: number;
}

interface ImportSettings {
  includeLocation: boolean;
  includeCaptions: boolean;
  includeHashtags: boolean;
  autoAssignTrips: boolean;
  dateRange: {
    start: string;
    end: string;
  };
  qualityPreference: 'thumbnail' | 'medium' | 'high';
  batchSize: number;
}

export default function SocialImport() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>('accounts');
  const [selectedPlatform, setSelectedPlatform] = useState<'instagram' | 'facebook' | 'all'>('all');
  const [importSettings, setImportSettings] = useState<ImportSettings>({
    includeLocation: true,
    includeCaptions: true,
    includeHashtags: true,
    autoAssignTrips: true,
    dateRange: { start: '', end: '' },
    qualityPreference: 'high',
    batchSize: 50
  });
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [importProgress, setImportProgress] = useState<{
    isImporting: boolean;
    total: number;
    completed: number;
    current?: string;
  }>({
    isImporting: false,
    total: 0,
    completed: 0
  });

  // Fetch connected social accounts
  const { data: accounts = [], isLoading: accountsLoading, refetch: refetchAccounts } = useQuery({
    queryKey: ["/api/social/accounts"],
  });

  // Fetch available photos from social platforms
  const { data: socialPhotos = [], isLoading: photosLoading, refetch: refetchPhotos } = useQuery({
    queryKey: ["/api/social/photos", selectedPlatform, importSettings.dateRange],
    enabled: accounts.some((acc: SocialAccount) => acc.isConnected),
  });

  // Connect social account mutation
  const connectAccountMutation = useMutation({
    mutationFn: async (platform: 'instagram' | 'facebook') => {
      const response = await fetch(`/api/social/connect/${platform}`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to connect account');
      return response.json();
    },
    onSuccess: (data) => {
      if (data.authUrl) {
        window.open(data.authUrl, '_blank', 'width=600,height=700');
      }
      refetchAccounts();
      toast({
        title: "Connexion initiée",
        description: "Veuillez autoriser l'accès dans la nouvelle fenêtre",
      });
    },
    onError: () => {
      toast({
        title: "Erreur de connexion",
        description: "Impossible de se connecter au compte",
        variant: "destructive",
      });
    },
  });

  // Disconnect social account mutation
  const disconnectAccountMutation = useMutation({
    mutationFn: async (accountId: string) => {
      const response = await fetch(`/api/social/disconnect/${accountId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to disconnect account');
      return response.json();
    },
    onSuccess: () => {
      refetchAccounts();
      toast({
        title: "Compte déconnecté",
        description: "Le compte a été déconnecté avec succès",
      });
    },
  });

  // Sync photos mutation
  const syncPhotosMutation = useMutation({
    mutationFn: async (accountId: string) => {
      const response = await fetch(`/api/social/sync/${accountId}`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to sync photos');
      return response.json();
    },
    onSuccess: () => {
      refetchPhotos();
      refetchAccounts();
      toast({
        title: "Synchronisation terminée",
        description: "Les photos ont été synchronisées",
      });
    },
  });

  // Import selected photos mutation
  const importPhotosMutation = useMutation({
    mutationFn: async (photoIds: string[]) => {
      setImportProgress({
        isImporting: true,
        total: photoIds.length,
        completed: 0
      });

      const response = await fetch('/api/social/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photoIds,
          settings: importSettings
        }),
      });
      
      if (!response.ok) throw new Error('Failed to import photos');
      return response.json();
    },
    onSuccess: (data) => {
      setImportProgress({
        isImporting: false,
        total: 0,
        completed: 0
      });
      setSelectedPhotos(new Set());
      refetchPhotos();
      queryClient.invalidateQueries({ queryKey: ["/api/photos"] });
      
      toast({
        title: "Import terminé",
        description: `${data.imported} photos importées avec succès`,
      });
    },
    onError: () => {
      setImportProgress({
        isImporting: false,
        total: 0,
        completed: 0
      });
      toast({
        title: "Erreur d'import",
        description: "Impossible d'importer les photos",
        variant: "destructive",
      });
    },
  });

  const filteredPhotos = socialPhotos.filter((photo: SocialPhoto) => {
    if (selectedPlatform !== 'all' && photo.platform !== selectedPlatform) return false;
    if (searchQuery && !photo.caption.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const togglePhotoSelection = (photoId: string) => {
    const newSelected = new Set(selectedPhotos);
    if (newSelected.has(photoId)) {
      newSelected.delete(photoId);
    } else {
      newSelected.add(photoId);
    }
    setSelectedPhotos(newSelected);
  };

  const selectAllPhotos = () => {
    if (selectedPhotos.size === filteredPhotos.length) {
      setSelectedPhotos(new Set());
    } else {
      setSelectedPhotos(new Set(filteredPhotos.map((photo: SocialPhoto) => photo.id)));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPlatformIcon = (platform: 'instagram' | 'facebook') => {
    return platform === 'instagram' ? Instagram : Facebook;
  };

  const getPlatformColor = (platform: 'instagram' | 'facebook') => {
    return platform === 'instagram' ? 'text-pink-600' : 'text-blue-600';
  };

  if (accountsLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Download className="w-8 h-8 text-blue-600" />
              Import Social Media
            </h1>
            <p className="text-gray-600 mt-1">
              Importez vos photos depuis Instagram et Facebook automatiquement
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-sm">
              {accounts.filter((acc: SocialAccount) => acc.isConnected).length} compte(s) connecté(s)
            </Badge>
            <Badge variant="outline" className="text-sm">
              {socialPhotos.length} photos disponibles
            </Badge>
          </div>
        </div>

        {/* Import Progress */}
        {importProgress.isImporting && (
          <Alert>
            <RefreshCw className="h-4 w-4 animate-spin" />
            <AlertDescription>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span>Import en cours...</span>
                  <span className="text-sm text-gray-600">
                    {importProgress.completed}/{importProgress.total}
                  </span>
                </div>
                <Progress 
                  value={(importProgress.completed / importProgress.total) * 100} 
                  className="w-full"
                />
                {importProgress.current && (
                  <p className="text-sm text-gray-600">
                    Traitement: {importProgress.current}
                  </p>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="accounts" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Comptes
          </TabsTrigger>
          <TabsTrigger value="photos" className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4" />
            Photos
          </TabsTrigger>
          <TabsTrigger value="import" className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Import
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Paramètres
          </TabsTrigger>
        </TabsList>

        <TabsContent value="accounts" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Instagram */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Instagram className="w-5 h-5 text-pink-600" />
                  Instagram
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {accounts.find((acc: SocialAccount) => acc.platform === 'instagram')?.isConnected ? (
                  <div className="space-y-4">
                    {accounts
                      .filter((acc: SocialAccount) => acc.platform === 'instagram')
                      .map((account: SocialAccount) => (
                        <div key={account.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <img 
                              src={account.profilePicture} 
                              alt={account.displayName}
                              className="w-10 h-10 rounded-full"
                            />
                            <div>
                              <p className="font-medium">{account.displayName}</p>
                              <p className="text-sm text-gray-600">@{account.username}</p>
                              <p className="text-xs text-gray-500">
                                {account.photoCount} photos • 
                                Dernière sync: {account.lastSync ? formatDate(account.lastSync) : 'Jamais'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => syncPhotosMutation.mutate(account.id)}
                              disabled={syncPhotosMutation.isPending}
                            >
                              <RefreshCw className={`w-3 h-3 mr-1 ${syncPhotosMutation.isPending ? 'animate-spin' : ''}`} />
                              Sync
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => disconnectAccountMutation.mutate(account.id)}
                            >
                              Déconnecter
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Instagram className="w-12 h-12 text-pink-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Connectez votre compte Instagram</h3>
                    <p className="text-gray-600 mb-4">
                      Accédez à vos photos Instagram et importez-les automatiquement
                    </p>
                    <Button
                      onClick={() => connectAccountMutation.mutate('instagram')}
                      disabled={connectAccountMutation.isPending}
                      className="bg-pink-600 hover:bg-pink-700"
                    >
                      <LinkIcon className="w-4 h-4 mr-2" />
                      Connecter Instagram
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Facebook */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Facebook className="w-5 h-5 text-blue-600" />
                  Facebook
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {accounts.find((acc: SocialAccount) => acc.platform === 'facebook')?.isConnected ? (
                  <div className="space-y-4">
                    {accounts
                      .filter((acc: SocialAccount) => acc.platform === 'facebook')
                      .map((account: SocialAccount) => (
                        <div key={account.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <img 
                              src={account.profilePicture} 
                              alt={account.displayName}
                              className="w-10 h-10 rounded-full"
                            />
                            <div>
                              <p className="font-medium">{account.displayName}</p>
                              <p className="text-sm text-gray-600">@{account.username}</p>
                              <p className="text-xs text-gray-500">
                                {account.photoCount} photos • 
                                Dernière sync: {account.lastSync ? formatDate(account.lastSync) : 'Jamais'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => syncPhotosMutation.mutate(account.id)}
                              disabled={syncPhotosMutation.isPending}
                            >
                              <RefreshCw className={`w-3 h-3 mr-1 ${syncPhotosMutation.isPending ? 'animate-spin' : ''}`} />
                              Sync
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => disconnectAccountMutation.mutate(account.id)}
                            >
                              Déconnecter
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Facebook className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Connectez votre compte Facebook</h3>
                    <p className="text-gray-600 mb-4">
                      Accédez à vos photos Facebook et importez-les automatiquement
                    </p>
                    <Button
                      onClick={() => connectAccountMutation.mutate('facebook')}
                      disabled={connectAccountMutation.isPending}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <LinkIcon className="w-4 h-4 mr-2" />
                      Connecter Facebook
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="photos" className="space-y-4">
          {/* Photo Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Select value={selectedPlatform} onValueChange={(value: 'instagram' | 'facebook' | 'all') => setSelectedPlatform(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes plateformes</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={selectAllPhotos}
                disabled={filteredPhotos.length === 0}
              >
                {selectedPhotos.size === filteredPhotos.length ? 'Désélectionner tout' : 'Sélectionner tout'}
              </Button>

              <div className="flex items-center gap-1 border rounded-md">
                <Button
                  size="sm"
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Selected Photos Count */}
          {selectedPhotos.size > 0 && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>{selectedPhotos.size} photo(s) sélectionnée(s)</span>
                <Button
                  size="sm"
                  onClick={() => importPhotosMutation.mutate(Array.from(selectedPhotos))}
                  disabled={importPhotosMutation.isPending}
                >
                  <Upload className="w-3 h-3 mr-1" />
                  Importer la sélection
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Photos Grid/List */}
          {photosLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 aspect-square rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : filteredPhotos.length > 0 ? (
            <ScrollArea className="h-96">
              <div className={viewMode === 'grid' 
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" 
                : "space-y-4"
              }>
                {filteredPhotos.map((photo: SocialPhoto) => {
                  const Icon = getPlatformIcon(photo.platform);
                  const isSelected = selectedPhotos.has(photo.id);

                  return viewMode === 'grid' ? (
                    <div
                      key={photo.id}
                      className={`relative cursor-pointer border-2 rounded-lg overflow-hidden transition-all ${
                        isSelected ? 'border-blue-500 shadow-lg' : 'border-transparent hover:border-gray-300'
                      } ${photo.isImported ? 'opacity-50' : ''}`}
                      onClick={() => !photo.isImported && togglePhotoSelection(photo.id)}
                    >
                      <img
                        src={photo.thumbnailUrl}
                        alt={photo.caption}
                        className="w-full aspect-square object-cover"
                      />
                      
                      <div className="absolute top-2 left-2 flex items-center gap-1">
                        <Icon className={`w-4 h-4 ${getPlatformColor(photo.platform)}`} />
                        {photo.isImported && (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        )}
                      </div>

                      {isSelected && (
                        <div className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center">
                          <CheckCircle className="w-8 h-8 text-blue-600" />
                        </div>
                      )}

                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white p-2">
                        <p className="text-xs truncate">{photo.caption || 'Sans titre'}</p>
                        <div className="flex items-center justify-between text-xs mt-1">
                          <span>{formatDate(photo.createdTime)}</span>
                          {photo.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              <span className="truncate max-w-20">{photo.location.name}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <Card 
                      key={photo.id}
                      className={`cursor-pointer transition-all ${
                        isSelected ? 'border-blue-500 shadow-lg' : 'hover:shadow-md'
                      } ${photo.isImported ? 'opacity-50' : ''}`}
                      onClick={() => !photo.isImported && togglePhotoSelection(photo.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <img
                            src={photo.thumbnailUrl}
                            alt={photo.caption}
                            className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                          />
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <Icon className={`w-4 h-4 ${getPlatformColor(photo.platform)}`} />
                              <span className="font-medium">{photo.platform}</span>
                              {photo.isImported && (
                                <Badge variant="secondary" className="text-xs">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Importée
                                </Badge>
                              )}
                              {isSelected && (
                                <Badge variant="default" className="text-xs">
                                  Sélectionnée
                                </Badge>
                              )}
                            </div>
                            
                            <p className="text-sm text-gray-900 mb-2 line-clamp-2">
                              {photo.caption || 'Sans titre'}
                            </p>
                            
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {formatDate(photo.createdTime)}
                              </div>
                              {photo.location && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {photo.location.name}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune photo trouvée</h3>
                <p className="text-gray-600">
                  Connectez vos comptes et synchronisez vos photos pour commencer l'import.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="import" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Assistant d'Import</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">Contenu à importer</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Inclure les localisations</label>
                      <Switch
                        checked={importSettings.includeLocation}
                        onCheckedChange={(checked) => 
                          setImportSettings(prev => ({ ...prev, includeLocation: checked }))
                        }
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Inclure les légendes</label>
                      <Switch
                        checked={importSettings.includeCaptions}
                        onCheckedChange={(checked) => 
                          setImportSettings(prev => ({ ...prev, includeCaptions: checked }))
                        }
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Inclure les hashtags</label>
                      <Switch
                        checked={importSettings.includeHashtags}
                        onCheckedChange={(checked) => 
                          setImportSettings(prev => ({ ...prev, includeHashtags: checked }))
                        }
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Assigner aux voyages automatiquement</label>
                      <Switch
                        checked={importSettings.autoAssignTrips}
                        onCheckedChange={(checked) => 
                          setImportSettings(prev => ({ ...prev, autoAssignTrips: checked }))
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Paramètres de qualité</h3>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Qualité des images</label>
                      <Select 
                        value={importSettings.qualityPreference} 
                        onValueChange={(value: 'thumbnail' | 'medium' | 'high') => 
                          setImportSettings(prev => ({ ...prev, qualityPreference: value }))
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="thumbnail">Miniature (rapide)</SelectItem>
                          <SelectItem value="medium">Moyenne qualité</SelectItem>
                          <SelectItem value="high">Haute qualité</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700">Taille des lots</label>
                      <Select 
                        value={importSettings.batchSize.toString()} 
                        onValueChange={(value) => 
                          setImportSettings(prev => ({ ...prev, batchSize: parseInt(value) }))
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="25">25 photos par lot</SelectItem>
                          <SelectItem value="50">50 photos par lot</SelectItem>
                          <SelectItem value="100">100 photos par lot</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-semibold">Filtrage par date</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Date de début</label>
                    <input
                      type="date"
                      value={importSettings.dateRange.start}
                      onChange={(e) => 
                        setImportSettings(prev => ({ 
                          ...prev, 
                          dateRange: { ...prev.dateRange, start: e.target.value }
                        }))
                      }
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Date de fin</label>
                    <input
                      type="date"
                      value={importSettings.dateRange.end}
                      onChange={(e) => 
                        setImportSettings(prev => ({ 
                          ...prev, 
                          dateRange: { ...prev.dateRange, end: e.target.value }
                        }))
                      }
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="text-center">
                <Button
                  onClick={() => importPhotosMutation.mutate(Array.from(selectedPhotos))}
                  disabled={selectedPhotos.size === 0 || importPhotosMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Importer {selectedPhotos.size} photo(s) sélectionnée(s)
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres d'import automatique</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Ces paramètres seront appliqués lors des futurs imports automatiques.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Synchronisation automatique</p>
                    <p className="text-sm text-gray-600">Synchroniser les nouvelles photos quotidiennement</p>
                  </div>
                  <Switch />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Import automatique</p>
                    <p className="text-sm text-gray-600">Importer automatiquement les nouvelles photos</p>
                  </div>
                  <Switch />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Notifications</p>
                    <p className="text-sm text-gray-600">Recevoir des notifications lors des imports</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-semibold">Filtres automatiques</h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Mots-clés à exclure</label>
                    <input
                      type="text"
                      placeholder="Séparez par des virgules"
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Nombre minimum de likes</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}