import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  User, 
  MapPin, 
  Calendar, 
  Globe, 
  Camera, 
  Heart, 
  MessageCircle, 
  Share2, 
  Trophy, 
  Star,
  Users,
  Edit,
  Settings,
  UserPlus,
  UserMinus,
  Shield,
  Award,
  Target,
  TrendingUp
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface UserProfileProps {
  userId: string;
  isOwnProfile?: boolean;
}

interface UserProfile {
  id: number;
  userId: string;
  username: string;
  displayName: string;
  bio?: string;
  avatar?: string;
  coverPhoto?: string;
  location?: string;
  website?: string;
  socialLinks?: string;
  preferences?: string;
  privacy: string;
  isVerified: boolean;
  joinedAt: string;
  lastActiveAt: string;
}

interface UserStats {
  totalPhotos: number;
  totalTrips: number;
  totalAlbums: number;
  totalCountries: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  featuredPhotos: number;
}

interface Achievement {
  id: number;
  achievementType: string;
  title: string;
  description: string;
  icon: string;
  progress: number;
  maxProgress: number;
  isCompleted: boolean;
  completedAt?: string;
}

const achievementIcons: Record<string, any> = {
  photographer: Camera,
  explorer: MapPin,
  collaborator: Users,
  social: Heart,
  collector: Trophy,
  adventurer: Target,
};

