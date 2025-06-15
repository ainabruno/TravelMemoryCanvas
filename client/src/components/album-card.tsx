import { Card, CardContent } from "@/components/ui/card";

interface AlbumCardProps {
  album: {
    id: number;
    title: string;
    description: string;
    coverPhotoUrl: string | null;
    tripId: number | null;
    photoCount: number;
  };
}

export default function AlbumCard({ album }: AlbumCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
      <div className="relative">
        <img 
          src={album.coverPhotoUrl || "https://images.unsplash.com/photo-1551632811-561732d1e306?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300"} 
          alt={album.title}
          className="w-full h-32 object-cover"
        />
        <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
          {album.photoCount}
        </div>
      </div>
      <CardContent className="p-4">
        <h4 className="font-semibold text-slate-900 text-sm mb-1">{album.title}</h4>
        <p className="text-xs text-slate-600">{album.description}</p>
      </CardContent>
    </Card>
  );
}
