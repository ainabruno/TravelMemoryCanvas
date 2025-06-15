import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity, Camera, MessageCircle, Heart, UserPlus, Edit3, Trash2, Filter, Search, Clock, TrendingUp, Calendar } from "lucide-react";
import { formatDistanceToNow, format, isToday, isYesterday, startOfDay } from "date-fns";
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
  photo_added: "bg-green-100 text-green-600 border-green-200",
  photo_edited: "bg-blue-100 text-blue-600 border-blue-200",
  photo_deleted: "bg-red-100 text-red-600 border-red-200",
  comment_added: "bg-purple-100 text-purple-600 border-purple-200",
  reaction_added: "bg-pink-100 text-pink-600 border-pink-200",
  contributor_joined: "bg-orange-100 text-orange-600 border-orange-200",
  contributor_left: "bg-gray-100 text-gray-600 border-gray-200",
};

const actionLabels = {
  photo_added: "Photo ajoutée",
  photo_edited: "Photo modifiée",
  photo_deleted: "Photo supprimée", 
  comment_added: "Commentaire ajouté",
  reaction_added: "Réaction ajoutée",
  contributor_joined: "Membre rejoint",
  contributor_left: "Membre parti",
};

export default function ActivityFeed({ albumId, className = "" }: ActivityFeedProps) {
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [timeFilter, setTimeFilter] = useState("all");

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['/api/albums', albumId, 'activity'],
    queryFn: () => apiRequest('GET', `/api/albums/${albumId}/activity`).then(res => res.json()),
    refetchInterval: 10000, // Refresh every 10 seconds for real-time updates
  });

  // Filter and search activities
  const filteredActivities = activities.filter((activity: any) => {
    const matchesSearch = !searchTerm || 
      activity.contributorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filter === "all" || activity.action === filter;

    const activityDate = new Date(activity.createdAt);
    let matchesTime = true;
    
    if (timeFilter === "today") {
      matchesTime = isToday(activityDate);
    } else if (timeFilter === "yesterday") {
      matchesTime = isYesterday(activityDate);
    } else if (timeFilter === "week") {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      matchesTime = activityDate >= weekAgo;
    }

    return matchesSearch && matchesFilter && matchesTime;
  });

  // Group activities by date
  const groupedActivities = filteredActivities.reduce((groups: any, activity: any) => {
    const date = startOfDay(new Date(activity.createdAt)).toISOString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(activity);
    return groups;
  }, {});

  // Get activity stats
  const stats = activities.reduce((acc: any, activity: any) => {
    acc[activity.action] = (acc[activity.action] || 0) + 1;
    return acc;
  }, {});

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

  const formatDateHeader = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) {
      return "Aujourd'hui";
    } else if (isYesterday(date)) {
      return "Hier";
    } else {
      return format(date, "EEEE d MMMM", { locale: fr });
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Flux d'Activité
            <Badge variant="secondary" className="ml-2">
              {activities.length}
            </Badge>
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setFilter("all");
              setSearchTerm("");
              setTimeFilter("all");
            }}
          >
            Réinitialiser
          </Button>
        </div>

        {/* Activity Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {Object.entries(stats).map(([action, count]) => {
            const ActionIcon = actionIcons[action as keyof typeof actionIcons] || Activity;
            const colorClass = actionColors[action as keyof typeof actionColors] || "bg-gray-100 text-gray-600";
            
            return (
              <div key={action} className={`p-3 rounded-lg border ${colorClass} cursor-pointer transition-all hover:scale-105`} 
                   onClick={() => setFilter(filter === action ? "all" : action)}>
                <div className="flex items-center gap-2">
                  <ActionIcon className="w-4 h-4" />
                  <div>
                    <div className="text-lg font-bold">{count as number}</div>
                    <div className="text-xs opacity-75">
                      {actionLabels[action as keyof typeof actionLabels]}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-500" />
            <Input
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-40"
            />
          </div>
          
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-40">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Type d'action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les actions</SelectItem>
              <SelectItem value="photo_added">Photos ajoutées</SelectItem>
              <SelectItem value="comment_added">Commentaires</SelectItem>
              <SelectItem value="reaction_added">Réactions</SelectItem>
              <SelectItem value="contributor_joined">Nouveaux membres</SelectItem>
            </SelectContent>
          </Select>

          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className="w-32">
              <Clock className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Période" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tout</SelectItem>
              <SelectItem value="today">Aujourd'hui</SelectItem>
              <SelectItem value="yesterday">Hier</SelectItem>
              <SelectItem value="week">Cette semaine</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        {filteredActivities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Activity className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">
              {activities.length === 0 
                ? "Aucune activité récente" 
                : "Aucune activité correspondant aux filtres"
              }
            </p>
            {(filter !== "all" || searchTerm || timeFilter !== "all") && (
              <Button 
                variant="link" 
                size="sm" 
                onClick={() => {
                  setFilter("all");
                  setSearchTerm("");
                  setTimeFilter("all");
                }}
                className="mt-2"
              >
                Effacer les filtres
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-6 max-h-96 overflow-y-auto">
            {Object.entries(groupedActivities).map(([dateString, dayActivities]) => (
              <div key={dateString} className="space-y-3">
                {/* Date Header */}
                <div className="sticky top-0 bg-white z-10 border-b pb-2">
                  <h4 className="font-medium text-gray-900 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {formatDateHeader(dateString)}
                    <Badge variant="outline" className="text-xs">
                      {(dayActivities as any[]).length}
                    </Badge>
                  </h4>
                </div>

                {/* Activities for this date */}
                {(dayActivities as any[]).map((activity: any) => {
                  const ActionIcon = actionIcons[activity.action as keyof typeof actionIcons] || Activity;
                  const colorClass = actionColors[activity.action as keyof typeof actionColors] || "bg-gray-100 text-gray-600 border-gray-200";

                  return (
                    <div key={activity.id} className="flex gap-3 items-start p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${colorClass}`}>
                        <ActionIcon className="w-5 h-5" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Avatar className="w-6 h-6">
                            <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                              {activity.contributorName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-sm text-gray-900">
                            {activity.contributorName}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {actionLabels[activity.action as keyof typeof actionLabels]}
                          </Badge>
                          <span className="text-xs text-gray-500 ml-auto">
                            {format(new Date(activity.createdAt), "HH:mm")}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-700 leading-relaxed mb-2">
                          {activity.description}
                        </p>

                        {activity.metadata && (
                          <div className="flex gap-2 flex-wrap">
                            {(() => {
                              try {
                                const metadata = typeof activity.metadata === 'string' 
                                  ? JSON.parse(activity.metadata) 
                                  : activity.metadata;
                                
                                const badges = [];
                                
                                if (metadata.photoName) {
                                  badges.push(
                                    <Badge key="photo" variant="secondary" className="text-xs">
                                      📸 {metadata.photoName}
                                    </Badge>
                                  );
                                }
                                
                                if (metadata.reaction) {
                                  const emojiMap: Record<string, string> = {
                                    'like': '👍',
                                    'love': '❤️', 
                                    'laugh': '😄',
                                    'wow': '😮'
                                  };
                                  const emoji = emojiMap[metadata.reaction] || '👍';
                                  
                                  badges.push(
                                    <Badge key="reaction" variant="secondary" className="text-xs">
                                      {emoji} {metadata.reaction}
                                    </Badge>
                                  );
                                }

                                if (metadata.commentContent) {
                                  badges.push(
                                    <Badge key="comment" variant="secondary" className="text-xs max-w-40 truncate">
                                      💬 "{metadata.commentContent}"
                                    </Badge>
                                  );
                                }
                                
                                return badges;
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
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}