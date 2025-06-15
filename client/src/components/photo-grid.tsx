import { Skeleton } from "@/components/ui/skeleton";
import { Edit, Share } from "lucide-react";

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

interface PhotoGridProps {
  photos: Photo[];
  loading: boolean;
  onEdit: (photo: Photo) => void;
  onShare: (photo: Photo) => void;
}

export default function PhotoGrid({ photos, loading, onEdit, onShare }: PhotoGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {[...Array(12)].map((_, i) => (
          <Skeleton key={i} className="w-full aspect-square rounded-lg" />
        ))}
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">No photos uploaded yet. Start by uploading your travel memories!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
      {photos.map((photo) => (
        <div 
          key={photo.id} 
          className="photo-item group cursor-pointer relative overflow-hidden rounded-lg"
        >
          <img 
            src={photo.url || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300"} 
            alt={photo.caption || photo.originalName}
            className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex space-x-2">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(photo);
                }}
                className="bg-white text-slate-700 p-2 rounded-full hover:bg-slate-100"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onShare(photo);
                }}
                className="bg-white text-slate-700 p-2 rounded-full hover:bg-slate-100"
              >
                <Share className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