export default function UserProfile({ userId, isOwnProfile = false }: UserProfileProps) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['/api/users', userId, 'profile'],
    queryFn: () => apiRequest('GET', `/api/users/${userId}/profile`).then(res => res.json()),
  });

  // Fetch user stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/users', userId, 'stats'],
    queryFn: () => apiRequest('GET', `/api/users/${userId}/stats`).then(res => res.json()),
  });

  // Fetch user achievements
  const { data: achievements = [], isLoading: achievementsLoading } = useQuery({
    queryKey: ['/api/users', userId, 'achievements'],
    queryFn: () => apiRequest('GET', `/api/users/${userId}/achievements`).then(res => res.json()),
  });

  // Fetch user photos
  const { data: photos = [], isLoading: photosLoading } = useQuery({
    queryKey: ['/api/users', userId, 'photos'],
    queryFn: () => apiRequest('GET', `/api/users/${userId}/photos`).then(res => res.json()),
  });

  // Follow/unfollow mutation
  const followMutation = useMutation({
    mutationFn: async (action: 'follow' | 'unfollow') => {
      const response = await apiRequest('POST', `/api/users/${userId}/${action}`, {});
      return response.json();
    },
    onSuccess: () => {
      setIsFollowing(!isFollowing);
      queryClient.invalidateQueries({ queryKey: ['/api/users', userId] });
      toast({
        title: isFollowing ? "Utilisateur non suivi" : "Utilisateur suivi",
        description: isFollowing ? "Vous ne suivez plus cet utilisateur" : "Vous suivez maintenant cet utilisateur",
      });
    },
  });

  if (profileLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  const completedAchievements = achievements.filter((a: Achievement) => a.isCompleted);
  const inProgressAchievements = achievements.filter((a: Achievement) => !a.isCompleted);

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card>
        <div className="relative">
          {/* Cover Photo */}
          <div 
            className="h-48 bg-gradient-to-r from-blue-500 to-purple-600 rounded-t-lg"
            style={{
              backgroundImage: profile?.coverPhoto ? `url(${profile.coverPhoto})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div className="absolute inset-0 bg-black bg-opacity-30 rounded-t-lg"></div>
          </div>

          {/* Profile Info */}
          <CardContent className="relative -mt-16 pb-6">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div className="flex flex-col md:flex-row md:items-end gap-4">
                <Avatar className="w-32 h-32 border-4 border-white shadow-lg">
                  <AvatarImage src={profile?.avatar} alt={profile?.displayName} />
                  <AvatarFallback className="bg-blue-100 text-blue-600 text-2xl">
                    {profile?.displayName?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold text-gray-900">{profile?.displayName}</h1>
                    {profile?.isVerified && (
                      <Shield className="w-5 h-5 text-blue-500" />
                    )}
                  </div>
                  <p className="text-gray-600">@{profile?.username}</p>
                  
                  {profile?.bio && (
                    <p className="text-gray-700 max-w-md">{profile.bio}</p>
                  )}

                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    {profile?.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {profile.location}
                      </div>
                    )}
                    {profile?.website && (
                      <div className="flex items-center gap-1">
                        <Globe className="w-4 h-4" />
                        <a href={profile.website} target="_blank" rel="noopener noreferrer" 
                           className="text-blue-600 hover:underline">
                          {profile.website}
                        </a>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Rejoint {formatDistanceToNow(new Date(profile?.joinedAt), { locale: fr })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                {isOwnProfile ? (
                  <Button variant="outline">
                    <Edit className="w-4 h-4 mr-2" />
                    Modifier le profil
                  </Button>
                ) : (
                  <>
                    <Button 
                      variant={isFollowing ? "outline" : "default"}
                      onClick={() => followMutation.mutate(isFollowing ? 'unfollow' : 'follow')}
                      disabled={followMutation.isPending}
                    >
                      {isFollowing ? (
                        <>
                          <UserMinus className="w-4 h-4 mr-2" />
                          Ne plus suivre
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 mr-2" />
                          Suivre
                        </>
                      )}
                    </Button>
                    <Button variant="outline">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Message
                    </Button>
                  </>
                )}
                <Button variant="outline" size="icon">
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </div>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Camera className="w-8 h-8 mx-auto mb-2 text-blue-600" />
            <div className="text-2xl font-bold">{stats?.totalPhotos || 0}</div>
            <div className="text-sm text-gray-600">Photos</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <MapPin className="w-8 h-8 mx-auto mb-2 text-green-600" />
            <div className="text-2xl font-bold">{stats?.totalTrips || 0}</div>
            <div className="text-sm text-gray-600">Voyages</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Globe className="w-8 h-8 mx-auto mb-2 text-purple-600" />
            <div className="text-2xl font-bold">{stats?.totalCountries || 0}</div>
            <div className="text-sm text-gray-600">Pays</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Heart className="w-8 h-8 mx-auto mb-2 text-red-600" />
            <div className="text-2xl font-bold">{stats?.totalLikes || 0}</div>
            <div className="text-sm text-gray-600">J'aime</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="photos">Photos</TabsTrigger>
          <TabsTrigger value="achievements">Trophées</TabsTrigger>
          <TabsTrigger value="activity">Activité</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Activité récente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-gray-600 text-center py-4">
                    Aucune activité récente
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Top Achievements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  Derniers trophées
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {completedAchievements.slice(0, 3).map((achievement: Achievement) => {
                    const IconComponent = achievementIcons[achievement.achievementType] || Award;
                    return (
                      <div key={achievement.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                          <IconComponent className="w-5 h-5 text-yellow-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{achievement.title}</h4>
                          <p className="text-xs text-gray-600">{achievement.description}</p>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          Complété
                        </Badge>
                      </div>
                    );
                  })}
                  
                  {completedAchievements.length === 0 && (
                    <div className="text-sm text-gray-600 text-center py-4">
                      Aucun trophée encore obtenu
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="photos" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Galerie photos</CardTitle>
            </CardHeader>
            <CardContent>
              {photosLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="aspect-square bg-gray-200 rounded-lg animate-pulse"></div>
                  ))}
                </div>
              ) : photos.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {photos.map((photo: any) => (
                    <div key={photo.id} className="aspect-square overflow-hidden rounded-lg">
                      <img
                        src={photo.url}
                        alt={photo.originalName}
                        className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Camera className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Aucune photo à afficher</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-6">
          {/* Completed Achievements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                Trophées obtenus ({completedAchievements.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {completedAchievements.map((achievement: Achievement) => {
                  const IconComponent = achievementIcons[achievement.achievementType] || Award;
                  return (
                    <div key={achievement.id} className="p-4 border rounded-lg bg-yellow-50 border-yellow-200">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                          <IconComponent className="w-6 h-6 text-yellow-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold">{achievement.title}</h4>
                          <p className="text-sm text-gray-600">{achievement.description}</p>
                        </div>
                        <Badge className="bg-yellow-100 text-yellow-800">
                          <Star className="w-3 h-3 mr-1" />
                          Complété
                        </Badge>
                      </div>
                      {achievement.completedAt && (
                        <p className="text-xs text-gray-500">
                          Obtenu {formatDistanceToNow(new Date(achievement.completedAt), { addSuffix: true, locale: fr })}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* In Progress Achievements */}
          {inProgressAchievements.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Trophées en cours ({inProgressAchievements.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {inProgressAchievements.map((achievement: Achievement) => {
                    const IconComponent = achievementIcons[achievement.achievementType] || Award;
                    const progressPercentage = (achievement.progress / achievement.maxProgress) * 100;

                    return (
                      <div key={achievement.id} className="p-4 border rounded-lg">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                            <IconComponent className="w-5 h-5 text-gray-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium">{achievement.title}</h4>
                            <p className="text-sm text-gray-600">{achievement.description}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">
                              {achievement.progress}/{achievement.maxProgress}
                            </div>
                            <div className="text-xs text-gray-500">
                              {Math.round(progressPercentage)}%
                            </div>
                          </div>
                        </div>
                        <Progress value={progressPercentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Activité récente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <TrendingUp className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Aucune activité récente</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}