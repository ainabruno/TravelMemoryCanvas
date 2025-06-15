import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface VideoData {
  title: string;
  tripId?: number;
  albumId?: number;
  photos: any[];
  settings: VideoSettings;
  template: VideoTemplate;
}

interface VideoSettings {
  template: string;
  duration: number;
  quality: '720p' | '1080p' | '4K';
  framerate: 24 | 30 | 60;
  aspectRatio: '16:9' | '9:16' | '1:1' | '4:3';
  includeMusic: boolean;
  musicGenre: 'cinematic' | 'upbeat' | 'ambient' | 'acoustic' | 'electronic';
  includeText: boolean;
  includeMap: boolean;
  includeStats: boolean;
  autoSync: boolean;
  photosPerSecond: number;
  transitions: VideoTransition[];
}

interface VideoTemplate {
  id: string;
  name: string;
  category: 'travel' | 'memories' | 'adventure' | 'romantic' | 'family';
  duration: number;
  style: 'cinematic' | 'dynamic' | 'peaceful' | 'energetic' | 'nostalgic';
}

interface VideoTransition {
  type: 'fade' | 'slide' | 'zoom' | 'rotate' | 'dissolve' | 'wipe';
  duration: number;
  direction?: 'left' | 'right' | 'up' | 'down';
}

interface GeneratedVideo {
  id: string;
  title: string;
  description?: string;
  tripId?: number;
  albumId?: number;
  duration: number;
  quality: string;
  aspectRatio: string;
  template: string;
  status: 'generating' | 'ready' | 'error';
  progress: number;
  url?: string;
  thumbnailUrl?: string;
  createdAt: string;
  updatedAt: string;
  metadata: {
    photoCount: number;
    transitionCount: number;
    musicTrack?: string;
    fileSize?: string;
  };
}

export async function generateVideoLayout(data: VideoData): Promise<GeneratedVideo> {
  try {
    const { title, tripId, albumId, photos, settings, template } = data;
    
    // Analyze photos for optimal video sequence
    const photoAnalysis = await analyzePhotosForVideo(photos, template, settings);
    
    // Generate video timeline
    const timeline = await generateVideoTimeline(photos, photoAnalysis, settings);
    
    // Select appropriate music
    const musicTrack = selectMusicTrack(settings.musicGenre, template.style, settings.duration);
    
    // Generate transitions
    const transitions = generateTransitions(photos.length, template.style, settings);
    
    // Calculate video metadata
    const metadata = calculateVideoMetadata(photos, transitions, musicTrack, settings);

    const video: GeneratedVideo = {
      id: `video_${Date.now()}`,
      title,
      description: await generateVideoDescription(photos, template),
      tripId,
      albumId,
      duration: settings.duration,
      quality: settings.quality,
      aspectRatio: settings.aspectRatio,
      template: template.id,
      status: 'ready',
      progress: 100,
      url: `/api/videos/generated_${Date.now()}.mp4`,
      thumbnailUrl: `/api/videos/thumb_${Date.now()}.jpg`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata
    };

    return video;

  } catch (error) {
    console.error("Error generating video layout:", error);
    throw new Error("Failed to generate video layout");
  }
}

