import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface DetectedFace {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  personId?: string;
  personName?: string;
  age?: number;
  gender?: string;
  emotion?: string;
  ethnicity?: string;
  landmarks?: FaceLandmark[];
  isVerified?: boolean;
}

interface FaceLandmark {
  type: 'left_eye' | 'right_eye' | 'nose' | 'mouth' | 'left_eyebrow' | 'right_eyebrow';
  x: number;
  y: number;
}

interface FaceAnalysisResult {
  faces: DetectedFace[];
  totalFaces: number;
  uniquePeople: number;
  groupSize: 'solo' | 'couple' | 'small_group' | 'large_group';
  mood: 'happy' | 'serious' | 'neutral' | 'mixed';
  setting: 'indoor' | 'outdoor' | 'unknown';
  confidence: number;
}

interface Person {
  id: string;
  name: string;
  photoCount: number;
  firstSeen: string;
  lastSeen: string;
  avatarUrl?: string;
  isFamily?: boolean;
  isFriend?: boolean;
  notes?: string;
  tags?: string[];
}

export async function detectFacesInImage(imageUrl: string): Promise<FaceAnalysisResult> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Tu es un expert en analyse faciale. Analyse cette image et détecte tous les visages humains présents. Pour chaque visage détecté, fournis les informations suivantes en JSON:

{
  "faces": [
    {
      "id": "face_1",
      "x": 0.1,
      "y": 0.2,
      "width": 0.15,
      "height": 0.2,
      "confidence": 0.95,
      "age": 25,
      "gender": "femme",
      "emotion": "joyeux",
      "ethnicity": "caucasien",
      "landmarks": [
        {"type": "left_eye", "x": 0.12, "y": 0.25},
        {"type": "right_eye", "x": 0.18, "y": 0.25}
      ]
    }
  ],
  "totalFaces": 1,
  "groupSize": "solo",
  "mood": "happy",
  "setting": "outdoor",
  "confidence": 0.95
}

Règles importantes:
- Les coordonnées (x, y, width, height) doivent être normalisées entre 0 et 1
- Estime l'âge approximatif (±5 ans)
- Identifie le genre (homme/femme/non-binaire)
- Détermine l'émotion principale (joyeux/triste/neutre/surpris/en colère)
- Analyse le cadre (indoor/outdoor/unknown)
- groupSize: solo (1), couple (2), small_group (3-6), large_group (7+)
- Fournis un score de confiance global`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyse cette image et détecte tous les visages humains avec leurs caractéristiques."
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl
              }
            }
          ]
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 2000,
    });

    const analysisResult = JSON.parse(response.choices[0].message.content || '{}');
    
    // Generate unique IDs for faces if not provided
    if (analysisResult.faces) {
      analysisResult.faces = analysisResult.faces.map((face: any, index: number) => ({
        ...face,
        id: face.id || `face_${Date.now()}_${index}`,
        confidence: face.confidence || 0.8
      }));
    }

    // Calculate unique people count (simplified - in real app would use face recognition)
    analysisResult.uniquePeople = analysisResult.totalFaces || analysisResult.faces?.length || 0;

    return {
      faces: analysisResult.faces || [],
      totalFaces: analysisResult.totalFaces || 0,
      uniquePeople: analysisResult.uniquePeople || 0,
      groupSize: analysisResult.groupSize || 'solo',
      mood: analysisResult.mood || 'neutral',
      setting: analysisResult.setting || 'unknown',
      confidence: analysisResult.confidence || 0.8
    };

  } catch (error) {
    console.error("Error detecting faces:", error);
    throw new Error("Failed to detect faces in image");
  }
}

export async function analyzeFaceCharacteristics(imageUrl: string, faceCoordinates: { x: number; y: number; width: number; height: number }): Promise<Partial<DetectedFace>> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Tu es un expert en analyse faciale détaillée. Analyse les caractéristiques spécifiques de ce visage et fournis des informations détaillées en JSON:

{
  "age": 28,
  "gender": "femme",
  "emotion": "joyeux",
  "ethnicity": "asiatique",
  "facialHair": "none",
  "glasses": false,
  "smile": true,
  "eyeColor": "marron",
  "hairColor": "noir",
  "skinTone": "medium",
  "confidence": 0.92,
  "landmarks": [
    {"type": "left_eye", "x": 0.45, "y": 0.35},
    {"type": "right_eye", "x": 0.55, "y": 0.35},
    {"type": "nose", "x": 0.5, "y": 0.45},
    {"type": "mouth", "x": 0.5, "y": 0.6}
  ]
}`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyse en détail ce visage situé approximativement aux coordonnées x:${faceCoordinates.x}, y:${faceCoordinates.y}, largeur:${faceCoordinates.width}, hauteur:${faceCoordinates.height}`
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl
              }
            }
          ]
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
      max_tokens: 1000,
    });

    const characteristics = JSON.parse(response.choices[0].message.content || '{}');
    return characteristics;

  } catch (error) {
    console.error("Error analyzing face characteristics:", error);
    return {};
  }
}

export async function compareFaces(imageUrl1: string, face1Coords: any, imageUrl2: string, face2Coords: any): Promise<{ similarity: number; isSamePerson: boolean; confidence: number }> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Tu es un expert en reconnaissance faciale. Compare ces deux visages et détermine s'il s'agit de la même personne. Fournis le résultat en JSON:

{
  "similarity": 0.85,
  "isSamePerson": true,
  "confidence": 0.92,
  "reasoning": "Les caractéristiques faciales principales (yeux, nez, forme du visage) correspondent avec une forte probabilité"
}

Critères d'évaluation:
- Forme du visage
- Position et forme des yeux
- Forme du nez
- Structure de la bouche
- Oreilles (si visibles)
- Grain de beauté ou marques distinctives
- similarity: score de 0 à 1
- isSamePerson: true si similarity > 0.75
- confidence: confiance dans l'analyse`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Compare ces deux visages et détermine s'il s'agit de la même personne."
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl1
              }
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl2
              }
            }
          ]
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
      max_tokens: 500,
    });

    const comparison = JSON.parse(response.choices[0].message.content || '{}');
    return {
      similarity: comparison.similarity || 0,
      isSamePerson: comparison.isSamePerson || false,
      confidence: comparison.confidence || 0.5
    };

  } catch (error) {
    console.error("Error comparing faces:", error);
    return { similarity: 0, isSamePerson: false, confidence: 0 };
  }
}

