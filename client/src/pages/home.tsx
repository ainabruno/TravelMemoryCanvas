import { useQuery } from "@tanstack/react-query";
import AppHeader from "@/components/app-header";
import PhotoUploadZone from "@/components/photo-upload-zone";
import TripCard from "@/components/trip-card";
import AlbumCard from "@/components/album-card";
import PhotoGrid from "@/components/photo-grid";
import MobileNav from "@/components/mobile-nav";
import PhotoEditModal from "@/components/photo-edit-modal";
import ShareModal from "@/components/share-modal";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Camera, Images, Globe, Share } from "lucide-react";
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
  uploadedAt: string;
  metadata: string | null;
}

export default function Home() {
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
    <div className="min-h-screen bg-slate-50">
      <AppHeader />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 md:pb-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Your Travel Stories</h2>
            <p className="text-slate-600">Organize, edit, and share your beautiful travel memories</p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    {statsLoading ? (
                      <Skeleton className="h-8 w-12 mb-1" />
                    ) : (
                      <p className="text-2xl font-bold text-slate-900">{stats?.totalTrips || 0}</p>
                    )}
                    <p className="text-sm text-slate-600">Total Trips</p>
                  </div>
                  <Camera className="text-adventure-blue text-xl" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    {statsLoading ? (
                      <Skeleton className="h-8 w-12 mb-1" />
                    ) : (
                      <p className="text-2xl font-bold text-slate-900">{stats?.totalPhotos || 0}</p>
                    )}
                    <p className="text-sm text-slate-600">Photos</p>
                  </div>
                  <Images className="text-nature-green text-xl" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    {statsLoading ? (
                      <Skeleton className="h-8 w-12 mb-1" />
                    ) : (
                      <p className="text-2xl font-bold text-slate-900">{stats?.totalCountries || 0}</p>
                    )}
                    <p className="text-sm text-slate-600">Countries</p>
                  </div>
                  <Globe className="text-wanderlust-purple text-xl" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    {statsLoading ? (
                      <Skeleton className="h-8 w-12 mb-1" />
                    ) : (
                      <p className="text-2xl font-bold text-slate-900">{stats?.sharedPosts || 0}</p>
                    )}
                    <p className="text-sm text-slate-600">Shared</p>
                  </div>
                  <Share className="text-sunset-orange text-xl" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Photo Upload Zone */}
        <PhotoUploadZone />

        {/* Recent Trips */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-slate-900">Recent Trips</h3>
            <button className="text-adventure-blue hover:text-blue-700 font-medium">
              View All →
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
            <h3 className="text-2xl font-bold text-slate-900">Featured Albums</h3>
            <button className="text-adventure-blue hover:text-blue-700 font-medium">
              Create Album +
            </button>
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
            <h3 className="text-2xl font-bold text-slate-900">Recent Photos</h3>
            <div className="flex items-center space-x-2">
              <button className="p-2 text-slate-600 hover:text-adventure-blue hover:bg-blue-50 rounded-lg transition-colors">
                <i className="fas fa-th"></i>
              </button>
              <button className="p-2 text-slate-600 hover:text-adventure-blue hover:bg-blue-50 rounded-lg transition-colors">
                <i className="fas fa-list"></i>
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
    </div>
  );
}
