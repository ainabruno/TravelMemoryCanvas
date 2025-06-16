import { useQuery } from "@tanstack/react-query";
import NavigationMenu from "@/components/navigation-menu";
import AppFooter from "@/components/app-footer";
import PhotoUploadZone from "@/components/photo-upload-zone";
import TripCard from "@/components/trip-card";
import AlbumCard from "@/components/album-card";
import PhotoGrid from "@/components/photo-grid";
import MobileNav from "@/components/mobile-nav";
import PhotoEditModal from "@/components/photo-edit-modal";
import ShareModal from "@/components/share-modal";
import SharedAlbumModal from "@/components/shared-album-modal";
import JoinSharedAlbum from "@/components/join-shared-album";
import ActivityFeed from "@/components/activity-feed";
import NotificationCenter from "@/components/notification-center";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TripMap from "@/components/trip-map";
import { Camera, Images, Globe, Share, Map, Users, UserPlus, TrendingUp, Star, Heart, MapPin, Calendar, Sparkles, ArrowRight, Plus, Crown, ShoppingBag, DollarSign } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";

interface Stats {
  totalTrips: number;
  totalPhotos: number;
  totalCountries: number;
  sharedPosts: number;
}

interface TripWithCount {
  id: number;
  title: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string | null;
  coverPhotoUrl: string | null;
  photoCount: number;
}

