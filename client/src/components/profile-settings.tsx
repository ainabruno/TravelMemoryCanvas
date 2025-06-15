import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  User, 
  Camera, 
  Shield, 
  Bell, 
  Eye, 
  Globe, 
  Lock, 
  Save,
  Upload,
  Trash2,
  Link as LinkIcon
} from "lucide-react";

const profileFormSchema = z.object({
  displayName: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  username: z.string().min(3, "Le nom d'utilisateur doit contenir au moins 3 caractères"),
  bio: z.string().max(300, "La bio ne peut pas dépasser 300 caractères").optional(),
  location: z.string().optional(),
  website: z.string().url("URL invalide").optional().or(z.literal("")),
});

const privacyFormSchema = z.object({
  privacy: z.enum(["public", "friends", "private"]),
  showEmail: z.boolean(),
  showLocation: z.boolean(),
  showActivity: z.boolean(),
  allowMessages: z.boolean(),
  allowFollows: z.boolean(),
});

const notificationFormSchema = z.object({
  emailNotifications: z.boolean(),
  pushNotifications: z.boolean(),
  commentNotifications: z.boolean(),
  likeNotifications: z.boolean(),
  followNotifications: z.boolean(),
  albumInviteNotifications: z.boolean(),
});

interface ProfileSettingsProps {
  userId: string;
}

