import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { CloudUpload, Plus, CheckCircle, MapPin, Navigation } from "lucide-react";
import LocationPicker from "./location-picker";
import { getCurrentLocation, getAddressFromCoordinates } from "@/lib/gps-utils";

export default function PhotoUploadZone() {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);
  const [selectedLocation, setSelectedLocation] = useState<{lat: number; lng: number; address?: string} | null>(null);
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      setTotalFiles(files.length);
      setUploadedCount(0);
      setUploadProgress(0);
      
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('photos', file);
      });

      // Add GPS coordinates if available
      if (selectedLocation) {
        formData.append('latitude', selectedLocation.lat.toString());
        formData.append('longitude', selectedLocation.lng.toString());
        if (selectedLocation.address) {
          formData.append('location', selectedLocation.address);
        }
      }

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      try {
        const response = await apiRequest('POST', '/api/photos/upload', formData);
        clearInterval(progressInterval);
        setUploadProgress(100);
        setUploadedCount(files.length);
        return response.json();
      } catch (error) {
        clearInterval(progressInterval);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/photos'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      toast({
        title: "Success",
        description: `${totalFiles} photo(s) uploaded successfully!`,
      });
      // Reset progress after delay
      setTimeout(() => {
        setUploadProgress(0);
        setUploadedCount(0);
        setTotalFiles(0);
      }, 2000);
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
      setUploadProgress(0);
      setUploadedCount(0);
      setTotalFiles(0);
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      uploadMutation.mutate(acceptedFiles);
    }
  }, [uploadMutation]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif', '.bmp', '.tiff']
    },
    maxFiles: 20,
    multiple: true,
    noClick: false,
    noKeyboard: false,
  });

  return (
    <Card 
      {...getRootProps()} 
      className={`
        upload-zone border-2 border-dashed p-8 mb-8 text-center cursor-pointer transition-all
        ${isDragActive ? 'drag-over border-adventure-blue bg-blue-50' : 'border-slate-300 hover:border-adventure-blue hover:bg-blue-50'}
      `}
    >
      <input {...getInputProps()} />
      <CloudUpload className="text-4xl text-slate-400 mb-4 mx-auto" />
      <h3 className="text-lg font-semibold text-slate-900 mb-2">Upload Your Travel Photos</h3>
      <p className="text-slate-600 mb-4">
        {isDragActive ? 
          'Drop your photos here...' : 
          'Drag multiple photos here or click to select up to 20 files'
        }
      </p>
      {uploadMutation.isPending && (
        <div className="w-full max-w-sm mx-auto mb-4">
          <div className="flex items-center justify-between text-sm text-adventure-blue mb-2">
            <span>Uploading {totalFiles} photo(s)...</span>
            <span>{Math.round(uploadProgress)}%</span>
          </div>
          <Progress value={uploadProgress} className="w-full" />
        </div>
      )}
      
      {uploadProgress === 100 && !uploadMutation.isPending && (
        <div className="flex items-center justify-center text-sm text-green-600 mb-2">
          <CheckCircle className="w-4 h-4 mr-1" />
          {uploadedCount} photo(s) uploaded successfully!
        </div>
      )}
      <Button 
        variant="outline" 
        disabled={uploadMutation.isPending}
        className="bg-adventure-blue text-white hover:bg-blue-700"
      >
        <Plus className="w-4 h-4 mr-2" />
        {uploadMutation.isPending ? 'Uploading...' : 'Choose Files'}
      </Button>
    </Card>
  );
}