interface AlbumWithCount {
  id: number;
  title: string;
  description: string;
  coverPhotoUrl: string | null;
  tripId: number | null;
  photoCount: number;
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

export default function Home() {
  const [, navigate] = useLocation();
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const { data: stats, isLoading: statsLoading } = useQuery<Stats>({
    queryKey: ["/api/stats"],
  });

  const { data: trips = [], isLoading: tripsLoading } = useQuery<TripWithCount[]>({
    queryKey: ["/api/trips"],
  });

  const { data: albums = [], isLoading: albumsLoading } = useQuery<AlbumWithCount[]>({
    queryKey: ["/api/albums"],
  });

  const { data: photos = [], isLoading: photosLoading } = useQuery<Photo[]>({
    queryKey: ["/api/photos"],
  });

  const handlePhotoEdit = (photo: Photo) => {
    setSelectedPhoto(photo);
    setShowEditModal(true);
  };

  const handlePhotoShare = (photo: Photo) => {
    setSelectedPhoto(photo);
    setShowShareModal(true);
  };

  const handleEditToShare = () => {
    setShowEditModal(false);
    setShowShareModal(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <NavigationMenu />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 md:pb-8">
        {/* Hero Section */}
        <div className="mb-12">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 text-white p-8 lg:p-12 mb-8">
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                  <Sparkles className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-4xl lg:text-5xl font-bold mb-2">Wanderlust</h1>
                  <p className="text-xl text-blue-100">Vos souvenirs de voyage, magnifiés par l'IA</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div>
                  <p className="text-lg text-blue-100 mb-6 leading-relaxed">
                    Organisez, éditez et partagez vos plus beaux souvenirs de voyage avec notre plateforme intelligente. 
                    De l'anonymisation automatique à la génération de vidéos, découvrez une nouvelle façon de revivre vos aventures.
                  </p>
                  
                  <div className="flex flex-wrap gap-3">
                    <div className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full backdrop-blur-sm">
                      <Camera className="w-4 h-4" />
                      <span className="text-sm font-medium">Photos IA</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full backdrop-blur-sm">
                      <Users className="w-4 h-4" />
                      <span className="text-sm font-medium">Collaboration</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full backdrop-blur-sm">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm font-medium">Géolocalisation</span>
                    </div>
                  </div>
                </div>
                
                <div className="hidden lg:block">
                  <div className="relative">
                    <div className="absolute -top-4 -right-4 w-32 h-32 bg-yellow-400/30 rounded-full blur-2xl"></div>
                    <div className="absolute -bottom-4 -left-4 w-40 h-40 bg-pink-400/30 rounded-full blur-2xl"></div>
                    <div className="relative grid grid-cols-2 gap-4">
                      <div className="space-y-4">
                        <div className="h-24 bg-white/20 rounded-2xl backdrop-blur-sm flex items-center justify-center">
                          <Globe className="w-8 h-8 text-blue-200" />
                        </div>
                        <div className="h-32 bg-white/20 rounded-2xl backdrop-blur-sm flex items-center justify-center">
                          <Share className="w-10 h-10 text-purple-200" />
                        </div>
                      </div>
                      <div className="space-y-4 mt-8">
                        <div className="h-32 bg-white/20 rounded-2xl backdrop-blur-sm flex items-center justify-center">
                          <Images className="w-10 h-10 text-indigo-200" />
                        </div>
                        <div className="h-24 bg-white/20 rounded-2xl backdrop-blur-sm flex items-center justify-center">
                          <Star className="w-8 h-8 text-yellow-200" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="hover:shadow-lg transition-all duration-300 border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-2 bg-blue-500/10 rounded-xl">
                        <Camera className="w-5 h-5 text-blue-600" />
                      </div>
                      <span className="text-sm font-medium text-blue-700">Voyages</span>
                    </div>
                    {statsLoading ? (
                      <Skeleton className="h-8 w-12 mb-1" />
                    ) : (
                      <p className="text-3xl font-bold text-blue-900">{stats?.totalTrips || 0}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-green-600 text-sm">
                      <TrendingUp className="w-4 h-4" />
                      <span>+12%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300 border-0 shadow-sm bg-gradient-to-br from-green-50 to-emerald-100/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-2 bg-green-500/10 rounded-xl">
                        <Images className="w-5 h-5 text-green-600" />
                      </div>
                      <span className="text-sm font-medium text-green-700">Photos</span>
                    </div>
                    {statsLoading ? (
                      <Skeleton className="h-8 w-12 mb-1" />
                    ) : (
                      <p className="text-3xl font-bold text-green-900">{stats?.totalPhotos || 0}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-green-600 text-sm">
                      <TrendingUp className="w-4 h-4" />
                      <span>+24%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300 border-0 shadow-sm bg-gradient-to-br from-purple-50 to-violet-100/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-2 bg-purple-500/10 rounded-xl">
                        <Globe className="w-5 h-5 text-purple-600" />
                      </div>
                      <span className="text-sm font-medium text-purple-700">Pays</span>
                    </div>
                    {statsLoading ? (
                      <Skeleton className="h-8 w-12 mb-1" />
                    ) : (
                      <p className="text-3xl font-bold text-purple-900">{stats?.totalCountries || 0}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-green-600 text-sm">
                      <TrendingUp className="w-4 h-4" />
                      <span>+8%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300 border-0 shadow-sm bg-gradient-to-br from-orange-50 to-amber-100/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-2 bg-orange-500/10 rounded-xl">
                        <Heart className="w-5 h-5 text-orange-600" />
                      </div>
                      <span className="text-sm font-medium text-orange-700">Partages</span>
                    </div>
                    {statsLoading ? (
                      <Skeleton className="h-8 w-12 mb-1" />
                    ) : (
                      <p className="text-3xl font-bold text-orange-900">{stats?.sharedPosts || 0}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-green-600 text-sm">
                      <TrendingUp className="w-4 h-4" />
                      <span>+16%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="group relative p-6 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 hover:border-blue-200">
              <div className="flex flex-col items-center text-center">
                <div className="p-3 bg-blue-50 rounded-2xl mb-3 group-hover:bg-blue-100 transition-colors">
                  <Plus className="w-6 h-6 text-blue-600" />
                </div>
                <span className="font-medium text-gray-900">Nouveau Voyage</span>
                <span className="text-sm text-gray-500 mt-1">Créer un voyage</span>
              </div>
            </button>

            <button className="group relative p-6 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 hover:border-green-200">
              <div className="flex flex-col items-center text-center">
                <div className="p-3 bg-green-50 rounded-2xl mb-3 group-hover:bg-green-100 transition-colors">
                  <Camera className="w-6 h-6 text-green-600" />
                </div>
                <span className="font-medium text-gray-900">Importer Photos</span>
                <span className="text-sm text-gray-500 mt-1">Ajouter des souvenirs</span>
              </div>
            </button>

            <button className="group relative p-6 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 hover:border-purple-200">
              <div className="flex flex-col items-center text-center">
                <div className="p-3 bg-purple-50 rounded-2xl mb-3 group-hover:bg-purple-100 transition-colors">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <span className="font-medium text-gray-900">Album Partagé</span>
                <span className="text-sm text-gray-500 mt-1">Collaborer</span>
              </div>
            </button>

            <button className="group relative p-6 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 hover:border-orange-200">
              <div className="flex flex-col items-center text-center">
                <div className="p-3 bg-orange-50 rounded-2xl mb-3 group-hover:bg-orange-100 transition-colors">
                  <Sparkles className="w-6 h-6 text-orange-600" />
                </div>
                <span className="font-medium text-gray-900">IA Créative</span>
                <span className="text-sm text-gray-500 mt-1">Générer du contenu</span>
              </div>
            </button>
          </div>
        </div>

        {/* New Monetization Features */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Fonctionnalités Premium</h2>
              <p className="text-gray-600">Débloquez tout le potentiel de Wanderlust</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div 
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-6 cursor-pointer hover:scale-105 transition-all duration-300"
              onClick={() => navigate('/subscription')}
            >
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                    <Crown className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold">Plans Premium</h3>
                </div>
                <p className="text-indigo-100 mb-4">
                  Accédez à toutes les fonctionnalités IA, stockage illimité et collaboration avancée
                </p>
                <div className="flex items-center gap-2 text-sm">
                  <span>À partir de 9,99€/mois</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
            </div>

            <div 
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white p-6 cursor-pointer hover:scale-105 transition-all duration-300"
              onClick={() => navigate('/marketplace')}
            >
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold">Marketplace</h3>
                </div>
                <p className="text-emerald-100 mb-4">
                  Achetez et vendez des guides, vidéos et livres photo créés par la communauté
                </p>
                <div className="flex items-center gap-2 text-sm">
                  <span>Découvrir les créations</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
            </div>

            <div 
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white p-6 cursor-pointer hover:scale-105 transition-all duration-300"
              onClick={() => navigate('/affiliate')}
            >
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                    <DollarSign className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold">Programme d'Affiliation</h3>
                </div>
                <p className="text-amber-100 mb-4">
                  Gagnez 20% de commission en recommandant Wanderlust à vos amis
                </p>
                <div className="flex items-center gap-2 text-sm">
                  <span>Commencer à gagner</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
            </div>
          </div>
        </div>

        {/* Photo Upload Zone */}
        <PhotoUploadZone />

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="mb-8">
          <TabsList className="grid w-full grid-cols-4 bg-white/80 backdrop-blur-sm">
            <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="map" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Carte</TabsTrigger>
            <TabsTrigger value="photos" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Photos</TabsTrigger>
            <TabsTrigger value="albums" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Albums</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-8">
            {/* Recent Trips */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-1">Voyages Récents</h3>
                  <p className="text-gray-600">Vos dernières aventures de voyage</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl font-medium transition-colors">
                  Voir tout
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

          {tripsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <Skeleton className="w-full h-48" />
                  <CardContent className="p-6">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full mb-4" />
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-4 w-1/4" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trips.slice(0, 3).map((trip) => (
                <TripCard key={trip.id} trip={trip} />
              ))}
            </div>
          )}
        </div>

        {/* Featured Albums */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-2xl font-bold text-slate-900 mb-1">Albums en Vedette</h3>
              <p className="text-gray-600">Vos collections de photos favorites</p>
            </div>
            <div className="flex gap-2">
              <SharedAlbumModal>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl text-sm font-medium transition-colors">
                  <Users className="w-4 h-4" />
                  Album Partagé
                </button>
              </SharedAlbumModal>
              <JoinSharedAlbum>
                <button className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-xl text-sm font-medium transition-colors">
                  <UserPlus className="w-4 h-4" />
                  Rejoindre
                </button>
              </JoinSharedAlbum>
              <button className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-600 hover:bg-purple-100 rounded-xl font-medium transition-colors">
                <Plus className="w-4 h-4" />
                Créer Album
              </button>
            </div>
          </div>

          {albumsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <Skeleton className="w-full h-32" />
                  <CardContent className="p-4">
                    <Skeleton className="h-4 w-3/4 mb-1" />
                    <Skeleton className="h-3 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {albums.slice(0, 4).map((album) => (
                <AlbumCard key={album.id} album={album} />
              ))}
            </div>
          )}
        </div>

        {/* Recent Photos */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-2xl font-bold text-slate-900 mb-1">Photos Récentes</h3>
              <p className="text-gray-600">Vos derniers souvenirs capturés</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 bg-gray-50 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors">
                <Images className="w-5 h-5" />
              </button>
              <button className="p-2 bg-gray-50 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors">
                <Calendar className="w-5 h-5" />
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl font-medium transition-colors">
                Voir tout
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <PhotoGrid 
            photos={photos.slice(0, 12)} 
            loading={photosLoading}
            onEdit={handlePhotoEdit}
            onShare={handlePhotoShare}
          />
        </div>
          </TabsContent>
          
          <TabsContent value="map" className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Carte de Voyage Interactive</h3>
              <p className="text-slate-600">Explorez vos photos et voyages sur une carte interactive</p>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <TripMap 
                photos={photos}
                height="600px"
                className="rounded-xl overflow-hidden"
              />
            </div>
          </TabsContent>
          
          <TabsContent value="photos" className="space-y-4">
            <PhotoGrid 
              photos={photos} 
              loading={photosLoading}
              onEdit={handlePhotoEdit}
              onShare={handlePhotoShare}
            />
          </TabsContent>
          
          <TabsContent value="albums" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {albumsLoading ? (
                [...Array(4)].map((_, i) => (
                  <Card key={i}>
                    <Skeleton className="w-full h-32" />
                    <CardContent className="p-4">
                      <Skeleton className="h-4 w-3/4 mb-2" />
                      <Skeleton className="h-3 w-1/2" />
                    </CardContent>
                  </Card>
                ))
              ) : (
                albums.slice(0, 8).map((album) => (
                  <AlbumCard key={album.id} album={album} />
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <MobileNav />
      
      {/* Modals */}
      <PhotoEditModal 
        photo={selectedPhoto}
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        onShare={handleEditToShare}
      />
      
      <ShareModal
        photo={selectedPhoto}
        open={showShareModal}
        onClose={() => setShowShareModal(false)}
      />
      
      <AppFooter />
    </div>
  );
}