async function analyzePhotosForVideo(photos: any[], template: VideoTemplate, settings: VideoSettings): Promise<any> {
  if (!photos || photos.length === 0) {
    return { sequence: [], highlights: [], mood: 'neutral' };
  }

  try {
    const photoDescriptions = photos.slice(0, 20).map((photo, index) => 
      `${index + 1}. ${photo.originalName || 'untitled'} ${photo.caption ? `- ${photo.caption}` : ''} ${photo.location ? `at ${photo.location}` : ''}`
    ).join('\n');

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Tu es un expert en montage vidéo et storytelling visuel. Analyse cette collection de photos de voyage pour créer une séquence vidéo optimale. Fournis tes recommandations en JSON:

{
  "sequence": [
    {"photoIndex": 0, "timing": "opening", "reason": "Strong establishing shot"},
    {"photoIndex": 5, "timing": "middle", "reason": "Key moment"},
    {"photoIndex": 12, "timing": "climax", "reason": "Most impactful image"}
  ],
  "highlights": [
    {"photoIndex": 3, "type": "landscape", "impact": "high"},
    {"photoIndex": 8, "type": "portrait", "impact": "medium"}
  ],
  "mood": "adventurous",
  "pacing": "dynamic",
  "storyline": {
    "introduction": [0, 1, 2],
    "development": [3, 4, 5, 6, 7],
    "climax": [8, 9],
    "conclusion": [10, 11]
  },
  "musicSync": {
    "beatMatches": [2, 6, 10],
    "emotionalPeaks": [4, 8],
    "quietMoments": [1, 5, 11]
  }
}`
        },
        {
          role: "user",
          content: `Analyse cette collection de ${photos.length} photos pour une vidéo ${template.style} de ${settings.duration} secondes:\n\n${photoDescriptions}\n\nStyle recherché: ${template.style}\nGenre musical: ${settings.musicGenre}`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.4,
      max_tokens: 2000,
    });

    return JSON.parse(response.choices[0].message.content || '{}');

  } catch (error) {
    console.error("Error analyzing photos for video:", error);
    return { sequence: [], highlights: [], mood: 'neutral' };
  }
}

async function generateVideoTimeline(photos: any[], analysis: any, settings: VideoSettings): Promise<any[]> {
  const timeline: any[] = [];
  const photoDuration = settings.duration / photos.length;
  
  photos.forEach((photo, index) => {
    const startTime = index * photoDuration;
    const endTime = startTime + photoDuration;
    
    // Determine if this photo should have extended duration based on analysis
    const isHighlight = analysis.highlights?.some((h: any) => h.photoIndex === index);
    const actualDuration = isHighlight ? photoDuration * 1.5 : photoDuration;
    
    timeline.push({
      photoId: photo.id,
      startTime,
      endTime: startTime + actualDuration,
      duration: actualDuration,
      transition: getTransitionForPhoto(index, photos.length, settings.template),
      effects: getEffectsForPhoto(photo, analysis, settings),
      textOverlay: settings.includeText ? generateTextOverlay(photo, index, photos.length) : null
    });
  });
  
  return timeline;
}

function selectMusicTrack(genre: string, style: string, duration: number): string {
  const musicLibrary = {
    cinematic: {
      cinematic: 'orchestral_epic_01',
      peaceful: 'ambient_peaceful_01',
      nostalgic: 'piano_nostalgic_01'
    },
    upbeat: {
      energetic: 'electronic_upbeat_01',
      dynamic: 'rock_energetic_01'
    },
    ambient: {
      peaceful: 'nature_ambient_01',
      nostalgic: 'strings_ambient_01'
    },
    acoustic: {
      romantic: 'guitar_romantic_01',
      peaceful: 'acoustic_calm_01'
    },
    electronic: {
      energetic: 'synth_modern_01',
      dynamic: 'edm_travel_01'
    }
  };

  const genreLibrary = musicLibrary[genre as keyof typeof musicLibrary];
  if (genreLibrary && typeof genreLibrary === 'object') {
    return (genreLibrary as any)[style] || 'default_track_01';
  }
  return 'default_track_01';
}

function generateTransitions(photoCount: number, style: string, settings: VideoSettings): VideoTransition[] {
  const transitions: VideoTransition[] = [];
  
  const transitionTypes = {
    cinematic: ['fade', 'dissolve'],
    energetic: ['slide', 'zoom'],
    peaceful: ['fade', 'dissolve'],
    dynamic: ['slide', 'wipe', 'zoom'],
    nostalgic: ['fade', 'dissolve']
  };
  
  const availableTransitions = transitionTypes[style as keyof typeof transitionTypes] || ['fade'];
  
  for (let i = 0; i < photoCount - 1; i++) {
    const transitionType = availableTransitions[i % availableTransitions.length];
    transitions.push({
      type: transitionType as any,
      duration: style === 'energetic' ? 0.3 : style === 'peaceful' ? 1.0 : 0.5,
      direction: transitionType === 'slide' ? (['left', 'right', 'up', 'down'][i % 4] as any) : undefined
    });
  }
  
  return transitions;
}

function getTransitionForPhoto(index: number, totalPhotos: number, template: string): VideoTransition {
  if (index === 0) {
    return { type: 'fade', duration: 1.0 };
  }
  
  if (index === totalPhotos - 1) {
    return { type: 'fade', duration: 1.5 };
  }
  
  const transitions = ['fade', 'slide', 'zoom', 'dissolve'];
  return {
    type: transitions[index % transitions.length] as any,
    duration: 0.5
  };
}

function getEffectsForPhoto(photo: any, analysis: any, settings: VideoSettings): any {
  const effects = {
    zoom: false,
    pan: false,
    colorGrading: 'auto',
    stabilization: true
  };
  
  // Add zoom effect for landscapes
  if (photo.originalName?.toLowerCase().includes('landscape') || 
      photo.originalName?.toLowerCase().includes('paysage')) {
    effects.zoom = true;
  }
  
  // Add pan effect for wide photos
  if (photo.width && photo.height && photo.width / photo.height > 2) {
    effects.pan = true;
  }
  
  return effects;
}

function generateTextOverlay(photo: any, index: number, totalPhotos: number): any {
  if (index === 0) {
    return {
      text: "Notre voyage commence...",
      position: 'bottom-center',
      duration: 2.0,
      style: 'elegant'
    };
  }
  
  if (index === totalPhotos - 1) {
    return {
      text: "Des souvenirs inoubliables",
      position: 'center',
      duration: 3.0,
      style: 'elegant'
    };
  }
  
  if (photo.location) {
    return {
      text: photo.location,
      position: 'bottom-left',
      duration: 1.5,
      style: 'minimal'
    };
  }
  
  return null;
}

function calculateVideoMetadata(photos: any[], transitions: VideoTransition[], musicTrack: string, settings: VideoSettings): any {
  const estimatedFileSize = calculateFileSize(photos.length, settings.duration, settings.quality);
  
  return {
    photoCount: photos.length,
    transitionCount: transitions.length,
    musicTrack,
    fileSize: estimatedFileSize,
    encoding: {
      codec: 'H.264',
      bitrate: settings.quality === '4K' ? '50 Mbps' : settings.quality === '1080p' ? '15 Mbps' : '8 Mbps',
      framerate: settings.framerate
    }
  };
}

function calculateFileSize(photoCount: number, duration: number, quality: string): string {
  const baseSizes = {
    '720p': 2, // MB per minute
    '1080p': 5,
    '4K': 15
  };
  
  const sizePerMinute = baseSizes[quality as keyof typeof baseSizes] || 5;
  const totalSize = (duration / 60) * sizePerMinute;
  
  return `${totalSize.toFixed(1)} MB`;
}

export async function selectBestPhotosForVideo(
  photos: any[], 
  template: VideoTemplate, 
  duration: number, 
  criteria: any
): Promise<number[]> {
  try {
    const maxPhotos = Math.floor(duration * 0.5); // 0.5 photos per second average
    
    if (photos.length <= maxPhotos) {
      return photos.map(p => p.id);
    }

    const photoDescriptions = photos.map((photo, index) => 
      `${index}: ${photo.originalName} ${photo.caption || ''} ${photo.location || ''} (${photo.uploadedAt})`
    ).join('\n');

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Tu es un expert en sélection de photos pour vidéos. Sélectionne les ${maxPhotos} meilleures photos pour une vidéo ${template.style} de ${duration} secondes. Critères:
          
- Diversité visuelle (éviter les doublons)
- Qualité photographique
- Pertinence narrative
- Distribution chronologique
- Impact émotionnel

Réponds avec un JSON contenant uniquement les indices des photos sélectionnées:
{"selectedIndices": [0, 3, 7, 12, ...]}`
        },
        {
          role: "user",
          content: `Sélectionne ${maxPhotos} photos parmi ces ${photos.length} options pour une vidéo ${template.category}:\n\n${photoDescriptions}`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 1000,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    const selectedIndices = result.selectedIndices || [];
    
    return selectedIndices.map((index: number) => photos[index]?.id).filter(Boolean);

  } catch (error) {
    console.error("Error selecting photos for video:", error);
    
    // Fallback: intelligent selection without AI
    const maxCount = Math.floor(duration * 0.5);
    const step = Math.ceil(photos.length / maxCount);
    return photos.filter((_, index) => index % step === 0).slice(0, maxCount).map(p => p.id);
  }
}