export async function generateFaceDescription(imageUrl: string, faceCoordinates: { x: number; y: number; width: number; height: number }): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Tu es un expert en description faciale. Décris ce visage de manière précise et respectueuse pour aider à l'identification future."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Décris précisément ce visage pour aider à son identification future. Focus sur les caractéristiques distinctives permanentes.`
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl
              }
            }
          ]
        }
      ],
      temperature: 0.3,
      max_tokens: 200,
    });

    return response.choices[0].message.content || "Description non disponible";

  } catch (error) {
    console.error("Error generating face description:", error);
    return "Description non disponible";
  }
}

export async function extractFacialLandmarks(imageUrl: string): Promise<FaceLandmark[]> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Identifie précisément les points de repère faciaux dans cette image. Fournis les coordonnées normalisées (0-1) en JSON:

{
  "landmarks": [
    {"type": "left_eye", "x": 0.3, "y": 0.35},
    {"type": "right_eye", "x": 0.7, "y": 0.35},
    {"type": "nose", "x": 0.5, "y": 0.5},
    {"type": "mouth", "x": 0.5, "y": 0.7},
    {"type": "left_eyebrow", "x": 0.3, "y": 0.25},
    {"type": "right_eyebrow", "x": 0.7, "y": 0.25}
  ]
}`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Identifie les points de repère faciaux principaux avec leurs coordonnées précises."
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl
              }
            }
          ]
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
      max_tokens: 500,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return result.landmarks || [];

  } catch (error) {
    console.error("Error extracting facial landmarks:", error);
    return [];
  }
}

// Utility function to calculate face similarity based on landmarks
export function calculateFaceSimilarity(landmarks1: FaceLandmark[], landmarks2: FaceLandmark[]): number {
  if (!landmarks1.length || !landmarks2.length) return 0;

  const commonTypes = ['left_eye', 'right_eye', 'nose', 'mouth'];
  let totalDistance = 0;
  let validComparisons = 0;

  commonTypes.forEach(type => {
    const point1 = landmarks1.find(l => l.type === type);
    const point2 = landmarks2.find(l => l.type === type);

    if (point1 && point2) {
      const distance = Math.sqrt(
        Math.pow(point1.x - point2.x, 2) + Math.pow(point1.y - point2.y, 2)
      );
      totalDistance += distance;
      validComparisons++;
    }
  });

  if (validComparisons === 0) return 0;

  const avgDistance = totalDistance / validComparisons;
  // Convert distance to similarity (lower distance = higher similarity)
  return Math.max(0, 1 - (avgDistance * 10));
}

export function determineGroupDynamics(faces: DetectedFace[]): {
  groupSize: 'solo' | 'couple' | 'small_group' | 'large_group';
  mood: 'happy' | 'serious' | 'neutral' | 'mixed';
  ageGroups: string[];
  genderDistribution: { [key: string]: number };
} {
  const faceCount = faces.length;
  
  let groupSize: 'solo' | 'couple' | 'small_group' | 'large_group';
  if (faceCount === 1) groupSize = 'solo';
  else if (faceCount === 2) groupSize = 'couple';
  else if (faceCount <= 6) groupSize = 'small_group';
  else groupSize = 'large_group';

  // Analyze emotions
  const emotions = faces.map(f => f.emotion).filter(Boolean);
  const happyCount = emotions.filter(e => e === 'joyeux' || e === 'happy').length;
  const sadCount = emotions.filter(e => e === 'triste' || e === 'sad').length;
  const neutralCount = emotions.filter(e => e === 'neutre' || e === 'neutral').length;

  let mood: 'happy' | 'serious' | 'neutral' | 'mixed';
  if (happyCount > emotions.length * 0.6) mood = 'happy';
  else if (sadCount > emotions.length * 0.4) mood = 'serious';
  else if (neutralCount > emotions.length * 0.6) mood = 'neutral';
  else mood = 'mixed';

  // Age groups
  const ages = faces.map(f => f.age).filter(Boolean) as number[];
  const ageGroups: string[] = [];
  if (ages.some(age => age < 18)) ageGroups.push('enfants');
  if (ages.some(age => age >= 18 && age < 35)) ageGroups.push('jeunes adultes');
  if (ages.some(age => age >= 35 && age < 60)) ageGroups.push('adultes');
  if (ages.some(age => age >= 60)) ageGroups.push('seniors');

  // Gender distribution
  const genderDistribution: { [key: string]: number } = {};
  faces.forEach(face => {
    if (face.gender) {
      genderDistribution[face.gender] = (genderDistribution[face.gender] || 0) + 1;
    }
  });

  return {
    groupSize,
    mood,
    ageGroups,
    genderDistribution
  };
}