import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface StorySettings {
  style: 'narrative' | 'diary' | 'blog' | 'social' | 'formal';
  mood: 'adventurous' | 'romantic' | 'peaceful' | 'exciting' | 'nostalgic';
  length: 'short' | 'medium' | 'long';
  includePhotos: boolean;
  includeMap: boolean;
  includeStats: boolean;
  focusPoints: string[];
  personalTouch: boolean;
  language: 'french' | 'english';
}

interface TravelStoryData {
  tripData: any;
  photos: any[];
  settings: StorySettings;
  customPrompt?: string;
}

interface TravelStory {
  id: string;
  title: string;
  content: string;
  style: string;
  mood: string;
  length: string;
  includePhotos: boolean;
  includeMap: boolean;
  includeStats: boolean;
  generatedAt: string;
  wordCount: number;
  readingTime: number;
  highlights: string[];
  photos: Array<{
    id: number;
    url: string;
    caption: string;
    location?: string;
  }>;
}

export async function generateTravelStory(data: TravelStoryData): Promise<TravelStory> {
  const { tripData, photos, settings, customPrompt } = data;

  // Build context for the AI
  const context = buildStoryContext(tripData, photos, settings);
  
  // Generate the story based on settings
  const prompt = buildStoryPrompt(context, settings, customPrompt);
  
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: getSystemPrompt(settings)
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: getMaxTokens(settings.length),
    });

    const generatedContent = response.choices[0].message.content || "";
    
    // Extract title and content
    const { title, content } = parseGeneratedStory(generatedContent, tripData?.title);
    
    // Calculate stats
    const wordCount = content.split(' ').length;
    const readingTime = Math.ceil(wordCount / 200);

    // Extract highlights
    const highlights = extractHighlights(content);

    return {
      id: `story-${Date.now()}`,
      title,
      content,
      style: settings.style,
      mood: settings.mood,
      length: settings.length,
      includePhotos: settings.includePhotos,
      includeMap: settings.includeMap,
      includeStats: settings.includeStats,
      generatedAt: new Date().toISOString(),
      wordCount,
      readingTime,
      highlights,
      photos: settings.includePhotos ? photos.slice(0, 6).map(photo => ({
        id: photo.id,
        url: photo.url,
        caption: photo.caption || photo.originalName || '',
        location: photo.location
      })) : []
    };

  } catch (error) {
    console.error("Error generating story:", error);
    throw new Error("Failed to generate travel story");
  }
}

function buildStoryContext(tripData: any, photos: any[], settings: StorySettings): string {
  let context = "";

  // Trip information
  if (tripData) {
    context += `Voyage: ${tripData.title}\n`;
    if (tripData.description) context += `Description: ${tripData.description}\n`;
    if (tripData.location) context += `Destination: ${tripData.location}\n`;
    if (tripData.startDate) context += `Date de début: ${new Date(tripData.startDate).toLocaleDateString('fr-FR')}\n`;
    if (tripData.endDate) context += `Date de fin: ${new Date(tripData.endDate).toLocaleDateString('fr-FR')}\n`;
    context += "\n";
  }

  // Photos information
  if (photos && photos.length > 0) {
    context += `Photos du voyage (${photos.length} photos):\n`;
    photos.slice(0, 10).forEach((photo, index) => {
      context += `${index + 1}. `;
      if (photo.caption) context += `${photo.caption} `;
      if (photo.location) context += `(${photo.location}) `;
      if (photo.originalName) context += `[${photo.originalName}]`;
      context += "\n";
    });
    context += "\n";
  }

  return context;
}

function getSystemPrompt(settings: StorySettings): string {
  const language = settings.language === 'french' ? 'français' : 'English';
  const styleDescriptions = {
    narrative: "un récit narratif fluide et engageant, comme une histoire",
    diary: "un journal intime personnel et authentique",
    blog: "un article de blog informatif et bien structuré",
    social: "un post court et accrocheur pour les réseaux sociaux",
    formal: "un rapport de voyage professionnel et détaillé"
  };

  const moodDescriptions = {
    adventurous: "aventurier et dynamique",
    romantic: "romantique et chaleureux",
    peaceful: "paisible et contemplatif",
    exciting: "excitant et énergique",
    nostalgic: "nostalgique et émotionnel"
  };

  return `Tu es un écrivain spécialisé dans les récits de voyage. Tu dois créer un récit de voyage en ${language} avec les caractéristiques suivantes:

Style: ${styleDescriptions[settings.style]}
Ton: ${moodDescriptions[settings.mood]}
Longueur: ${settings.length === 'short' ? 'court (200-300 mots)' : settings.length === 'medium' ? 'moyen (400-600 mots)' : 'long (800-1200 mots)'}

Règles importantes:
- Écris dans un style ${settings.personalTouch ? 'personnel et authentique' : 'objectif et informatif'}
- Utilise les informations fournies pour créer un récit cohérent
- Commence par un titre accrocheur sur une ligne séparée
- Crée un récit fluide qui raconte l'histoire du voyage
- Utilise des détails sensoriels et émotionnels
- Adapte le vocabulaire au style demandé
- Évite les répétitions et les généralités`;
}

