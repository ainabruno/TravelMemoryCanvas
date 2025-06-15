import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Calendar } from "@/components/ui/calendar";
import { 
  Share2, 
  Lock, 
  Globe, 
  Eye, 
  Download, 
  MessageCircle, 
  Heart,
  Edit3,
  Trash2,
  Settings,
  Copy,
  QrCode,
  Link,
  Mail,
  Users,
  Shield,
  Clock,
  BarChart3,
  Image,
  Folder,
  Map,
  FileText,
  Video,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  X,
  Plus,
  Filter,
  Search,
  Calendar as CalendarIcon,
  Zap,
  Star,
  TrendingUp
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ShareableItem {
  id: number;
  itemType: string;
  itemId: number;
  ownerId: string;
  shareCode: string;
  title: string;
  description?: string;
  visibility: string;
  isActive: boolean;
  expiresAt?: string;
  passwordProtected: boolean;
  downloadEnabled: boolean;
  commentsEnabled: boolean;
  likesEnabled: boolean;
  viewCount: number;
  maxViews?: number;
  watermarkEnabled: boolean;
  qualityRestriction?: string;
  geolocationHidden: boolean;
  metadataHidden: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SharePermission {
  id: number;
  shareId: number;
  userId?: string;
  email?: string;
  role: string;
  canView: boolean;
  canDownload: boolean;
  canComment: boolean;
  canLike: boolean;
  canEdit: boolean;
  canShare: boolean;
  canDelete: boolean;
  canManagePermissions: boolean;
  expiresAt?: string;
  isRevoked: boolean;
  createdAt: string;
}

interface ShareActivity {
  id: number;
  shareId: number;
  userId?: string;
  visitorId?: string;
  action: string;
  itemType?: string;
  itemId?: number;
  ipAddress?: string;
  userAgent?: string;
  location?: any;
  duration?: number;
  createdAt: string;
}

interface ShareTemplate {
  id: number;
  userId: string;
  name: string;
  description?: string;
  templateType: string;
  defaultPermissions: any;
  settings: any;
  isPublic: boolean;
  usageCount: number;
  createdAt: string;
}

interface ShareLink {
  id: number;
  shareId: number;
  linkType: string;
  url: string;
  shortUrl?: string;
  qrCode?: string;
  embedCode?: string;
  socialPlatform?: string;
  isActive: boolean;
  clickCount: number;
  lastClickedAt?: string;
  createdAt: string;
}

export default function GranularSharing() {
  const [activeTab, setActiveTab] = useState("my-shares");
  const [selectedItem, setSelectedItem] = useState<ShareableItem | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false);
  const [showAnalyticsDialog, setShowAnalyticsDialog] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterVisibility, setFilterVisibility] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  // Fetch shared items
  const { data: sharedItems, isLoading: itemsLoading } = useQuery<ShareableItem[]>({
    queryKey: ["/api/sharing/items"],
  });

  // Fetch permissions for selected item
  const { data: permissions } = useQuery<SharePermission[]>({
    queryKey: ["/api/sharing/permissions", selectedItem?.id],
    enabled: !!selectedItem,
  });

  // Fetch activity for selected item
  const { data: activities } = useQuery<ShareActivity[]>({
    queryKey: ["/api/sharing/activity", selectedItem?.id],
    enabled: !!selectedItem,
  });

  // Fetch share templates
  const { data: templates } = useQuery<ShareTemplate[]>({
    queryKey: ["/api/sharing/templates"],
  });

  // Fetch share links
  const { data: shareLinks } = useQuery<ShareLink[]>({
    queryKey: ["/api/sharing/links", selectedItem?.id],
    enabled: !!selectedItem,
  });

  // Create share mutation
  const createShareMutation = useMutation({
    mutationFn: async (shareData: any) => {
      return await apiRequest("/api/sharing/create", "POST", shareData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sharing/items"] });
      setShowCreateDialog(false);
      toast({
        title: "Partage créé",
        description: "Le partage a été créé avec succès.",
      });
    },
  });

  // Update permissions mutation
  const updatePermissionsMutation = useMutation({
    mutationFn: async ({ shareId, permissions }: { shareId: number; permissions: any }) => {
      return await apiRequest(`/api/sharing/${shareId}/permissions`, "PUT", permissions);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sharing/permissions"] });
      toast({
        title: "Permissions mises à jour",
        description: "Les permissions ont été modifiées avec succès.",
      });
    },
  });

  // Generate link mutation
  const generateLinkMutation = useMutation({
    mutationFn: async ({ shareId, linkType }: { shareId: number; linkType: string }) => {
      return await apiRequest(`/api/sharing/${shareId}/links`, "POST", { linkType });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sharing/links"] });
      toast({
        title: "Lien généré",
        description: "Le lien de partage a été créé avec succès.",
      });
    },
  });

  const handleCreateShare = (formData: FormData) => {
    const shareData = {
      itemType: formData.get("itemType"),
      itemId: parseInt(formData.get("itemId") as string),
      title: formData.get("title"),
      description: formData.get("description"),
      visibility: formData.get("visibility"),
      passwordProtected: formData.get("passwordProtected") === "on",
      password: formData.get("password"),
      downloadEnabled: formData.get("downloadEnabled") === "on",
      commentsEnabled: formData.get("commentsEnabled") === "on",
      likesEnabled: formData.get("likesEnabled") === "on",
      maxViews: formData.get("maxViews") ? parseInt(formData.get("maxViews") as string) : undefined,
      watermarkEnabled: formData.get("watermarkEnabled") === "on",
      qualityRestriction: formData.get("qualityRestriction"),
      geolocationHidden: formData.get("geolocationHidden") === "on",
      metadataHidden: formData.get("metadataHidden") === "on",
      expiresAt: formData.get("expiresAt") || undefined,
    };
    
    createShareMutation.mutate(shareData);
  };

  const handleUpdatePermissions = (permissions: any) => {
    if (!selectedItem) return;
    updatePermissionsMutation.mutate({
      shareId: selectedItem.id,
      permissions
    });
  };

  const handleGenerateLink = (linkType: string) => {
    if (!selectedItem) return;
    generateLinkMutation.mutate({
      shareId: selectedItem.id,
      linkType
    });
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copié",
        description: "Le lien a été copié dans le presse-papiers.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de copier le lien.",
        variant: "destructive",
      });
    }
  };

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case "public": return <Globe className="w-4 h-4 text-green-500" />;
      case "link": return <Link className="w-4 h-4 text-blue-500" />;
      case "friends": return <Users className="w-4 h-4 text-purple-500" />;
      case "custom": return <Settings className="w-4 h-4 text-orange-500" />;
      default: return <Lock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getItemTypeIcon = (type: string) => {
    switch (type) {
      case "photo": return <Image className="w-4 h-4" />;
      case "album": return <Folder className="w-4 h-4" />;
      case "trip": return <Map className="w-4 h-4" />;
      case "story": return <FileText className="w-4 h-4" />;
      case "video": return <Video className="w-4 h-4" />;
      default: return <Share2 className="w-4 h-4" />;
    }
  };

  const getVisibilityBadgeColor = (visibility: string) => {
    switch (visibility) {
      case "public": return "bg-green-100 text-green-800";
      case "link": return "bg-blue-100 text-blue-800";
      case "friends": return "bg-purple-100 text-purple-800";
      case "custom": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin": return "bg-red-100 text-red-800";
      case "editor": return "bg-orange-100 text-orange-800";
      case "commenter": return "bg-blue-100 text-blue-800";
      case "viewer": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const filteredItems = sharedItems?.filter(item => {
    const matchesType = filterType === "all" || item.itemType === filterType;
    const matchesVisibility = filterVisibility === "all" || item.visibility === filterVisibility;
    const matchesSearch = !searchQuery || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesVisibility && matchesSearch;
  });

  if (itemsLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Share2 className="w-8 h-8 text-blue-600" />
            Partage Granulaire
          </h1>
          <p className="text-gray-600 mt-1">
            Contrôlez précisément qui peut voir et interagir avec vos contenus
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nouveau partage
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Créer un nouveau partage</DialogTitle>
              </DialogHeader>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleCreateShare(formData);
              }} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="itemType">Type de contenu *</Label>
                    <Select name="itemType" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez un type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="photo">Photo</SelectItem>
                        <SelectItem value="album">Album</SelectItem>
                        <SelectItem value="trip">Voyage</SelectItem>
                        <SelectItem value="story">Récit</SelectItem>
                        <SelectItem value="video">Vidéo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="itemId">ID du contenu *</Label>
                    <Input
                      id="itemId"
                      name="itemId"
                      type="number"
                      placeholder="Ex: 123"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Titre du partage *</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="Ex: Mes photos de vacances"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Description optionnelle du partage..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="visibility">Visibilité *</Label>
                  <Select name="visibility" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez la visibilité" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="private">Privé</SelectItem>
                      <SelectItem value="link">Avec lien uniquement</SelectItem>
                      <SelectItem value="friends">Amis uniquement</SelectItem>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="custom">Personnalisé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="qualityRestriction">Qualité d'image</Label>
                    <Select name="qualityRestriction">
                      <SelectTrigger>
                        <SelectValue placeholder="Qualité autorisée" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="original">Originale</SelectItem>
                        <SelectItem value="high">Haute</SelectItem>
                        <SelectItem value="medium">Moyenne</SelectItem>
                        <SelectItem value="low">Basse</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxViews">Limite de vues</Label>
                    <Input
                      id="maxViews"
                      name="maxViews"
                      type="number"
                      placeholder="Illimité"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Options de partage</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="downloadEnabled" name="downloadEnabled" />
                      <Label htmlFor="downloadEnabled">Téléchargement autorisé</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="commentsEnabled" name="commentsEnabled" defaultChecked />
                      <Label htmlFor="commentsEnabled">Commentaires autorisés</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="likesEnabled" name="likesEnabled" defaultChecked />
                      <Label htmlFor="likesEnabled">Likes autorisés</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="watermarkEnabled" name="watermarkEnabled" />
                      <Label htmlFor="watermarkEnabled">Filigrane</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="geolocationHidden" name="geolocationHidden" />
                      <Label htmlFor="geolocationHidden">Masquer localisation</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="metadataHidden" name="metadataHidden" />
                      <Label htmlFor="metadataHidden">Masquer métadonnées</Label>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Protection</h4>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="passwordProtected" name="passwordProtected" />
                    <Label htmlFor="passwordProtected">Protection par mot de passe</Label>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Mot de passe</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="Optionnel"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expiresAt">Date d'expiration</Label>
                    <Input
                      id="expiresAt"
                      name="expiresAt"
                      type="datetime-local"
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={createShareMutation.isPending}>
                  {createShareMutation.isPending ? "Création en cours..." : "Créer le partage"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="my-shares">Mes partages</TabsTrigger>
          <TabsTrigger value="shared-with-me">Partagé avec moi</TabsTrigger>
          <TabsTrigger value="templates">Modèles</TabsTrigger>
          <TabsTrigger value="analytics">Analytiques</TabsTrigger>
        </TabsList>

        <TabsContent value="my-shares" className="space-y-6">
          {/* Search and Filters */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-gray-500" />
              <Input
                placeholder="Rechercher un partage..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="photo">Photos</SelectItem>
                  <SelectItem value="album">Albums</SelectItem>
                  <SelectItem value="trip">Voyages</SelectItem>
                  <SelectItem value="story">Récits</SelectItem>
                  <SelectItem value="video">Vidéos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Select value={filterVisibility} onValueChange={setFilterVisibility}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes visibilités</SelectItem>
                  <SelectItem value="private">Privé</SelectItem>
                  <SelectItem value="link">Avec lien</SelectItem>
                  <SelectItem value="friends">Amis</SelectItem>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="custom">Personnalisé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Shared Items Grid */}
          {filteredItems && filteredItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map((item) => (
                <Card key={item.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {getItemTypeIcon(item.itemType)}
                        <div>
                          <h3 className="font-semibold truncate">{item.title}</h3>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            {getVisibilityIcon(item.visibility)}
                            <span className="capitalize">{item.itemType}</span>
                          </div>
                        </div>
                      </div>
                      <Badge variant="secondary" className={getVisibilityBadgeColor(item.visibility)}>
                        {item.visibility}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {item.description && (
                      <p className="text-sm text-gray-700 line-clamp-2">{item.description}</p>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4 text-gray-500" />
                        <span>{item.viewCount} vues</span>
                      </div>
                      {item.maxViews && (
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-orange-500" />
                          <span>Max: {item.maxViews}</span>
                        </div>
                      )}
                      {item.expiresAt && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-red-500" />
                          <span>Expire: {new Date(item.expiresAt).toLocaleDateString('fr-FR')}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-blue-500" />
                        <span>{item.passwordProtected ? "Protégé" : "Ouvert"}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {item.downloadEnabled && (
                        <Badge variant="outline" className="text-xs">
                          <Download className="w-3 h-3 mr-1" />
                          Téléchargement
                        </Badge>
                      )}
                      {item.commentsEnabled && (
                        <Badge variant="outline" className="text-xs">
                          <MessageCircle className="w-3 h-3 mr-1" />
                          Commentaires
                        </Badge>
                      )}
                      {item.watermarkEnabled && (
                        <Badge variant="outline" className="text-xs">
                          <Shield className="w-3 h-3 mr-1" />
                          Filigrane
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setSelectedItem(item);
                          setShowPermissionsDialog(true);
                        }}
                      >
                        <Settings className="w-4 h-4 mr-1" />
                        Permissions
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => copyToClipboard(`${window.location.origin}/share/${item.shareCode}`)}
                      >
                        <Copy className="w-4 h-4 mr-1" />
                        Copier lien
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setSelectedItem(item);
                          setShowAnalyticsDialog(true);
                        }}
                      >
                        <BarChart3 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Share2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Aucun partage trouvé
              </h3>
              <p className="text-gray-600">
                Aucun partage ne correspond à vos critères de recherche.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="shared-with-me" className="space-y-4">
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Contenu partagé avec vous
            </h3>
            <p className="text-gray-600">
              Les éléments partagés avec vous apparaîtront ici.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Modèles de partage</h2>
            <Button variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Nouveau modèle
            </Button>
          </div>
          
          {templates && templates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((template) => (
                <Card key={template.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <p className="text-sm text-gray-600 mt-1">
                          {template.templateType}
                        </p>
                      </div>
                      {template.isPublic && (
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          Public
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {template.description && (
                      <p className="text-sm text-gray-700">{template.description}</p>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>Utilisé {template.usageCount} fois</span>
                      <span>•</span>
                      <span>{new Date(template.createdAt).toLocaleDateString('fr-FR')}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button size="sm" className="flex-1">
                        Utiliser
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit3 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Aucun modèle
              </h3>
              <p className="text-gray-600">
                Créez des modèles pour simplifier vos futurs partages.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="text-center py-12">
            <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Analytiques de partage
            </h3>
            <p className="text-gray-600">
              Les statistiques détaillées de vos partages seront affichées ici.
            </p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Permissions Management Dialog */}
      <Dialog open={showPermissionsDialog} onOpenChange={setShowPermissionsDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              Gérer les permissions - {selectedItem?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Utilisateurs autorisés</h3>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Ajouter utilisateur
              </Button>
            </div>
            
            {permissions && permissions.length > 0 ? (
              <div className="space-y-4">
                {permissions.map((permission) => (
                  <div key={permission.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback>
                          {permission.email?.slice(0, 2).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{permission.email || permission.userId}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Badge className={getRoleBadgeColor(permission.role)}>
                            {permission.role}
                          </Badge>
                          {permission.expiresAt && (
                            <span>Expire: {new Date(permission.expiresAt).toLocaleDateString('fr-FR')}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline">
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">Aucune permission spécifique définie</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Analytics Dialog */}
      <Dialog open={showAnalyticsDialog} onOpenChange={setShowAnalyticsDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              Analytiques - {selectedItem?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Vues totales</p>
                      <p className="text-2xl font-bold">{selectedItem?.viewCount || 0}</p>
                    </div>
                    <Eye className="w-6 h-6 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Téléchargements</p>
                      <p className="text-2xl font-bold">0</p>
                    </div>
                    <Download className="w-6 h-6 text-green-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Partages</p>
                      <p className="text-2xl font-bold">0</p>
                    </div>
                    <Share2 className="w-6 h-6 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Likes</p>
                      <p className="text-2xl font-bold">0</p>
                    </div>
                    <Heart className="w-6 h-6 text-red-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Activité récente</h3>
              {activities && activities.length > 0 ? (
                <div className="space-y-3">
                  {activities.slice(0, 10).map((activity) => (
                    <div key={activity.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm">
                          <span className="font-medium">{activity.userId || "Visiteur anonyme"}</span>
                          {" "}{activity.action} {activity.itemType && `${activity.itemType}`}
                        </p>
                        <p className="text-xs text-gray-600">
                          {new Date(activity.createdAt).toLocaleString('fr-FR')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">Aucune activité enregistrée</p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}