async function generateVideoDescription(photos: any[], template: VideoTemplate): Promise<string> {
  try {
    const photoSample = photos.slice(0, 5).map(p => 
      `${p.originalName}: ${p.caption || ''} ${p.location || ''}`
    ).join('; ');

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Tu es un expert en description de vidéos de voyage. Écris une description courte et engageante (max 100 mots) pour cette vidéo."
        },
        {
          role: "user",
          content: `Génère une description pour une vidéo ${template.style} créée à partir de ces photos: ${photoSample}`
        }
      ],
      temperature: 0.7,
      max_tokens: 150,
    });

    return response.choices[0].message.content || "Une magnifique vidéo de voyage capturant nos meilleurs moments.";

  } catch (error) {
    console.error("Error generating video description:", error);
    return "Une magnifique vidéo de voyage capturant nos meilleurs moments.";
  }
}

export async function optimizeVideoForPlatform(video: GeneratedVideo, platform: 'youtube' | 'instagram' | 'tiktok' | 'facebook'): Promise<any> {
  const platformSpecs = {
    youtube: { aspectRatio: '16:9', maxDuration: 900, quality: '1080p' },
    instagram: { aspectRatio: '1:1', maxDuration: 60, quality: '1080p' },
    tiktok: { aspectRatio: '9:16', maxDuration: 180, quality: '1080p' },
    facebook: { aspectRatio: '16:9', maxDuration: 240, quality: '720p' }
  };

  const specs = platformSpecs[platform];
  
  return {
    originalVideo: video,
    optimizedSettings: {
      aspectRatio: specs.aspectRatio,
      duration: Math.min(video.duration, specs.maxDuration),
      quality: specs.quality,
      compressionLevel: platform === 'tiktok' ? 'high' : 'medium',
      audioLeveling: true,
      captions: platform === 'tiktok' || platform === 'instagram'
    },
    estimatedFileSize: calculateFileSize(video.metadata.photoCount, Math.min(video.duration, specs.maxDuration), specs.quality)
  };
}

export async function generateVideoScript(photos: any[], template: VideoTemplate, duration: number): Promise<string> {
  try {
    const keyPhotos = photos.slice(0, 10);
    const photoContext = keyPhotos.map(p => 
      `${p.originalName}: ${p.caption || ''} ${p.location || ''}`
    ).join('\n');

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Tu es un scénariste spécialisé dans les vidéos de voyage. Crée un script de ${duration} secondes pour une vidéo ${template.style}. 

Format souhaité:
[00:00-00:05] INTRO: Texte d'introduction
[00:05-00:15] DÉVELOPPEMENT: Description des moments clés
[00:15-00:25] CLIMAX: Point culminant du voyage
[00:25-00:30] CONCLUSION: Message final`
        },
        {
          role: "user",
          content: `Crée un script pour une vidéo ${template.category} de ${duration} secondes basée sur ces photos:\n\n${photoContext}`
        }
      ],
      temperature: 0.6,
      max_tokens: 800,
    });

    return response.choices[0].message.content || "";

  } catch (error) {
    console.error("Error generating video script:", error);
    return "";
  }
}