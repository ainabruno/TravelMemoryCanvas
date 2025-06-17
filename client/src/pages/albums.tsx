import { useQuery } from "@tanstack/react-query";
import PageLayout from "@/components/page-layout";
import AlbumCard from "@/components/album-card";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Plus, Images } from "lucide-react";

interface AlbumWithCount {
  id: number;
  title: string;
  description: string;
  coverPhotoUrl: string | null;
  tripId: number | null;
  photoCount: number;
}

export default function AlbumsPage() {
  const { data: albums = [], isLoading: albumsLoading } = useQuery<AlbumWithCount[]>({
    queryKey: ["/api/albums"],
  });

  return (
    <PageLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Mes Albums</h1>
              <p className="text-gray-600">Organisez vos souvenirs de voyage par collections</p>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Nouvel Album
            </Button>
          </div>

          {/* Albums Grid */}
          {albumsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {[...Array(8)].map((_, i) => (
                <Card key={i}>
                  <Skeleton className="w-full h-40 sm:h-48" />
                  <CardContent className="p-3 sm:p-4">
                    <Skeleton className="h-5 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : albums.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {albums.map((album) => (
                <AlbumCard key={album.id} album={album} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 px-4">
              <Images className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg sm:text-xl font-semibold text-gray-700 mb-2">Aucun album</h3>
              <p className="text-gray-500 mb-6 text-sm sm:text-base">Créez votre premier album pour organiser vos photos</p>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Créer un album
              </Button>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}