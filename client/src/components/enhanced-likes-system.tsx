import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { 
  Heart, 
  ThumbsUp, 
  Smile, 
  Star, 
  Zap, 
  Camera, 
  Users,
  TrendingUp,
  Award,
  Sparkles
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface EnhancedLikesSystemProps {
  photoId: number;
  contributorName: string;
  contributorEmail?: string;
  showDetailed?: boolean;
}

const reactionTypes = {
  like: { 
    icon: ThumbsUp, 
    emoji: "👍", 
    label: "J'aime", 
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    animation: "animate-bounce"
  },
  love: { 
    icon: Heart, 
    emoji: "❤️", 
    label: "Adore", 
    color: "text-red-500",
    bgColor: "bg-red-50",
    animation: "animate-pulse"
  },
  wow: { 
    icon: Star, 
    emoji: "😮", 
    label: "Wow", 
    color: "text-purple-500",
    bgColor: "bg-purple-50",
    animation: "animate-spin"
  },
  laugh: { 
    icon: Smile, 
    emoji: "😄", 
    label: "Drôle", 
    color: "text-yellow-500",
    bgColor: "bg-yellow-50",
    animation: "animate-wiggle"
  },
  amazing: { 
    icon: Zap, 
    emoji: "🤩", 
    label: "Incroyable", 
    color: "text-orange-500",
    bgColor: "bg-orange-50",
    animation: "animate-tada"
  },
  artistic: { 
    icon: Camera, 
    emoji: "🎨", 
    label: "Artistique", 
    color: "text-indigo-500",
    bgColor: "bg-indigo-50",
    animation: "animate-float"
  },
};

interface Reaction {
  id: number;
  reaction: string;
  contributorName: string;
  contributorEmail?: string;
  createdAt: string;
}

interface ReactionStats {
  totalReactions: number;
  topReaction: string | null;
  userReaction: string | null;
  reactionBreakdown: Record<string, number>;
  recentReactors: string[];
}

export default function EnhancedLikesSystem({ 
  photoId, 
  contributorName, 
  contributorEmail, 
  showDetailed = false 
}: EnhancedLikesSystemProps) {
  const [activeReaction, setActiveReaction] = useState<string | null>(null);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [animatingReaction, setAnimatingReaction] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch reactions with enhanced data
  const { data: reactions = [], isLoading } = useQuery({
    queryKey: ['/api/photos', photoId, 'reactions'],
    queryFn: () => apiRequest('GET', `/api/photos/${photoId}/reactions`).then(res => res.json()),
  });

  // Calculate reaction statistics
  const reactionStats: ReactionStats = {
    totalReactions: reactions.length,
    topReaction: null,
    userReaction: null,
    reactionBreakdown: {},
    recentReactors: [],
  };

  // Process reactions for statistics
  reactions.forEach((reaction: Reaction) => {
    if (!reactionStats.reactionBreakdown[reaction.reaction]) {
      reactionStats.reactionBreakdown[reaction.reaction] = 0;
    }
    reactionStats.reactionBreakdown[reaction.reaction]++;
    
    if (reaction.contributorName === contributorName) {
      reactionStats.userReaction = reaction.reaction;
    }
    
    if (reactionStats.recentReactors.length < 5 && 
        !reactionStats.recentReactors.includes(reaction.contributorName)) {
      reactionStats.recentReactors.push(reaction.contributorName);
    }
  });

  // Find top reaction
  if (Object.keys(reactionStats.reactionBreakdown).length > 0) {
    reactionStats.topReaction = Object.entries(reactionStats.reactionBreakdown)
      .sort(([,a], [,b]) => b - a)[0][0];
  }

  // Add/remove reaction mutation with optimistic updates
  const reactionMutation = useMutation({
    mutationFn: async (reactionType: string) => {
      if (reactionStats.userReaction === reactionType) {
        // Remove reaction
        const userReaction = reactions.find((r: Reaction) => 
          r.contributorName === contributorName && r.reaction === reactionType
        );
        if (userReaction) {
          await apiRequest('DELETE', `/api/photos/${photoId}/reactions/${userReaction.id}`);
        }
        return { action: 'removed', reaction: reactionType };
      } else {
        // Add or update reaction
        if (reactionStats.userReaction) {
          // Remove existing reaction first
          const existingReaction = reactions.find((r: Reaction) => 
            r.contributorName === contributorName
          );
          if (existingReaction) {
            await apiRequest('DELETE', `/api/photos/${photoId}/reactions/${existingReaction.id}`);
          }
        }
        
        const response = await apiRequest('POST', `/api/photos/${photoId}/reactions`, {
          reaction: reactionType,
          contributorName,
          contributorEmail,
        });
        return { action: 'added', reaction: reactionType, data: response.json() };
      }
    },
    onMutate: async (reactionType) => {
      await queryClient.cancelQueries({ queryKey: ['/api/photos', photoId, 'reactions'] });
      const previousReactions = queryClient.getQueryData(['/api/photos', photoId, 'reactions']);
      
      // Trigger animation
      setAnimatingReaction(reactionType);
      setTimeout(() => setAnimatingReaction(null), 1000);
      
      // Optimistic update
      queryClient.setQueryData(['/api/photos', photoId, 'reactions'], (old: Reaction[]) => {
        const filtered = old?.filter(r => r.contributorName !== contributorName) || [];
        
        if (reactionStats.userReaction === reactionType) {
          // Removing reaction
          return filtered;
        } else {
          // Adding new reaction
          return [...filtered, {
            id: Date.now(),
            reaction: reactionType,
            contributorName,
            contributorEmail,
            createdAt: new Date().toISOString(),
          }];
        }
      });

      return { previousReactions };
    },
    onError: (err, reactionType, context) => {
      queryClient.setQueryData(['/api/photos', photoId, 'reactions'], context?.previousReactions);
      toast({
        title: "Erreur",
        description: "Impossible de modifier votre réaction",
        variant: "destructive",
      });
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['/api/photos', photoId, 'reactions'] });
      
      const reactionConfig = reactionTypes[result.reaction as keyof typeof reactionTypes];
      if (result.action === 'added') {
        toast({
          title: "Réaction ajoutée",
          description: `Vous avez réagi avec ${reactionConfig?.label || result.reaction}`,
        });
      }
      
      setShowReactionPicker(false);
    },
  });

  // Quick like function (defaults to thumbs up)
  const handleQuickLike = () => {
    reactionMutation.mutate('like');
  };

  // Handle specific reaction
  const handleReaction = (reactionType: string) => {
    reactionMutation.mutate(reactionType);
  };

  // Get reaction color for user's current reaction
  const getUserReactionStyle = () => {
    if (!reactionStats.userReaction) return "";
    const reactionConfig = reactionTypes[reactionStats.userReaction as keyof typeof reactionTypes];
    return reactionConfig ? reactionConfig.color : "";
  };

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-24"></div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Quick Actions Bar */}
      <div className="flex items-center gap-2">
        {/* Quick Like Button */}
        <Button
          variant={reactionStats.userReaction ? "default" : "outline"}
          size="sm"
          onClick={handleQuickLike}
          disabled={reactionMutation.isPending}
          className={`relative overflow-hidden transition-all duration-300 ${
            reactionStats.userReaction === 'like' ? 'bg-blue-600 text-white' : ''
          } ${animatingReaction === 'like' ? 'animate-bounce' : ''}`}
        >
          <ThumbsUp className={`w-4 h-4 mr-1 ${getUserReactionStyle()}`} />
          {reactionStats.totalReactions > 0 && reactionStats.totalReactions}
        </Button>

        {/* Reaction Picker */}
        <Popover open={showReactionPicker} onOpenChange={setShowReactionPicker}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="relative">
              {reactionStats.userReaction ? (
                <span className="text-lg">
                  {reactionTypes[reactionStats.userReaction as keyof typeof reactionTypes]?.emoji}
                </span>
              ) : (
                <Smile className="w-4 h-4" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" align="start">
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(reactionTypes).map(([key, reaction]) => (
                <Button
                  key={key}
                  variant="ghost"
                  size="sm"
                  className={`h-12 w-12 p-0 hover:scale-110 transition-all duration-200 ${
                    reactionStats.userReaction === key ? reaction.bgColor : ''
                  } ${animatingReaction === key ? reaction.animation : ''}`}
                  onClick={() => handleReaction(key)}
                  disabled={reactionMutation.isPending}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-1">{reaction.emoji}</div>
                    <div className="text-xs text-gray-600">{reaction.label}</div>
                  </div>
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Reaction Summary */}
        {reactionStats.totalReactions > 0 && (
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-gray-600">
                <Users className="w-4 h-4 mr-1" />
                {reactionStats.totalReactions} réaction{reactionStats.totalReactions > 1 ? 's' : ''}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Réactions à cette photo</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* Reaction Breakdown */}
                <div className="space-y-2">
                  {Object.entries(reactionStats.reactionBreakdown).map(([reactionType, count]) => {
                    const reactionConfig = reactionTypes[reactionType as keyof typeof reactionTypes];
                    if (!reactionConfig) return null;
                    
                    return (
                      <div key={reactionType} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{reactionConfig.emoji}</span>
                          <span className="text-sm">{reactionConfig.label}</span>
                        </div>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    );
                  })}
                </div>

                {/* Recent Reactors */}
                {reactionStats.recentReactors.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Personnes ayant réagi</h4>
                    <div className="space-y-1">
                      {reactionStats.recentReactors.map(name => (
                        <div key={name} className="flex items-center gap-2">
                          <Avatar className="w-6 h-6">
                            <AvatarFallback className="text-xs">
                              {name ? name.slice(0, 2).toUpperCase() : 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Detailed Statistics (if enabled) */}
      {showDetailed && reactionStats.totalReactions > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {reactionStats.totalReactions}
                </div>
                <div className="text-xs text-gray-600">Total réactions</div>
              </div>
              
              {reactionStats.topReaction && (
                <div>
                  <div className="text-2xl">
                    {reactionTypes[reactionStats.topReaction as keyof typeof reactionTypes]?.emoji}
                  </div>
                  <div className="text-xs text-gray-600">Plus populaire</div>
                </div>
              )}
              
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {Object.keys(reactionStats.reactionBreakdown).length}
                </div>
                <div className="text-xs text-gray-600">Types différents</div>
              </div>
              
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {reactionStats.recentReactors.length}
                </div>
                <div className="text-xs text-gray-600">Contributeurs</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Animated Reaction Display */}
      <div className="flex flex-wrap gap-1">
        {Object.entries(reactionStats.reactionBreakdown)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 3)
          .map(([reactionType, count]) => {
            const reactionConfig = reactionTypes[reactionType as keyof typeof reactionTypes];
            if (!reactionConfig) return null;
            
            return (
              <div
                key={reactionType}
                className={`flex items-center gap-1 bg-gray-100 rounded-full px-2 py-1 text-xs transition-all duration-300 hover:scale-105 ${
                  animatingReaction === reactionType ? reactionConfig.animation : ''
                }`}
              >
                <span className="text-sm">{reactionConfig.emoji}</span>
                <span className="font-medium">{count}</span>
              </div>
            );
          })}
      </div>

      {/* Achievement Badges (for high engagement) */}
      {reactionStats.totalReactions > 10 && (
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <Award className="w-4 h-4 text-yellow-500" />
          <span>Photo très appréciée !</span>
          <Sparkles className="w-4 h-4 text-purple-500" />
        </div>
      )}
    </div>
  );
}