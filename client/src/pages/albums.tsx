import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Plus, Camera, Share2, Users, MapPin } from "lucide-react";
import PageLayout from "@/components/page-layout";

interface Album {
  id: number;
  title: string;
  description: string;
  coverPhotoUrl: string | null;
  tripId: number | null;
  photoCount: number;
  isShared: boolean;
}

export default function AlbumsPage() {
  const [, setLocation] = useLocation();
  const [newAlbumOpen, setNewAlbumOpen] = useState(false);
  const [albumTitle, setAlbumTitle] = useState("");
  const [albumDescription, setAlbumDescription] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch albums
  const { data: albums = [], isLoading } = useQuery({
    queryKey: ['/api/albums'],
  });

  // Fetch trips for dropdown
  const { data: trips = [] } = useQuery({
    queryKey: ['/api/trips'],
  });

  // Create album mutation
  const createAlbumMutation = useMutation({
    mutationFn: async (albumData: { title: string; description: string }) => {
      return apiRequest('POST', '/api/albums', albumData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/albums'] });
      setNewAlbumOpen(false);
      setAlbumTitle("");
      setAlbumDescription("");
      toast({
        title: "Album créé",
        description: "Votre nouvel album a été créé avec succès",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de créer l'album",
        variant: "destructive",
      });
    },
  });

  const handleCreateAlbum = () => {
    if (!albumTitle.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir un titre pour l'album",
        variant: "destructive",
      });
      return;
    }

    createAlbumMutation.mutate({
      title: albumTitle,
      description: albumDescription,
    });
  };

  if (isLoading) {
    return (
      <PageLayout>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setLocation('/')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour au menu
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Mes Albums</h1>
                <p className="text-gray-600">Organisez vos photos de voyage en collections</p>
              </div>
            </div>

            <Dialog open={newAlbumOpen} onOpenChange={setNewAlbumOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Nouvel Album
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Créer un nouvel album</DialogTitle>
                  <DialogDescription>
                    Donnez un titre et une description à votre album
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Titre de l'album</Label>
                    <Input
                      id="title"
                      value={albumTitle}
                      onChange={(e) => setAlbumTitle(e.target.value)}
                      placeholder="Ex: Vacances en Italie"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description (optionnel)</Label>
                    <Textarea
                      id="description"
                      value={albumDescription}
                      onChange={(e) => setAlbumDescription(e.target.value)}
                      placeholder="Décrivez votre album..."
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setNewAlbumOpen(false)}>
                    Annuler
                  </Button>
                  <Button 
                    onClick={handleCreateAlbum}
                    disabled={createAlbumMutation.isPending}
                  >
                    {createAlbumMutation.isPending ? "Création..." : "Créer l'album"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Albums Grid */}
          {(albums as any[]).length === 0 ? (
            <div className="text-center py-12">
              <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucun album pour le moment
              </h3>
              <p className="text-gray-600 mb-6">
                Créez votre premier album pour organiser vos photos de voyage
              </p>
              <Button onClick={() => setNewAlbumOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Créer mon premier album
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {(albums as any[]).map((album: Album) => (
                <Card key={album.id} className="group hover:shadow-lg transition-all duration-300 cursor-pointer">
                  <CardHeader className="p-0">
                    <div className="relative aspect-video bg-gradient-to-br from-blue-100 to-purple-100 rounded-t-lg overflow-hidden">
                      {album.coverPhotoUrl ? (
                        <img
                          src={album.coverPhotoUrl}
                          alt={album.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Camera className="w-12 h-12 text-gray-400" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2 flex gap-1">
                        {album.isShared && (
                          <div className="bg-green-500 text-white p-1 rounded-full">
                            <Share2 className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="mb-2">
                      <h3 className="font-semibold text-gray-900 truncate">{album.title}</h3>
                      {album.description && (
                        <p className="text-sm text-gray-600 line-clamp-2 mt-1">{album.description}</p>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Camera className="w-3 h-3" />
                        {album.photoCount} photo(s)
                      </span>
                      {album.isShared && (
                        <span className="flex items-center gap-1 text-green-600">
                          <Users className="w-3 h-3" />
                          Partagé
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}