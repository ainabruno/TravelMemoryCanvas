import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
let openai: OpenAI | null = null;

try {
  if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
} catch (error) {
  console.warn('OpenAI client initialization failed:', error);
}

interface PhotoBookData {
  title: string;
  subtitle?: string;
  tripId?: number;
  albumId?: number;
  format: 'square' | 'landscape' | 'portrait';
  size: 'small' | 'medium' | 'large';
  theme: string;
  photos: any[];
  settings: {
    autoLayout: boolean;
    includeMap: boolean;
    includeStory: boolean;
  };
}

interface PhotoBookPage {
  id: string;
  pageNumber: number;
  layout: 'single' | 'double' | 'grid' | 'collage' | 'story';
  background: string;
  elements: PageElement[];
}

interface PageElement {
  id: string;
  type: 'photo' | 'text' | 'shape' | 'map';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  data: any;
  style: ElementStyle;
}

interface ElementStyle {
  borderRadius: number;
  borderWidth: number;
  borderColor: string;
  shadow: boolean;
  opacity: number;
  filter?: string;
}

interface PhotoBook {
  id: string;
  title: string;
  subtitle?: string;
  tripId?: number;
  albumId?: number;
  coverImage?: string;
  format: 'square' | 'landscape' | 'portrait';
  size: 'small' | 'medium' | 'large';
  theme: string;
  pages: PhotoBookPage[];
  totalPages: number;
  createdAt: string;
  updatedAt: string;
  isPublished: boolean;
  printReady: boolean;
}

export async function generatePhotoBookLayout(data: PhotoBookData): Promise<PhotoBook> {
  try {
    const { title, subtitle, format, size, theme, photos, settings } = data;
    
    // Analyze photos for optimal layout
    const photoAnalysis = await analyzePhotosForLayout(photos);
    
    // Generate page structure
    const pageCount = calculatePageCount(size, photos.length);
    const pages = await generatePages(photos, photoAnalysis, format, theme, settings, pageCount);
    
    // Select cover image
    const coverImage = selectBestCoverImage(photos, photoAnalysis);
    
    const photoBook: PhotoBook = {
      id: `book_${Date.now()}`,
      title,
      subtitle,
      tripId: data.tripId,
      albumId: data.albumId,
      coverImage: coverImage?.url,
      format,
      size,
      theme,
      pages,
      totalPages: pages.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPublished: false,
      printReady: true
    };

    return photoBook;

  } catch (error) {
    console.error("Error generating photo book layout:", error);
    throw new Error("Failed to generate photo book layout");
  }
}