export default function ProfileSettings({ userId }: ProfileSettingsProps) {
  const [activeTab, setActiveTab] = useState("profile");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current profile
  const { data: profile, isLoading } = useQuery({
    queryKey: ['/api/users', userId, 'profile'],
    queryFn: () => apiRequest('GET', `/api/users/${userId}/profile`).then(res => res.json()),
  });

  // Profile form
  const profileForm = useForm({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      displayName: profile?.displayName || "",
      username: profile?.username || "",
      bio: profile?.bio || "",
      location: profile?.location || "",
      website: profile?.website || "",
    },
  });

  // Privacy form
  const privacyForm = useForm({
    resolver: zodResolver(privacyFormSchema),
    defaultValues: {
      privacy: profile?.privacy || "public",
      showEmail: true,
      showLocation: true,
      showActivity: true,
      allowMessages: true,
      allowFollows: true,
    },
  });

  // Notification form
  const notificationForm = useForm({
    resolver: zodResolver(notificationFormSchema),
    defaultValues: {
      emailNotifications: true,
      pushNotifications: true,
      commentNotifications: true,
      likeNotifications: true,
      followNotifications: true,
      albumInviteNotifications: true,
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('PUT', `/api/users/${userId}/profile`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users', userId] });
      toast({
        title: "Profil mis à jour",
        description: "Vos informations de profil ont été mises à jour avec succès",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le profil",
        variant: "destructive",
      });
    },
  });

  // Upload avatar mutation
  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('avatar', file);
      const response = await apiRequest('POST', `/api/users/${userId}/avatar`, formData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users', userId] });
      toast({
        title: "Avatar mis à jour",
        description: "Votre photo de profil a été mise à jour",
      });
    },
  });

  const handleProfileSubmit = (data: any) => {
    updateProfileMutation.mutate(data);
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadAvatarMutation.mutate(file);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <User className="w-6 h-6" />
        <h1 className="text-2xl font-bold">Paramètres du profil</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Profil</TabsTrigger>
          <TabsTrigger value="privacy">Confidentialité</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="account">Compte</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Informations personnelles
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center gap-6">
                <div className="relative">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={profile?.avatar} alt={profile?.displayName} />
                    <AvatarFallback className="bg-blue-100 text-blue-600 text-2xl">
                      {profile?.displayName?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="font-medium">Photo de profil</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Cliquez sur la photo pour la modifier
                  </p>
                  <Button variant="outline" size="sm">
                    <Upload className="w-4 h-4 mr-2" />
                    Changer la photo
                  </Button>
                </div>
              </div>

              {/* Profile Form */}
              <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Nom d'affichage</Label>
                    <Input
                      id="displayName"
                      {...profileForm.register("displayName")}
                      placeholder="Votre nom d'affichage"
                    />
                    {profileForm.formState.errors.displayName && (
                      <p className="text-sm text-red-600">
                        {profileForm.formState.errors.displayName.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="username">Nom d'utilisateur</Label>
                    <Input
                      id="username"
                      {...profileForm.register("username")}
                      placeholder="@votrenom"
                    />
                    {profileForm.formState.errors.username && (
                      <p className="text-sm text-red-600">
                        {profileForm.formState.errors.username.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Biographie</Label>
                  <Textarea
                    id="bio"
                    {...profileForm.register("bio")}
                    placeholder="Parlez-nous de vous..."
                    rows={3}
                  />
                  {profileForm.formState.errors.bio && (
                    <p className="text-sm text-red-600">
                      {profileForm.formState.errors.bio.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="location">Localisation</Label>
                    <Input
                      id="location"
                      {...profileForm.register("location")}
                      placeholder="Votre ville, pays"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website">Site web</Label>
                    <Input
                      id="website"
                      {...profileForm.register("website")}
                      placeholder="https://votre-site.com"
                    />
                    {profileForm.formState.errors.website && (
                      <p className="text-sm text-red-600">
                        {profileForm.formState.errors.website.message}
                      </p>
                    )}
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={updateProfileMutation.isPending}
                  className="w-full md:w-auto"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {updateProfileMutation.isPending ? "Enregistrement..." : "Enregistrer les modifications"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Paramètres de confidentialité
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Visibilité du profil</Label>
                  <Select defaultValue="public">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4" />
                          Public - Visible par tous
                        </div>
                      </SelectItem>
                      <SelectItem value="friends">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Amis - Visible par vos amis uniquement
                        </div>
                      </SelectItem>
                      <SelectItem value="private">
                        <div className="flex items-center gap-2">
                          <Lock className="w-4 h-4" />
                          Privé - Visible par vous uniquement
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Informations visibles</h4>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Adresse email</Label>
                      <p className="text-sm text-gray-600">Permettre aux autres de voir votre email</p>
                    </div>
                    <Switch defaultChecked={false} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Localisation</Label>
                      <p className="text-sm text-gray-600">Afficher votre localisation sur votre profil</p>
                    </div>
                    <Switch defaultChecked={true} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Activité récente</Label>
                      <p className="text-sm text-gray-600">Montrer votre activité récente</p>
                    </div>
                    <Switch defaultChecked={true} />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Interactions</h4>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Autoriser les messages</Label>
                      <p className="text-sm text-gray-600">Permettre aux autres de vous envoyer des messages</p>
                    </div>
                    <Switch defaultChecked={true} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Autoriser les abonnements</Label>
                      <p className="text-sm text-gray-600">Permettre aux autres de vous suivre</p>
                    </div>
                    <Switch defaultChecked={true} />
                  </div>
                </div>
              </div>

              <Button className="w-full md:w-auto">
                <Save className="w-4 h-4 mr-2" />
                Enregistrer les paramètres
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Préférences de notification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-4">
                  <h4 className="font-medium">Notifications par email</h4>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Nouveaux commentaires</Label>
                      <p className="text-sm text-gray-600">Recevoir un email pour les nouveaux commentaires</p>
                    </div>
                    <Switch defaultChecked={true} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Nouveaux likes</Label>
                      <p className="text-sm text-gray-600">Recevoir un email pour les nouveaux likes</p>
                    </div>
                    <Switch defaultChecked={false} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Nouveaux abonnés</Label>
                      <p className="text-sm text-gray-600">Recevoir un email quand quelqu'un vous suit</p>
                    </div>
                    <Switch defaultChecked={true} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Invitations d'album</Label>
                      <p className="text-sm text-gray-600">Recevoir un email pour les invitations d'album</p>
                    </div>
                    <Switch defaultChecked={true} />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Notifications push</h4>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Activité en temps réel</Label>
                      <p className="text-sm text-gray-600">Notifications instantanées pour l'activité</p>
                    </div>
                    <Switch defaultChecked={true} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Résumé hebdomadaire</Label>
                      <p className="text-sm text-gray-600">Résumé de votre activité chaque semaine</p>
                    </div>
                    <Switch defaultChecked={true} />
                  </div>
                </div>
              </div>

              <Button className="w-full md:w-auto">
                <Save className="w-4 h-4 mr-2" />
                Enregistrer les préférences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Gestion du compte
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
                  <h4 className="font-medium text-red-800 mb-2">Zone de danger</h4>
                  <p className="text-sm text-red-700 mb-4">
                    Ces actions sont irréversibles. Assurez-vous de bien comprendre les conséquences.
                  </p>
                  
                  <div className="space-y-3">
                    <Button variant="outline" className="text-red-600 border-red-300 hover:bg-red-50">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Supprimer toutes les photos
                    </Button>
                    
                    <Button variant="destructive">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Supprimer le compte
                    </Button>
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