import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, Heart, Smile, ThumbsUp, Send, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface PhotoCommentsProps {
  photoId: number;
  contributorName: string;
  contributorEmail?: string;
}

const reactionEmojis = {
  like: { icon: ThumbsUp, emoji: "👍", label: "J'aime" },
  love: { icon: Heart, emoji: "❤️", label: "Adore" },
  laugh: { icon: Smile, emoji: "😄", label: "Drôle" },
  wow: { icon: MessageCircle, emoji: "😮", label: "Wow" },
};

export default function PhotoComments({ photoId, contributorName, contributorEmail }: PhotoCommentsProps) {
  const [newComment, setNewComment] = useState("");
  const [showReactions, setShowReactions] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch comments
  const { data: comments = [], isLoading: commentsLoading } = useQuery({
    queryKey: ['/api/photos', photoId, 'comments'],
    queryFn: () => apiRequest('GET', `/api/photos/${photoId}/comments`).then(res => res.json()),
  });

  // Fetch reactions
  const { data: reactions = [], isLoading: reactionsLoading } = useQuery({
    queryKey: ['/api/photos', photoId, 'reactions'],
    queryFn: () => apiRequest('GET', `/api/photos/${photoId}/reactions`).then(res => res.json()),
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest('POST', `/api/photos/${photoId}/comments`, {
        content,
        authorName: contributorName,
        authorEmail: contributorEmail,
      });
      return response.json();
    },
    onSuccess: () => {
      setNewComment("");
      queryClient.invalidateQueries({ queryKey: ['/api/photos', photoId, 'comments'] });
      toast({
        title: "Commentaire ajouté",
        description: "Votre commentaire a été publié",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter le commentaire",
        variant: "destructive",
      });
    },
  });

  // Add reaction mutation
  const addReactionMutation = useMutation({
    mutationFn: async (reaction: string) => {
      const response = await apiRequest('POST', `/api/photos/${photoId}/reactions`, {
        reaction,
        contributorName,
        contributorEmail,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/photos', photoId, 'reactions'] });
      setShowReactions(false);
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter la réaction",
        variant: "destructive",
      });
    },
  });

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    addCommentMutation.mutate(newComment);
  };

  const handleReaction = (reaction: string) => {
    addReactionMutation.mutate(reaction);
  };

  // Group reactions by type
  const groupedReactions = reactions.reduce((acc: any, reaction: any) => {
    if (!acc[reaction.reaction]) {
      acc[reaction.reaction] = [];
    }
    acc[reaction.reaction].push(reaction);
    return acc;
  }, {});

  const userReaction = reactions.find((r: any) => r.contributorName === contributorName);

  return (
    <div className="space-y-4">
      {/* Reactions */}
      <div className="flex items-center gap-2 flex-wrap">
        {Object.entries(groupedReactions).map(([reactionType, reactionList]: [string, any]) => {
          const reactionConfig = reactionEmojis[reactionType as keyof typeof reactionEmojis];
          if (!reactionConfig) return null;

          return (
            <Badge
              key={reactionType}
              variant={userReaction?.reaction === reactionType ? "default" : "secondary"}
              className="cursor-pointer hover:bg-gray-100"
              onClick={() => handleReaction(reactionType)}
            >
              <span className="mr-1">{reactionConfig.emoji}</span>
              {reactionList.length}
            </Badge>
          );
        })}

        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowReactions(!showReactions)}
            className="text-gray-500 hover:text-gray-700"
          >
            <Heart className="w-4 h-4 mr-1" />
            Réagir
          </Button>

          {showReactions && (
            <div className="absolute top-full left-0 mt-1 bg-white border rounded-lg shadow-lg p-2 flex gap-1 z-10">
              {Object.entries(reactionEmojis).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => handleReaction(key)}
                  className="p-2 hover:bg-gray-100 rounded text-lg transition-colors"
                  title={config.label}
                >
                  {config.emoji}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Comments */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-900 flex items-center gap-2">
          <MessageCircle className="w-4 h-4" />
          Commentaires ({comments.length})
        </h4>

        {commentsLoading ? (
          <div className="space-y-2">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {comments.map((comment: any) => (
              <div key={comment.id} className="flex gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                    {comment.authorName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm text-gray-900">
                      {comment.authorName}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(comment.createdAt), { 
                        addSuffix: true, 
                        locale: fr 
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{comment.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add comment form */}
        <form onSubmit={handleSubmitComment} className="flex gap-2">
          <Input
            placeholder="Ajouter un commentaire..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="flex-1"
          />
          <Button
            type="submit"
            size="sm"
            disabled={!newComment.trim() || addCommentMutation.isPending}
          >
            {addCommentMutation.isPending ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}