import React from 'react';
import { useQuery } from '@tanstack/react-query';

export default function VideoTest() {
  const { data: videos, isLoading, error } = useQuery({
    queryKey: ['/api/videos'],
    queryFn: async () => {
      const response = await fetch('/api/videos');
      return response.json();
    }
  });

  console.log('VideoTest - Data:', videos, 'Loading:', isLoading, 'Error:', error);

  return (
    <div className="p-4 border-4 border-red-500 bg-yellow-100">
      <h2 className="text-xl font-bold text-black mb-4">TEST VIDÉOS SIMPLE</h2>
      
      <div className="mb-4 text-black">
        <p>Loading: {isLoading ? 'true' : 'false'}</p>
        <p>Error: {error ? 'Oui' : 'Non'}</p>
        <p>Data: {videos ? `${videos.length} vidéos` : 'null'}</p>
      </div>

      <div className="space-y-2">
        {videos?.map((video: any, index: number) => (
          <div key={video.id} className="p-3 bg-blue-200 border-2 border-blue-500 rounded">
            <div className="text-black font-bold">{index + 1}. {video.title}</div>
            <div className="text-black text-sm">{video.description}</div>
            <div className="text-black text-xs">Status: {video.status} | Durée: {video.duration}s</div>
          </div>
        ))}
      </div>

      {(!videos || videos.length === 0) && !isLoading && (
        <div className="p-3 bg-red-200 border-2 border-red-500 rounded text-black">
          Aucune vidéo trouvée
        </div>
      )}
    </div>
  );
}