function buildStoryPrompt(context: string, settings: StorySettings, customPrompt?: string): string {
  let prompt = `Basé sur les informations suivantes, crée un récit de voyage captivant:\n\n${context}`;

  if (settings.focusPoints && settings.focusPoints.length > 0) {
    prompt += `\nPoints à mettre en avant: ${settings.focusPoints.join(', ')}\n`;
  }

  if (customPrompt) {
    prompt += `\nInstructions personnalisées: ${customPrompt}\n`;
  }

  prompt += `\nCrée un récit qui capture l'essence de ce voyage et transporte le lecteur dans cette expérience.`;

  return prompt;
}

function getMaxTokens(length: string): number {
  switch (length) {
    case 'short': return 400;
    case 'medium': return 800;
    case 'long': return 1500;
    default: return 800;
  }
}

function parseGeneratedStory(content: string, fallbackTitle?: string): { title: string; content: string } {
  const lines = content.split('\n');
  
  // Look for a title in the first few lines
  let title = fallbackTitle || "Mon voyage";
  let storyContent = content;

  // Check if first line looks like a title
  if (lines.length > 0 && lines[0].length < 100 && !lines[0].includes('.')) {
    title = lines[0].trim();
    storyContent = lines.slice(1).join('\n').trim();
  }

  // Remove common title prefixes
  title = title.replace(/^(Titre:\s*|Title:\s*)/i, '').trim();

  return { title, content: storyContent };
}

function extractHighlights(content: string): string[] {
  const highlights: string[] = [];
  
  // Simple extraction of potential highlights
  // This could be enhanced with more sophisticated NLP
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
  
  // Look for sentences with emotional or descriptive words
  const emotionalWords = /\b(magnifique|incroyable|extraordinaire|merveilleux|inoubliable|fascinant|impressionnant|spectaculaire)\b/gi;
  
  sentences.forEach(sentence => {
    if (emotionalWords.test(sentence) && sentence.length < 150) {
      highlights.push(sentence.trim());
    }
  });

  // Limit to 3-5 highlights
  return highlights.slice(0, 5);
}

export async function enhanceStoryWithDetails(story: string, photos: any[]): Promise<string> {
  if (!photos || photos.length === 0) return story;

  try {
    const photoDescriptions = photos.slice(0, 5).map(photo => 
      `Photo: ${photo.caption || photo.originalName} ${photo.location ? `à ${photo.location}` : ''}`
    ).join('\n');

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Tu es un écrivain de voyage. Enrichis le récit existant en y intégrant naturellement les détails des photos mentionnées."
        },
        {
          role: "user",
          content: `Récit existant:\n${story}\n\nPhotos disponibles:\n${photoDescriptions}\n\nAméliore le récit en intégrant ces éléments visuels de manière naturelle et fluide.`
        }
      ],
      temperature: 0.6,
      max_tokens: 1000,
    });

    return response.choices[0].message.content || story;
  } catch (error) {
    console.error("Error enhancing story:", error);
    return story;
  }
}

export async function generateStoryTitle(content: string, tripData?: any): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Tu es un expert en titres accrocheurs. Génère un titre captivant pour ce récit de voyage en français."
        },
        {
          role: "user",
          content: `Génère un titre accrocheur pour ce récit de voyage:\n\n${content.substring(0, 500)}...`
        }
      ],
      temperature: 0.8,
      max_tokens: 50,
    });

    return response.choices[0].message.content?.trim() || tripData?.title || "Mon voyage";
  } catch (error) {
    console.error("Error generating title:", error);
    return tripData?.title || "Mon voyage";
  }
}