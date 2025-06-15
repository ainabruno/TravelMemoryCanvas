import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import PhotoGrid from "@/components/photo-grid";
import PhotoComments from "@/components/photo-comments";
import ActivityFeed from "@/components/activity-feed";
import PhotoEditModal from "@/components/photo-edit-modal";
import ShareModal from "@/components/share-modal";
import { 
  Users, 
  Camera, 
  MessageCircle, 
  Activity, 
  Share2, 
  Copy, 
  Eye,
  Upload,
  Crown,
  Shield,
  User
} from "lucide-react";

interface CollaborativeAlbumViewProps {
  albumId: number;
  shareCode?: string;
  contributorName: string;
  contributorEmail?: string;
}

interface Photo {
  id: number;
  filename: string;
  originalName: string;
  url: string;
  tripId: number | null;
  albumId: number | null;
  caption: string | null;
  location: string | null;
  latitude: string | null;
  longitude: string | null;
  uploadedAt: string;
  metadata: string | null;
}

const roleIcons = {
  owner: Crown,
  admin: Shield,
  contributor: User,
  viewer: Eye,
};

const roleColors = {
  owner: "bg-yellow-100 text-yellow-800",
  admin: "bg-purple-100 text-purple-800", 
  contributor: "bg-blue-100 text-blue-800",
  viewer: "bg-gray-100 text-gray-800",
};

export default function CollaborativeAlbumView({ 
  albumId, 
  shareCode, 
  contributorName, 
  contributorEmail 
}: CollaborativeAlbumViewProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch album data
  const { data: album, isLoading: albumLoading } = useQuery({
    queryKey: ['/api/albums', albumId],
    queryFn: () => apiRequest('GET', `/api/albums/${albumId}`).then(res => res.json()),
  });

  // Fetch album photos
  const { data: photos = [], isLoading: photosLoading } = useQuery({
    queryKey: ['/api/albums', albumId, 'photos'],
    queryFn: () => apiRequest('GET', `/api/albums/${albumId}/photos`).then(res => res.json()),
  });

  // Fetch contributors
  const { data: contributors = [], isLoading: contributorsLoading } = useQuery({
    queryKey: ['/api/albums', albumId, 'contributors'],
    queryFn: () => apiRequest('GET', `/api/albums/${albumId}/contributors`).then(res => res.json()),
  });

  // Fetch active collaborators
  const { data: activeCollaborators = [] } = useQuery({
    queryKey: ['/api/albums', albumId, 'collaborators'],
    queryFn: () => apiRequest('GET', `/api/albums/${albumId}/collaborators`).then(res => res.json()),
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const handlePhotoEdit = (photo: Photo) => {
    setSelectedPhoto(photo);
    setShowPhotoModal(true);
  };

  const handlePhotoShare = (photo: Photo) => {
    setSelectedPhoto(photo);
    setShowShareModal(true);
  };

  const copyShareCode = () => {
    if (shareCode) {
      navigator.clipboard.writeText(shareCode);
      toast({
        title: "Code copié",
        description: "Le code de partage a été copié",
      });
    }
  };

  const copyShareLink = () => {
    if (shareCode) {
      const shareUrl = `${window.location.origin}/shared/${shareCode}`;
      navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Lien copié", 
        description: "Le lien de partage a été copié",
      });
    }
  };

  if (albumLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-6"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Album Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-6 h-6" />
                {album?.title}
                {album?.isShared && (
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    Partagé
                  </Badge>
                )}
              </CardTitle>
              {album?.description && (
                <p className="text-gray-600 mt-2">{album.description}</p>
              )}
            </div>
            
            {shareCode && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={copyShareCode}>
                  <Copy className="w-4 h-4 mr-2" />
                  Code: {shareCode}
                </Button>
                <Button variant="outline" size="sm" onClick={copyShareLink}>
                  <Share2 className="w-4 h-4 mr-2" />
                  Partager
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Stats */}
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-gray-500" />
              <span className="text-sm text-gray-600">
                {photos.length} photo{photos.length > 1 ? 's' : ''}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-gray-500" />
              <span className="text-sm text-gray-600">
                {contributors.length} contributeur{contributors.length > 1 ? 's' : ''}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-gray-500" />
              <span className="text-sm text-gray-600">
                {activeCollaborators.length} en ligne
              </span>
            </div>
          </div>

          {/* Contributors List */}
          <div className="mt-4">
            <h4 className="font-medium text-gray-900 mb-3">Contributeurs</h4>
            <div className="flex flex-wrap gap-2">
              {contributors.map((contributor: any) => {
                const RoleIcon = roleIcons[contributor.role as keyof typeof roleIcons] || User;
                const roleColor = roleColors[contributor.role as keyof typeof roleColors] || roleColors.viewer;
                const isActive = activeCollaborators.some((ac: any) => ac.contributorName === contributor.contributorName);
                
                return (
                  <div key={contributor.id} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
                    <Avatar className="w-6 h-6">
                      <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                        {contributor.contributorName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{contributor.contributorName}</span>
                    <Badge variant="secondary" className={`text-xs ${roleColor}`}>
                      <RoleIcon className="w-3 h-3 mr-1" />
                      {contributor.role}
                    </Badge>
                    {isActive && (
                      <div className="w-2 h-2 bg-green-500 rounded-full" title="En ligne"></div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="photos" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="photos" className="flex items-center gap-2">
            <Camera className="w-4 h-4" />
            Photos
          </TabsTrigger>
          <TabsTrigger value="comments" className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            Discussions
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Activité
          </TabsTrigger>
        </TabsList>

        <TabsContent value="photos">
          <PhotoGrid
            photos={photos}
            loading={photosLoading}
            onEdit={handlePhotoEdit}
            onShare={handlePhotoShare}
          />
        </TabsContent>

        <TabsContent value="comments">
          <div className="space-y-4">
            {photos.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Camera className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500">Aucune photo pour commenter</p>
                </CardContent>
              </Card>
            ) : (
              photos.slice(0, 5).map((photo: Photo) => (
                <Card key={photo.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={photo.url}
                        alt={photo.originalName}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <div>
                        <CardTitle className="text-sm">{photo.originalName}</CardTitle>
                        {photo.caption && (
                          <p className="text-xs text-gray-600">{photo.caption}</p>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <PhotoComments
                      photoId={photo.id}
                      contributorName={contributorName}
                      contributorEmail={contributorEmail}
                    />
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="activity">
          <ActivityFeed albumId={albumId} />
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <PhotoEditModal
        photo={selectedPhoto}
        open={showPhotoModal}
        onClose={() => {
          setShowPhotoModal(false);
          setSelectedPhoto(null);
        }}
        onShare={() => {
          setShowPhotoModal(false);
          setShowShareModal(true);
        }}
      />

      <ShareModal
        photo={selectedPhoto}
        open={showShareModal}
        onClose={() => {
          setShowShareModal(false);
          setSelectedPhoto(null);
        }}
      />
    </div>
  );
}