import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  MessageCircle, 
  Heart, 
  Smile, 
  ThumbsUp, 
  Send, 
  Trash2, 
  Reply, 
  MoreHorizontal,
  Pin,
  Flag,
  Edit3,
  Check,
  X,
  ArrowUp,
  Clock,
  TrendingUp,
  Star
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface PhotoCommentsProps {
  photoId: number;
  contributorName: string;
  contributorEmail?: string;
}

const reactionEmojis = {
  like: { icon: ThumbsUp, emoji: "👍", label: "J'aime", color: "text-blue-600" },
  love: { icon: Heart, emoji: "❤️", label: "Adore", color: "text-red-500" },
  laugh: { icon: Smile, emoji: "😄", label: "Drôle", color: "text-yellow-500" },
  wow: { icon: MessageCircle, emoji: "😮", label: "Wow", color: "text-purple-500" },
  celebrate: { icon: Star, emoji: "🎉", label: "Célèbre", color: "text-green-500" },
  amazing: { icon: ThumbsUp, emoji: "🤩", label: "Incroyable", color: "text-orange-500" },
};

interface Comment {
  id: number;
  content: string;
  authorName: string;
  authorEmail?: string;
  createdAt: string;
  parentId?: number;
  replies?: Comment[];
  isPinned?: boolean;
  likesCount?: number;
  isLiked?: boolean;
  isEdited?: boolean;
}

interface Reaction {
  id: number;
  reaction: string;
  contributorName: string;
  createdAt: string;
}

