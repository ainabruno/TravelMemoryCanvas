import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Users, MapPin, Calendar, Camera } from "lucide-react";

interface JoinSharedAlbumProps {
  children: React.ReactNode;
}

export default function JoinSharedAlbum({ children }: JoinSharedAlbumProps) {
  const [open, setOpen] = useState(false);
  const [shareCode, setShareCode] = useState("");
  const [contributorName, setContributorName] = useState("");
  const [contributorEmail, setContributorEmail] = useState("");
  const [sharedAlbum, setSharedAlbum] = useState<any>(null);
  const [step, setStep] = useState<"code" | "details" | "success">("code");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: albumData, isLoading: loadingAlbum } = useQuery({
    queryKey: ['/api/albums/shared', shareCode],
    queryFn: () => apiRequest('GET', `/api/albums/shared/${shareCode}`).then(res => res.json()),
    enabled: shareCode.length === 8 && step === "code",
    retry: false,
  });

  const joinAlbumMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/albums/${albumData.id}/contributors`, {
        contributorName,
        contributorEmail,
        role: "contributor",
      });
      return response.json();
    },
    onSuccess: () => {
      setStep("success");
      queryClient.invalidateQueries({ queryKey: ['/api/albums'] });
      toast({
        title: "Succès",
        description: "Vous avez rejoint l'album partagé",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de rejoindre l'album",
        variant: "destructive",
      });
    },
  });

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (shareCode.length !== 8) {
      toast({
        title: "Code invalide",
        description: "Le code de partage doit contenir 8 caractères",
        variant: "destructive",
      });
      return;
    }
    
    if (albumData) {
      setSharedAlbum(albumData);
      setStep("details");
    }
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contributorName.trim()) {
      toast({
        title: "Nom requis",
        description: "Veuillez entrer votre nom",
        variant: "destructive",
      });
      return;
    }
    joinAlbumMutation.mutate();
  };

  const resetForm = () => {
    setShareCode("");
    setContributorName("");
    setContributorEmail("");
    setSharedAlbum(null);
    setStep("code");
  };

  const handleClose = () => {
    setOpen(false);
    setTimeout(resetForm, 300);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Rejoindre un Album Partagé
          </DialogTitle>
        </DialogHeader>

        {step === "code" && (
          <form onSubmit={handleCodeSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="shareCode">Code de partage</Label>
              <Input
                id="shareCode"
                placeholder="Ex: ABC12345"
                value={shareCode}
                onChange={(e) => setShareCode(e.target.value.toUpperCase())}
                maxLength={8}
                className="font-mono text-center text-lg tracking-wider"
              />
              <p className="text-sm text-gray-500">
                Entrez le code de 8 caractères fourni par le propriétaire de l'album
              </p>
            </div>

            {shareCode.length === 8 && loadingAlbum && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-sm text-gray-600 mt-2">Vérification du code...</p>
              </div>
            )}

            {shareCode.length === 8 && albumData && (
              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-green-700">
                    <Users className="w-4 h-4" />
                    <span className="font-medium">Album trouvé : {albumData.title}</span>
                  </div>
                  {albumData.description && (
                    <p className="text-sm text-green-600 mt-1">{albumData.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-xs text-green-600">
                    <span className="flex items-center gap-1">
                      <Camera className="w-3 h-3" />
                      {albumData.photos?.length || 0} photos
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {albumData.contributors?.length || 0} contributeurs
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

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
                disabled={!albumData || loadingAlbum}
                className="flex-1"
              >
                Continuer
              </Button>
            </div>
          </form>
        )}

        {step === "details" && sharedAlbum && (
          <form onSubmit={handleJoinSubmit} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{sharedAlbum.title}</CardTitle>
              </CardHeader>
              <CardContent>
                {sharedAlbum.description && (
                  <p className="text-gray-600 mb-3">{sharedAlbum.description}</p>
                )}
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">
                    {sharedAlbum.photos?.length || 0} photos
                  </Badge>
                  <Badge variant="secondary">
                    {sharedAlbum.contributors?.length || 0} contributeurs
                  </Badge>
                  {sharedAlbum.allowUploads && (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Uploads autorisés
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="contributorName">Votre nom *</Label>
                <Input
                  id="contributorName"
                  placeholder="Ex: Marie Dupont"
                  value={contributorName}
                  onChange={(e) => setContributorName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contributorEmail">Email (optionnel)</Label>
                <Input
                  id="contributorEmail"
                  type="email"
                  placeholder="Ex: marie@exemple.com"
                  value={contributorEmail}
                  onChange={(e) => setContributorEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep("code")}
                className="flex-1"
              >
                Retour
              </Button>
              <Button
                type="submit"
                disabled={joinAlbumMutation.isPending}
                className="flex-1"
              >
                {joinAlbumMutation.isPending ? "Rejoindre..." : "Rejoindre l'album"}
              </Button>
            </div>
          </form>
        )}

        {step === "success" && (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Users className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Album rejoint !</h3>
              <p className="text-gray-600">
                Vous pouvez maintenant voir et contribuer à l'album "{sharedAlbum?.title}"
              </p>
            </div>
            <Button onClick={handleClose} className="w-full">
              Voir l'album
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}