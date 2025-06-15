import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Video, Play, Download, Share, Clock } from 'lucide-react';

export default function VideoTest() {
  const { data: videos, isLoading, error } = useQuery({
    queryKey: ['/api/videos']
  });

  console.log('VideoTest:', { loading: isLoading, error, videos, type: typeof videos, isArray: Array.isArray(videos) });

  if (isLoading) {
    return <div className="p-4 border">Chargement des vidéos...</div>;
  }

  if (error) {
    return <div className="p-4 border text-red-500">Erreur: {error.message}</div>;
  }

  if (!videos || !Array.isArray(videos)) {
    return <div className="p-4 border text-yellow-500">Pas de données vidéo ou format incorrect</div>;
  }

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">Test Vidéos ({videos.length})</h2>
      
      {videos.map((video: any, index: number) => (
        <div key={video.id || index} className="border-2 border-blue-500 p-4 rounded-lg bg-white">
          <div className="aspect-video bg-gray-200 rounded mb-3 flex items-center justify-center">
            <Video className="w-12 h-12 text-gray-400" />
          </div>
          
          <h3 className="text-lg font-bold mb-2">{video.title || 'Titre manquant'}</h3>
          <p className="text-sm text-gray-600 mb-2">{video.description || 'Description manquante'}</p>
          
          <div className="flex items-center gap-2 mb-3 text-sm">
            <Clock className="w-4 h-4" />
            <span>{Math.floor((video.duration || 0) / 60)}:{String((video.duration || 0) % 60).padStart(2, '0')}</span>
            <span className="border px-2 py-1 rounded text-xs">{video.quality || '?'}</span>
            <span className={`px-2 py-1 rounded text-xs text-white ${
              video.status === 'ready' ? 'bg-green-500' : 
              video.status === 'generating' ? 'bg-yellow-500' : 'bg-red-500'
            }`}>
              {video.status === 'ready' ? 'Prêt' : 
               video.status === 'generating' ? 'Génération...' : 'Erreur'}
            </span>
          </div>
          
          <div className="flex gap-2">
            <button className="bg-blue-500 text-white px-3 py-1 rounded text-sm">
              <Play className="w-3 h-3 inline mr-1" />
              Lire
            </button>
            <button className="border px-3 py-1 rounded text-sm">
              <Download className="w-3 h-3 inline mr-1" />
              Télécharger
            </button>
            <button className="border px-3 py-1 rounded text-sm">
              <Share className="w-3 h-3 inline mr-1" />
              Partager
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}