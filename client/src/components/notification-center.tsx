import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, BellRing, Check, Camera, MessageCircle, Heart, UserPlus, Eye, EyeOff } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

interface NotificationCenterProps {
  albumId?: number;
  contributorName: string;
}

interface Notification {
  id: string;
  type: 'photo_added' | 'comment_added' | 'reaction_added' | 'contributor_joined';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actorName: string;
  metadata?: any;
}

const notificationIcons = {
  photo_added: Camera,
  comment_added: MessageCircle,
  reaction_added: Heart,
  contributor_joined: UserPlus,
};

const notificationColors = {
  photo_added: "text-green-600",
  comment_added: "text-purple-600", 
  reaction_added: "text-pink-600",
  contributor_joined: "text-orange-600",
};

export default function NotificationCenter({ albumId, contributorName }: NotificationCenterProps) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { toast } = useToast();

  // Simuler des notifications en temps réel basées sur l'activité de l'album
  const { data: activities = [] } = useQuery({
    queryKey: ['/api/albums', albumId, 'activity'],
    queryFn: () => albumId ? apiRequest('GET', `/api/albums/${albumId}/activity`).then(res => res.json()) : Promise.resolve([]),
    refetchInterval: 5000, // Check every 5 seconds
    enabled: !!albumId,
  });

  // Générer des notifications basées sur les nouvelles activités
  useEffect(() => {
    if (!activities.length) return;

    const newNotifications = activities
      .filter((activity: any) => activity.contributorName !== contributorName) // Pas nos propres actions
      .slice(0, 10) // Limiter à 10 notifications récentes
      .map((activity: any) => ({
        id: `notif-${activity.id}`,
        type: activity.action,
        title: getNotificationTitle(activity.action),
        message: `${activity.contributorName} ${activity.description}`,
        timestamp: activity.createdAt,
        read: false,
        actorName: activity.contributorName,
        metadata: activity.metadata,
      }));

    setNotifications(newNotifications);
  }, [activities, contributorName]);

  const getNotificationTitle = (action: string) => {
    switch (action) {
      case 'photo_added': return 'Nouvelle photo';
      case 'comment_added': return 'Nouveau commentaire';
      case 'reaction_added': return 'Nouvelle réaction';
      case 'contributor_joined': return 'Nouveau membre';
      default: return 'Nouvelle activité';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const toggleNotification = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: !n.read } : n)
    );
  };

  // Toast pour nouvelles notifications importantes
  useEffect(() => {
    const latestNotification = notifications[0];
    if (latestNotification && !latestNotification.read && notifications.length > 0) {
      const NotificationIcon = notificationIcons[latestNotification.type] || Bell;
      
      toast({
        title: latestNotification.title,
        description: latestNotification.message,
        action: (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              setOpen(true);
              markAsRead(latestNotification.id);
            }}
          >
            Voir
          </Button>
        ),
      });
    }
  }, [notifications, toast]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="relative"
          onClick={() => setOpen(!open)}
        >
          {unreadCount > 0 ? (
            <BellRing className="w-4 h-4" />
          ) : (
            <Bell className="w-4 h-4" />
          )}
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 p-0" align="end">
        <Card className="border-0 shadow-lg">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">
                Notifications
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {unreadCount} nouvelles
                  </Badge>
                )}
              </CardTitle>
              {unreadCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={markAllAsRead}
                  className="text-xs"
                >
                  <Check className="w-3 h-3 mr-1" />
                  Tout lire
                </Button>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            <ScrollArea className="h-80">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">Aucune notification</p>
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map((notification) => {
                    const NotificationIcon = notificationIcons[notification.type] || Bell;
                    const colorClass = notificationColors[notification.type] || "text-gray-600";
                    
                    return (
                      <div 
                        key={notification.id}
                        className={`p-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                          !notification.read ? 'bg-blue-50 border-l-4 border-l-blue-400' : ''
                        }`}
                        onClick={() => toggleNotification(notification.id)}
                      >
                        <div className="flex gap-3">
                          <div className={`w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center ${colorClass}`}>
                            <NotificationIcon className="w-4 h-4" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Avatar className="w-5 h-5">
                                <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                                  {notification.actorName.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium text-xs text-gray-900">
                                {notification.title}
                              </span>
                              <span className="text-xs text-gray-500 ml-auto">
                                {formatDistanceToNow(new Date(notification.timestamp), { 
                                  addSuffix: true, 
                                  locale: fr 
                                })}
                              </span>
                            </div>
                            
                            <p className="text-xs text-gray-700 leading-relaxed">
                              {notification.message}
                            </p>

                            {notification.metadata && (
                              <div className="mt-2">
                                {(() => {
                                  try {
                                    const metadata = typeof notification.metadata === 'string' 
                                      ? JSON.parse(notification.metadata) 
                                      : notification.metadata;
                                    
                                    if (metadata.photoName) {
                                      return (
                                        <Badge variant="secondary" className="text-xs">
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
                                      
                                      return (
                                        <Badge variant="secondary" className="text-xs">
                                          {emoji} {metadata.reaction}
                                        </Badge>
                                      );
                                    }

                                    if (metadata.commentContent) {
                                      return (
                                        <Badge variant="secondary" className="text-xs">
                                          💬 "{metadata.commentContent.substring(0, 30)}..."
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

                          <div className="flex items-center">
                            {notification.read ? (
                              <Eye className="w-3 h-3 text-gray-400" />
                            ) : (
                              <EyeOff className="w-3 h-3 text-blue-500" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
}