export default function EnhancedPhotoComments({ photoId, contributorName, contributorEmail }: PhotoCommentsProps) {
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [editingComment, setEditingComment] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'popular'>('newest');
  const [expandedReplies, setExpandedReplies] = useState<Set<number>>(new Set());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch comments with enhanced data
  const { data: comments = [], isLoading: commentsLoading } = useQuery({
    queryKey: ['/api/photos', photoId, 'comments', sortBy],
    queryFn: () => apiRequest('GET', `/api/photos/${photoId}/comments?sort=${sortBy}`).then(res => res.json()),
  });

  // Fetch reactions with aggregated data
  const { data: reactions = [], isLoading: reactionsLoading } = useQuery({
    queryKey: ['/api/photos', photoId, 'reactions'],
    queryFn: () => apiRequest('GET', `/api/photos/${photoId}/reactions`).then(res => res.json()),
  });

  // Add comment mutation with optimistic updates
  const addCommentMutation = useMutation({
    mutationFn: async ({ content, parentId }: { content: string; parentId?: number }) => {
      const response = await apiRequest('POST', `/api/photos/${photoId}/comments`, {
        content,
        authorName: contributorName,
        authorEmail: contributorEmail,
        parentId,
      });
      return response.json();
    },
    onMutate: async ({ content, parentId }) => {
      // Optimistic update
      const optimisticComment = {
        id: Date.now(),
        content,
        authorName: contributorName,
        authorEmail: contributorEmail,
        createdAt: new Date().toISOString(),
        parentId,
        replies: [],
        likesCount: 0,
        isLiked: false,
      };

      await queryClient.cancelQueries({ queryKey: ['/api/photos', photoId, 'comments'] });
      const previousComments = queryClient.getQueryData(['/api/photos', photoId, 'comments', sortBy]);
      
      queryClient.setQueryData(['/api/photos', photoId, 'comments', sortBy], (old: any) => {
        return [...(old || []), optimisticComment];
      });

      return { previousComments };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['/api/photos', photoId, 'comments', sortBy], context?.previousComments);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter le commentaire",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/photos', photoId, 'comments'] });
      setNewComment("");
      setReplyContent("");
      setReplyingTo(null);
      toast({
        title: "Commentaire ajouté",
        description: "Votre commentaire a été publié",
      });
    },
  });

  // Edit comment mutation
  const editCommentMutation = useMutation({
    mutationFn: async ({ commentId, content }: { commentId: number; content: string }) => {
      const response = await apiRequest('PUT', `/api/photos/${photoId}/comments/${commentId}`, {
        content,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/photos', photoId, 'comments'] });
      setEditingComment(null);
      setEditContent("");
      toast({
        title: "Commentaire modifié",
        description: "Votre commentaire a été mis à jour",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de modifier le commentaire",
        variant: "destructive",
      });
    },
  });

  // Like comment mutation
  const likeCommentMutation = useMutation({
    mutationFn: async (commentId: number) => {
      const response = await apiRequest('POST', `/api/comments/${commentId}/like`, {
        contributorName,
      });
      return response.json();
    },
    onMutate: async (commentId) => {
      await queryClient.cancelQueries({ queryKey: ['/api/photos', photoId, 'comments'] });
      const previousComments = queryClient.getQueryData(['/api/photos', photoId, 'comments', sortBy]);
      
      queryClient.setQueryData(['/api/photos', photoId, 'comments', sortBy], (old: Comment[]) => {
        return old?.map(comment => 
          comment.id === commentId 
            ? { 
                ...comment, 
                isLiked: !comment.isLiked,
                likesCount: comment.isLiked 
                  ? (comment.likesCount || 0) - 1 
                  : (comment.likesCount || 0) + 1
              }
            : comment
        );
      });

      return { previousComments };
    },
    onError: (err, commentId, context) => {
      queryClient.setQueryData(['/api/photos', photoId, 'comments', sortBy], context?.previousComments);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/photos', photoId, 'comments'] });
    },
  });

  // Add reaction mutation with animation
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
      toast({
        title: "Réaction ajoutée",
        description: "Votre réaction a été enregistrée",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter la réaction",
        variant: "destructive",
      });
    },
  });

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: number) => {
      const response = await apiRequest('DELETE', `/api/photos/${photoId}/comments/${commentId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/photos', photoId, 'comments'] });
      toast({
        title: "Commentaire supprimé",
        description: "Le commentaire a été supprimé",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le commentaire",
        variant: "destructive",
      });
    },
  });

  const handleSubmitComment = () => {
    if (!newComment.trim()) return;
    addCommentMutation.mutate({ content: newComment });
  };

  const handleSubmitReply = (parentId: number) => {
    if (!replyContent.trim()) return;
    addCommentMutation.mutate({ content: replyContent, parentId });
  };

  const handleEditComment = (commentId: number) => {
    if (!editContent.trim()) return;
    editCommentMutation.mutate({ commentId, content: editContent });
  };

  const startEditing = (comment: Comment) => {
    setEditingComment(comment.id);
    setEditContent(comment.content);
  };

  const cancelEditing = () => {
    setEditingComment(null);
    setEditContent("");
  };

  const toggleReplies = (commentId: number) => {
    const newExpanded = new Set(expandedReplies);
    if (newExpanded.has(commentId)) {
      newExpanded.delete(commentId);
    } else {
      newExpanded.add(commentId);
    }
    setExpandedReplies(newExpanded);
  };

  // Group reactions by type
  const reactionCounts = reactions.reduce((acc: Record<string, { count: number; users: string[] }>, reaction: Reaction) => {
    if (!acc[reaction.reaction]) {
      acc[reaction.reaction] = { count: 0, users: [] };
    }
    acc[reaction.reaction].count++;
    acc[reaction.reaction].users.push(reaction.contributorName);
    return acc;
  }, {});

  // Filter and sort comments
  const topLevelComments = comments.filter((comment: Comment) => !comment.parentId);
  
  const sortedComments = [...topLevelComments].sort((a, b) => {
    switch (sortBy) {
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'popular':
        return (b.likesCount || 0) - (a.likesCount || 0);
      case 'newest':
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  const getReplies = (parentId: number) => {
    return comments.filter((comment: Comment) => comment.parentId === parentId);
  };

  const renderComment = (comment: Comment, isReply = false) => {
    const isOwner = comment.authorName === contributorName;
    const replies = getReplies(comment.id);
    const hasReplies = replies.length > 0;
    const showReplies = expandedReplies.has(comment.id);

    return (
      <div key={comment.id} className={`${isReply ? 'ml-8 border-l-2 border-gray-100 pl-4' : ''}`}>
        <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="text-xs">
              {comment.authorName ? comment.authorName.slice(0, 2).toUpperCase() : 'A'}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm">{comment.authorName}</span>
              {comment.isPinned && (
                <Badge variant="secondary" className="text-xs">
                  <Pin className="w-3 h-3 mr-1" />
                  Épinglé
                </Badge>
              )}
              {comment.isEdited && (
                <Badge variant="outline" className="text-xs">
                  Modifié
                </Badge>
              )}
              <span className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: fr })}
              </span>
            </div>
            
            {editingComment === comment.id ? (
              <div className="space-y-2">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="min-h-[60px]"
                  placeholder="Modifiez votre commentaire..."
                />
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    onClick={() => handleEditComment(comment.id)}
                    disabled={editCommentMutation.isPending}
                  >
                    <Check className="w-3 h-3 mr-1" />
                    Sauvegarder
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={cancelEditing}
                  >
                    <X className="w-3 h-3 mr-1" />
                    Annuler
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-700 mb-2 whitespace-pre-wrap">{comment.content}</p>
            )}
            
            <div className="flex items-center gap-4 text-xs">
              <Button
                variant="ghost"
                size="sm"
                className={`h-6 px-2 ${comment.isLiked ? 'text-blue-600' : 'text-gray-500'}`}
                onClick={() => likeCommentMutation.mutate(comment.id)}
              >
                <ThumbsUp className="w-3 h-3 mr-1" />
                {comment.likesCount || 0}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-gray-500"
                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
              >
                <Reply className="w-3 h-3 mr-1" />
                Répondre
              </Button>
              
              {hasReplies && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-gray-500"
                  onClick={() => toggleReplies(comment.id)}
                >
                  <MessageCircle className="w-3 h-3 mr-1" />
                  {replies.length} réponse{replies.length > 1 ? 's' : ''}
                </Button>
              )}
              
              {isOwner && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-gray-500">
                      <MoreHorizontal className="w-3 h-3" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-40 p-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start h-8"
                      onClick={() => startEditing(comment)}
                    >
                      <Edit3 className="w-3 h-3 mr-2" />
                      Modifier
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start h-8 text-red-600"
                      onClick={() => deleteCommentMutation.mutate(comment.id)}
                    >
                      <Trash2 className="w-3 h-3 mr-2" />
                      Supprimer
                    </Button>
                  </PopoverContent>
                </Popover>
              )}
            </div>
            
            {replyingTo === comment.id && (
              <div className="mt-3 space-y-2">
                <Textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  className="min-h-[60px]"
                  placeholder={`Répondre à ${comment.authorName}...`}
                />
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    onClick={() => handleSubmitReply(comment.id)}
                    disabled={addCommentMutation.isPending || !replyContent.trim()}
                  >
                    <Send className="w-3 h-3 mr-1" />
                    Répondre
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => {
                      setReplyingTo(null);
                      setReplyContent("");
                    }}
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {hasReplies && showReplies && (
          <div className="mt-2">
            {replies.map(reply => renderComment(reply, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Reactions Summary */}
      {Object.keys(reactionCounts).length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-2">
              {Object.entries(reactionCounts).map(([reaction, data]) => {
                const reactionConfig = reactionEmojis[reaction as keyof typeof reactionEmojis];
                if (!reactionConfig) return null;
                
                return (
                  <div
                    key={reaction}
                    className="flex items-center gap-1 bg-gray-100 rounded-full px-3 py-1 text-sm cursor-pointer hover:bg-gray-200 transition-colors"
                    title={`${data.users.join(', ')} ont réagi avec ${reactionConfig.label}`}
                  >
                    <span className="text-base">{reactionConfig.emoji}</span>
                    <span className="font-medium">{data.count}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Reactions */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium">Réactions rapides</h4>
            <div className="flex gap-1">
              {Object.entries(reactionEmojis).map(([key, reaction]) => (
                <Button
                  key={key}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:scale-110 transition-transform"
                  onClick={() => addReactionMutation.mutate(key)}
                  disabled={addReactionMutation.isPending}
                >
                  <span className="text-lg">{reaction.emoji}</span>
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comments Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Commentaires ({comments.length})
            </CardTitle>
            
            <Select value={sortBy} onValueChange={(value: 'newest' | 'oldest' | 'popular') => setSortBy(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    Plus récents
                  </div>
                </SelectItem>
                <SelectItem value="oldest">
                  <div className="flex items-center gap-2">
                    <ArrowUp className="w-3 h-3" />
                    Plus anciens
                  </div>
                </SelectItem>
                <SelectItem value="popular">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-3 h-3" />
                    Populaires
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Add Comment Form */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="text-xs">
                  {contributorName ? contributorName.slice(0, 2).toUpperCase() : 'C'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Ajoutez un commentaire..."
                  className="min-h-[80px]"
                />
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-gray-500">
                    {newComment.length}/500 caractères
                  </span>
                  <Button 
                    onClick={handleSubmitComment}
                    disabled={addCommentMutation.isPending || !newComment.trim() || newComment.length > 500}
                    size="sm"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Commenter
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Comments List */}
          {commentsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : sortedComments.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 mb-2">Aucun commentaire pour le moment</p>
              <p className="text-sm text-gray-500">Soyez le premier à commenter cette photo !</p>
            </div>
          ) : (
            <div className="space-y-1">
              {sortedComments.map(comment => renderComment(comment))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}