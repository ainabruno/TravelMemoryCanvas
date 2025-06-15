import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Share2, Copy, Users, Link, Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SharedAlbumModalProps {
  children: React.ReactNode;
}

export default function SharedAlbumModal({ children }: SharedAlbumModalProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [allowUploads, setAllowUploads] = useState(true);
  const [shareCode, setShareCode] = useState("");
  const [isCreated, setIsCreated] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createSharedAlbumMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/albums/shared', {
        title,
        description,
        allowUploads,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setShareCode(data.shareCode);
      setIsCreated(true);
      queryClient.invalidateQueries({ queryKey: ['/api/albums'] });
      toast({
        title: "Album partagé créé",
        description: "Votre album partagé est maintenant disponible",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de créer l'album partagé",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast({
        title: "Titre requis",
        description: "Veuillez entrer un titre pour l'album",
        variant: "destructive",
      });
      return;
    }
    createSharedAlbumMutation.mutate();
  };

  const copyShareLink = () => {
    const shareUrl = `${window.location.origin}/shared/${shareCode}`;
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: "Lien copié",
      description: "Le lien de partage a été copié dans le presse-papiers",
    });
  };

  const copyShareCode = () => {
    navigator.clipboard.writeText(shareCode);
    toast({
      title: "Code copié",
      description: "Le code de partage a été copié dans le presse-papiers",
    });
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setAllowUploads(true);
    setShareCode("");
    setIsCreated(false);
  };

  const handleClose = () => {
    setOpen(false);
    setTimeout(resetForm, 300); // Reset after animation
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            {isCreated ? "Album Partagé Créé" : "Créer un Album Partagé"}
          </DialogTitle>
        </DialogHeader>

        {!isCreated ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titre de l'album</Label>
              <Input
                id="title"
                placeholder="Ex: Voyage en Italie 2025"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optionnel)</Label>
              <Textarea
                id="description"
                placeholder="Décrivez votre album partagé..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Autoriser les contributions</Label>
                <p className="text-sm text-gray-500">
                  Les participants peuvent ajouter des photos
                </p>
              </div>
              <Switch
                checked={allowUploads}
                onCheckedChange={setAllowUploads}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={createSharedAlbumMutation.isPending}
                className="flex-1"
              >
                {createSharedAlbumMutation.isPending ? "Création..." : "Créer l'album"}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  {title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Lien de partage</Label>
                  <div className="flex gap-2">
                    <Input
                      value={`${window.location.origin}/shared/${shareCode}`}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={copyShareLink}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Code de partage</Label>
                  <div className="flex gap-2">
                    <Input
                      value={shareCode}
                      readOnly
                      className="font-mono text-lg font-bold text-center tracking-wider"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={copyShareCode}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Comment partager :</strong>
                  </p>
                  <ul className="text-sm text-blue-700 mt-1 space-y-1">
                    <li>• Envoyez le lien directement</li>
                    <li>• Partagez le code pour saisie manuelle</li>
                    <li>• {allowUploads ? "Les participants peuvent ajouter des photos" : "Album en lecture seule"}</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={handleClose}
              className="w-full"
            >
              Terminé
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}