import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Activity, Camera, MessageCircle, Heart, UserPlus, Edit3, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface ActivityFeedProps {
  albumId: number;
  className?: string;
}

const actionIcons = {
  photo_added: Camera,
  photo_edited: Edit3,
  photo_deleted: Trash2,
  comment_added: MessageCircle,
  reaction_added: Heart,
  contributor_joined: UserPlus,
  contributor_left: UserPlus,
};

const actionColors = {
  photo_added: "bg-green-100 text-green-600",
  photo_edited: "bg-blue-100 text-blue-600",
  photo_deleted: "bg-red-100 text-red-600",
  comment_added: "bg-purple-100 text-purple-600",
  reaction_added: "bg-pink-100 text-pink-600",
  contributor_joined: "bg-orange-100 text-orange-600",
  contributor_left: "bg-gray-100 text-gray-600",
};

export default function ActivityFeed({ albumId, className = "" }: ActivityFeedProps) {
  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['/api/albums', albumId, 'activity'],
    queryFn: () => apiRequest('GET', `/api/albums/${albumId}/activity`).then(res => res.json()),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Activité Récente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Activité Récente
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Activity className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">Aucune activité récente</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {activities.map((activity: any) => {
              const ActionIcon = actionIcons[activity.action as keyof typeof actionIcons] || Activity;
              const colorClass = actionColors[activity.action as keyof typeof actionColors] || "bg-gray-100 text-gray-600";

              return (
                <div key={activity.id} className="flex gap-3 items-start">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${colorClass}`}>
                    <ActionIcon className="w-4 h-4" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm text-gray-900">
                        {activity.contributorName}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(activity.createdAt), { 
                          addSuffix: true, 
                          locale: fr 
                        })}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {activity.description}
                    </p>

                    {activity.metadata && (
                      <div className="mt-2">
                        {(() => {
                          try {
                            const metadata = typeof activity.metadata === 'string' 
                              ? JSON.parse(activity.metadata) 
                              : activity.metadata;
                            
                            if (metadata.photoName) {
                              return (
                                <Badge variant="secondary" className="text-xs">
                                  📸 {metadata.photoName}
                                </Badge>
                              );
                            }
                            
                            if (metadata.reaction) {
                              return (
                                <Badge variant="secondary" className="text-xs">
                                  {metadata.reaction === 'like' && '👍'}
                                  {metadata.reaction === 'love' && '❤️'}
                                  {metadata.reaction === 'laugh' && '😄'}
                                  {metadata.reaction === 'wow' && '😮'}
                                  {metadata.reaction}
                                </Badge>
                              );
                            }
                          } catch (e) {
                            return null;
                          }
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}