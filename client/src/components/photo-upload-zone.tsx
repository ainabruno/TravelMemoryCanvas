import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CloudUpload, Plus } from "lucide-react";

export default function PhotoUploadZone() {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('photos', file);
      });

      const response = await apiRequest('POST', '/api/photos/upload', formData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/photos'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      toast({
        title: "Success",
        description: "Photos uploaded successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
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
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: 10,
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
        {isDragActive ? 'Drop your photos here...' : 'Drag and drop your photos here, or click to browse'}
      </p>
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
