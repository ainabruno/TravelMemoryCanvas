import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Share } from "lucide-react";

interface Photo {
  id: number;
  filename: string;
  originalName: string;
  url: string;
  tripId: number | null;
  albumId: number | null;
  caption: string | null;
  location: string | null;
  uploadedAt: string;
  metadata: string | null;
}

interface ShareModalProps {
  photo: Photo | null;
  open: boolean;
  onClose: () => void;
}

export default function ShareModal({ photo, open, onClose }: ShareModalProps) {
  const [caption, setCaption] = useState("");
  const { toast } = useToast();

  const shareMutation = useMutation({
    mutationFn: async ({ platform }: { platform: string }) => {
      const response = await apiRequest('POST', '/api/share', {
        photoId: photo?.id,
        platform,
        caption,
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: data.message,
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Share failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (!photo) return null;

  const handleShare = (platform: string) => {
    shareMutation.mutate({ platform });
  };

  const socialPlatforms = [
    { name: "Instagram", icon: "fab fa-instagram", color: "text-pink-500", platform: "instagram" },
    { name: "Facebook", icon: "fab fa-facebook", color: "text-blue-600", platform: "facebook" },
    { name: "Twitter", icon: "fab fa-twitter", color: "text-blue-400", platform: "twitter" },
    { name: "Copy Link", icon: "fas fa-link", color: "text-slate-500", platform: "link" },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Share Your Memory</DialogTitle>
        </DialogHeader>

        {/* Photo Preview */}
        <div className="mb-6">
          <img 
            src={photo.url} 
            alt={photo.caption || photo.originalName}
            className="w-full h-48 object-cover rounded-lg"
          />
        </div>

        {/* Caption */}
        <div className="mb-6">
          <Label className="text-sm font-medium text-slate-700 mb-2">Caption</Label>
          <Textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Share your travel story..."
            rows={3}
            className="w-full"
          />
        </div>

        {/* Social Platform Options */}
        <div className="mb-6">
          <Label className="text-sm font-medium text-slate-700 mb-3">Share to</Label>
          <div className="grid grid-cols-2 gap-3">
            {socialPlatforms.map((platform) => (
              <Button
                key={platform.platform}
                variant="outline"
                onClick={() => handleShare(platform.platform)}
                disabled={shareMutation.isPending}
                className="flex items-center justify-center p-3 hover:bg-blue-50 hover:border-blue-300"
              >
                <i className={`${platform.icon} ${platform.color} text-xl mr-2`}></i>
                <span>{platform.name}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Share Button */}
        <Button 
          className="w-full bg-adventure-blue text-white hover:bg-blue-700"
          disabled={shareMutation.isPending}
        >
          <Share className="w-4 h-4 mr-2" />
          {shareMutation.isPending ? 'Sharing...' : 'Share Now'}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
