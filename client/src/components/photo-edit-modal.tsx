import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Share, MessageCircle, Edit3 } from "lucide-react";
import { applyPhotoFilters } from "@/lib/photo-editor";
import PhotoComments from "@/components/photo-comments";

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

interface PhotoEditModalProps {
  photo: Photo | null;
  open: boolean;
  onClose: () => void;
  onShare: () => void;
}

export default function PhotoEditModal({ photo, open, onClose, onShare }: PhotoEditModalProps) {
  const [brightness, setBrightness] = useState([100]);
  const [contrast, setContrast] = useState([100]);
  const [saturation, setSaturation] = useState([100]);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      // Reset values when modal opens
      setBrightness([100]);
      setContrast([100]);
      setSaturation([100]);
      setSelectedFilter(null);
    }
  }, [open]);

  if (!photo) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric' 
    });
  };

  const imageStyle = applyPhotoFilters({
    brightness: brightness[0],
    contrast: contrast[0],
    saturation: saturation[0],
    filter: selectedFilter,
  });

  const filters = [
    { name: "Vintage", value: "vintage" },
    { name: "Warm", value: "warm" },
    { name: "Cool", value: "cool" },
    { name: "B&W", value: "grayscale" },
    { name: "Sepia", value: "sepia" },
    { name: "Drama", value: "drama" },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex p-0">
        {/* Photo Display */}
        <div className="flex-1 bg-slate-900 flex items-center justify-center">
          <img 
            src={photo.url} 
            alt={photo.caption || photo.originalName}
            className="max-w-full max-h-full object-contain"
            style={imageStyle}
          />
        </div>
        
        {/* Editing Tools Sidebar */}
        <div className="w-80 bg-white p-6 overflow-y-auto">
          <DialogHeader className="mb-6">
            <DialogTitle>Edit Photo</DialogTitle>
          </DialogHeader>

          {/* Basic Adjustments */}
          <div className="mb-6">
            <h4 className="font-medium text-slate-900 mb-3">Adjustments</h4>
            <div className="space-y-4">
              <div>
                <Label className="text-sm text-slate-600 mb-2">Brightness</Label>
                <Slider
                  value={brightness}
                  onValueChange={setBrightness}
                  min={0}
                  max={200}
                  step={1}
                  className="w-full"
                />
              </div>
              <div>
                <Label className="text-sm text-slate-600 mb-2">Contrast</Label>
                <Slider
                  value={contrast}
                  onValueChange={setContrast}
                  min={0}
                  max={200}
                  step={1}
                  className="w-full"
                />
              </div>
              <div>
                <Label className="text-sm text-slate-600 mb-2">Saturation</Label>
                <Slider
                  value={saturation}
                  onValueChange={setSaturation}
                  min={0}
                  max={200}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-6">
            <h4 className="font-medium text-slate-900 mb-3">Filters</h4>
            <div className="grid grid-cols-3 gap-2">
              {filters.map((filter) => (
                <Button
                  key={filter.value}
                  variant={selectedFilter === filter.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedFilter(selectedFilter === filter.value ? null : filter.value)}
                  className="text-xs"
                >
                  {filter.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Crop Tool */}
          <div className="mb-6">
            <h4 className="font-medium text-slate-900 mb-3">Crop</h4>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" className="text-xs">1:1</Button>
              <Button variant="outline" size="sm" className="text-xs">4:3</Button>
              <Button variant="outline" size="sm" className="text-xs">16:9</Button>
              <Button variant="outline" size="sm" className="text-xs">Free</Button>
            </div>
          </div>

          {/* Photo Info */}
          <div className="mb-6">
            <h4 className="font-medium text-slate-900 mb-3">Photo Details</h4>
            <div className="space-y-2 text-sm text-slate-600">
              <div className="flex justify-between">
                <span>Date:</span>
                <span>{formatDate(photo.uploadedAt)}</span>
              </div>
              {photo.location && (
                <div className="flex justify-between">
                  <span>Location:</span>
                  <span>{photo.location}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Name:</span>
                <span>{photo.originalName}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button className="flex-1 bg-adventure-blue text-white hover:bg-blue-700">
              Save Changes
            </Button>
            <Button variant="outline" onClick={onShare}>
              <Share className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
