import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Images, MapPin } from "lucide-react";

interface TripCardProps {
  trip: {
    id: number;
    title: string;
    description: string;
    location: string;
    startDate: string;
    endDate: string | null;
    coverPhotoUrl: string | null;
    photoCount: number;
  };
}

export default function TripCard({ trip }: TripCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      year: 'numeric' 
    });
  };

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
      <div className="relative">
        <img 
          src={trip.coverPhotoUrl || "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400"} 
          alt={trip.title}
          className="w-full h-48 object-cover"
        />
      </div>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-lg font-semibold text-slate-900">{trip.title}</h4>
          <span className="text-sm text-slate-500">{formatDate(trip.startDate)}</span>
        </div>
        <p className="text-slate-600 text-sm mb-4 line-clamp-2">{trip.description}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-slate-500 flex items-center">
              <Images className="w-4 h-4 mr-1" />
              {trip.photoCount} photos
            </span>
            <span className="text-sm text-slate-500 flex items-center">
              <MapPin className="w-4 h-4 mr-1" />
              {trip.location}
            </span>
          </div>
          <button className="text-adventure-blue hover:text-blue-700">
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