async function analyzePhotosForLayout(photos: any[]): Promise<any> {
  if (!photos || photos.length === 0) {
    return { categories: [], highlights: [], storytelling: [] };
  }

  if (!openai) {
    return { 
      categories: [
        { name: "Photos", count: photos.length, priority: "medium" }
      ], 
      highlights: photos.slice(0, 3).map((photo, index) => ({
        photoIndex: index,
        reason: "Image sélectionnée",
        suggestedLayout: "single"
      })),
      storytelling: {
        chronology: "linear",
        mood: "neutral",
        keyMoments: ["Début", "Exploration", "Fin"],
        suggestedFlow: ["intro", "gallery", "conclusion"]
      }
    };
  }

  try {
    // Analyze first few photos to understand the collection
    const samplePhotos = photos.slice(0, 10);
    const photoDescriptions = samplePhotos.map(photo => 
      `Photo: ${photo.originalName || 'untitled'} ${photo.caption ? `- ${photo.caption}` : ''} ${photo.location ? `at ${photo.location}` : ''}`
    ).join('\n');

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Tu es un expert en création de livres photo. Analyse cette collection de photos de voyage et fournis des recommandations pour l'organisation en JSON:

{
  "categories": [
    {"name": "Paysages", "count": 15, "priority": "high"},
    {"name": "Portraits", "count": 8, "priority": "medium"}
  ],
  "highlights": [
    {"photoIndex": 0, "reason": "Vue panoramique exceptionnelle", "suggestedLayout": "single"},
    {"photoIndex": 3, "reason": "Moment authentique", "suggestedLayout": "double"}
  ],
  "storytelling": {
    "chronology": "linear",
    "mood": "adventurous",
    "keyMoments": ["Arrivée", "Exploration", "Rencontres", "Départ"],
    "suggestedFlow": ["intro", "discovery", "highlights", "conclusion"]
  },
  "layoutRecommendations": {
    "coverStyle": "landscape_hero",
    "pageTypes": ["intro", "gallery", "story", "map", "conclusion"],
    "photoGrouping": "by_location"
  }
}`
        },
        {
          role: "user",
          content: `Analyse cette collection de photos de voyage et recommande la meilleure organisation pour un livre photo:\n\n${photoDescriptions}`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.4,
      max_tokens: 1500,
    });

    return JSON.parse(response.choices[0].message.content || '{}');

  } catch (error) {
    console.error("Error analyzing photos for layout:", error);
    return { categories: [], highlights: [], storytelling: [] };
  }
}

async function generatePages(
  photos: any[], 
  analysis: any, 
  format: string, 
  theme: string, 
  settings: any, 
  targetPageCount: number
): Promise<PhotoBookPage[]> {
  
  const pages: PhotoBookPage[] = [];
  const photosPerPage = Math.ceil(photos.length / (targetPageCount - 2)); // Reserve pages for intro/conclusion
  
  // Cover page
  pages.push(await generateCoverPage(photos[0], format, theme));
  
  // Group photos into pages
  for (let i = 0; i < photos.length; i += photosPerPage) {
    const pagePhotos = photos.slice(i, i + photosPerPage);
    const pageLayout = determineOptimalLayout(pagePhotos, analysis, format);
    
    const page = await generatePhotoPage(
      pagePhotos, 
      pages.length + 1, 
      pageLayout, 
      format, 
      theme,
      settings
    );
    
    pages.push(page);
  }
  
  // Add map page if requested
  if (settings.includeMap && photos.some(p => p.latitude && p.longitude)) {
    pages.push(await generateMapPage(photos, pages.length + 1, format, theme));
  }
  
  return pages;
}

async function generateCoverPage(coverPhoto: any, format: string, theme: string): Promise<PhotoBookPage> {
  return {
    id: `page_cover`,
    pageNumber: 1,
    layout: 'single',
    background: getThemeBackground(theme),
    elements: [
      {
        id: 'cover_photo',
        type: 'photo',
        x: 0,
        y: 0,
        width: 1,
        height: 1,
        rotation: 0,
        data: { url: coverPhoto?.url, alt: 'Cover photo' },
        style: {
          borderRadius: 0,
          borderWidth: 0,
          borderColor: '#000000',
          shadow: false,
          opacity: 1
        }
      }
    ]
  };
}

async function generatePhotoPage(
  pagePhotos: any[], 
  pageNumber: number, 
  layout: string, 
  format: string, 
  theme: string,
  settings: any
): Promise<PhotoBookPage> {
  
  const elements: PageElement[] = [];
  
  // Generate photo elements based on layout
  if (layout === 'single' && pagePhotos.length > 0) {
    elements.push({
      id: `photo_${pageNumber}_1`,
      type: 'photo',
      x: 0.1,
      y: 0.1,
      width: 0.8,
      height: 0.8,
      rotation: 0,
      data: { url: pagePhotos[0].url, caption: pagePhotos[0].caption },
      style: {
        borderRadius: 8,
        borderWidth: 0,
        borderColor: '#ffffff',
        shadow: true,
        opacity: 1
      }
    });
  } else if (layout === 'grid' && pagePhotos.length > 1) {
    const cols = Math.ceil(Math.sqrt(pagePhotos.length));
    const rows = Math.ceil(pagePhotos.length / cols);
    const photoWidth = 0.8 / cols;
    const photoHeight = 0.8 / rows;
    
    pagePhotos.forEach((photo, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      
      elements.push({
        id: `photo_${pageNumber}_${index + 1}`,
        type: 'photo',
        x: 0.1 + (col * photoWidth),
        y: 0.1 + (row * photoHeight),
        width: photoWidth * 0.95,
        height: photoHeight * 0.95,
        rotation: 0,
        data: { url: photo.url, caption: photo.caption },
        style: {
          borderRadius: 4,
          borderWidth: 0,
          borderColor: '#ffffff',
          shadow: true,
          opacity: 1
        }
      });
    });
  }
  
  // Add text elements if story mode
  if (settings.includeStory && pagePhotos.length > 0) {
    const storyText = await generatePageStory(pagePhotos);
    if (storyText) {
      elements.push({
        id: `story_${pageNumber}`,
        type: 'text',
        x: 0.1,
        y: 0.85,
        width: 0.8,
        height: 0.1,
        rotation: 0,
        data: { text: storyText },
        style: {
          borderRadius: 0,
          borderWidth: 0,
          borderColor: '#000000',
          shadow: false,
          opacity: 1
        }
      });
    }
  }
  
  return {
    id: `page_${pageNumber}`,
    pageNumber,
    layout: layout as any,
    background: getThemeBackground(theme),
    elements
  };
}

async function generateMapPage(photos: any[], pageNumber: number, format: string, theme: string): Promise<PhotoBookPage> {
  const locationsWithCoords = photos.filter(p => p.latitude && p.longitude);
  
  return {
    id: `page_map_${pageNumber}`,
    pageNumber,
    layout: 'single',
    background: getThemeBackground(theme),
    elements: [
      {
        id: 'travel_map',
        type: 'map',
        x: 0.1,
        y: 0.1,
        width: 0.8,
        height: 0.8,
        rotation: 0,
        data: { 
          locations: locationsWithCoords,
          style: 'travel',
          showRoute: true
        },
        style: {
          borderRadius: 8,
          borderWidth: 2,
          borderColor: getThemeColor(theme, 'primary'),
          shadow: true,
          opacity: 1
        }
      }
    ]
  };
}

async function generatePageStory(photos: any[]): Promise<string | null> {
  if (!photos.length) return null;
  
  if (!openai) {
    return null;
  }
  
  try {
    const photoContext = photos.map(p => 
      `${p.originalName}: ${p.caption || 'No caption'} ${p.location ? `at ${p.location}` : ''}`
    ).join('; ');

    const response = await openai!.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Tu es un écrivain spécialisé dans les récits de voyage. Écris un court texte (2-3 phrases) qui raconte l'histoire de ces photos pour un livre photo. Sois poétique et évocateur."
        },
        {
          role: "user",
          content: `Écris un court récit pour cette page de livre photo basé sur ces images: ${photoContext}`
        }
      ],
      temperature: 0.7,
      max_tokens: 150,
    });

    return response.choices[0].message.content || null;

  } catch (error) {
    console.error("Error generating page story:", error);
    return null;
  }
}

function calculatePageCount(size: string, photoCount: number): number {
  const basePages = {
    small: 20,
    medium: 40,
    large: 80
  };
  
  const targetPages = basePages[size as keyof typeof basePages] || 40;
  
  // Adjust based on photo count
  if (photoCount < 10) return Math.min(targetPages, 20);
  if (photoCount > 100) return Math.max(targetPages, 60);
  
  return targetPages;
}

function determineOptimalLayout(photos: any[], analysis: any, format: string): string {
  if (photos.length === 1) return 'single';
  if (photos.length === 2) return 'double';
  if (photos.length <= 6) return 'grid';
  return 'collage';
}

function selectBestCoverImage(photos: any[], analysis: any): any {
  // Select the first photo with high priority or the first landscape photo
  const highlights = analysis.highlights || [];
  if (highlights.length > 0) {
    const bestHighlight = highlights.find((h: any) => h.priority === 'high');
    if (bestHighlight && photos[bestHighlight.photoIndex]) {
      return photos[bestHighlight.photoIndex];
    }
  }
  
  // Fallback to first photo
  return photos[0] || null;
}

function getThemeBackground(theme: string): string {
  const backgrounds = {
    adventure: '#f8fafc',
    romantic: '#fdf2f8',
    minimal: '#ffffff',
    vintage: '#fef3c7'
  };
  
  return backgrounds[theme as keyof typeof backgrounds] || '#ffffff';
}

function getThemeColor(theme: string, type: 'primary' | 'secondary' | 'accent'): string {
  const colors = {
    adventure: { primary: '#16a34a', secondary: '#0284c7', accent: '#f59e0b' },
    romantic: { primary: '#ec4899', secondary: '#a855f7', accent: '#f97316' },
    minimal: { primary: '#374151', secondary: '#6b7280', accent: '#059669' },
    vintage: { primary: '#d97706', secondary: '#92400e', accent: '#dc2626' }
  };
  
  return colors[theme as keyof typeof colors]?.[type] || '#374151';
}

export async function generateSmartLayouts(photos: any[], theme: any, settings: any): Promise<any[]> {
  try {
    const analysis = await analyzePhotosForLayout(photos);
    
    const layouts = [];
    const photosPerLayout = Math.ceil(photos.length / 5); // 5 different layout suggestions
    
    for (let i = 0; i < 5; i++) {
      const startIndex = i * photosPerLayout;
      const layoutPhotos = photos.slice(startIndex, startIndex + photosPerLayout);
      
      if (layoutPhotos.length === 0) break;
      
      const layout = {
        id: `layout_${i + 1}`,
        name: getLayoutName(i),
        photos: layoutPhotos,
        structure: determineOptimalLayout(layoutPhotos, analysis, 'landscape'),
        preview: await generateLayoutPreview(layoutPhotos, theme)
      };
      
      layouts.push(layout);
    }
    
    return layouts;

  } catch (error) {
    console.error("Error generating smart layouts:", error);
    return [];
  }
}

function getLayoutName(index: number): string {
  const names = [
    'Mise en page classique',
    'Grille moderne',
    'Collage artistique',
    'Focus portrait',
    'Panorama paysage'
  ];
  
  return names[index] || `Mise en page ${index + 1}`;
}

async function generateLayoutPreview(photos: any[], theme: any): Promise<string> {
  // Generate a simple preview description
  const photoCount = photos.length;
  const hasPortraits = photos.some(p => p.originalName?.toLowerCase().includes('portrait'));
  const hasLandscapes = photos.some(p => p.originalName?.toLowerCase().includes('landscape') || p.originalName?.toLowerCase().includes('paysage'));
  
  if (photoCount === 1) return "Photo unique en pleine page";
  if (photoCount === 2) return "Deux photos côte à côte";
  if (hasPortraits && hasLandscapes) return "Mix portraits et paysages";
  if (hasPortraits) return "Galerie de portraits";
  if (hasLandscapes) return "Collection de paysages";
  
  return `Grille de ${photoCount} photos`;
}

export async function generatePhotoBookNarrative(photos: any[], tripData: any): Promise<string> {
  if (!openai) {
    return `Découvrez votre voyage à travers ${photos.length} photos exceptionnelles qui racontent votre histoire unique.`;
  }
  
  try {
    const photoContext = photos.slice(0, 10).map(p => 
      `${p.originalName}: ${p.caption || ''} ${p.location || ''}`
    ).join('\n');

    const response = await openai!.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Tu es un écrivain spécialisé dans les livres photo de voyage. Écris un texte narratif qui accompagnera ce livre photo, en te basant sur les images et les informations du voyage."
        },
        {
          role: "user",
          content: `Voyage: ${tripData?.title || 'Voyage'}\nDescription: ${tripData?.description || ''}\nLieu: ${tripData?.location || ''}\n\nPhotos:\n${photoContext}\n\nÉcris un texte narratif engageant pour ce livre photo de voyage.`
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    return response.choices[0].message.content || "Ce voyage restera gravé dans nos mémoires...";

  } catch (error) {
    console.error("Error generating photo book narrative:", error);
    return "Ce voyage restera gravé dans nos mémoires...";
  }
}