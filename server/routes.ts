import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTripSchema, insertAlbumSchema, insertPhotoSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";

// Helper function to calculate distance between GPS coordinates
function calculateDistance(coord1: { latitude: number; longitude: number }, coord2: { latitude: number; longitude: number }): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(coord2.latitude - coord1.latitude);
  const dLon = toRadians(coord2.longitude - coord1.longitude);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(coord1.latitude)) * Math.cos(toRadians(coord2.latitude)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// Helper functions for location suggestions
function getSeason(date: Date): string {
  const month = date.getMonth() + 1;
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'winter';
}

function calculateAverageTripDuration(trips: any[]): number {
  if (trips.length === 0) return 7;
  
  const durations = trips
    .filter(trip => trip.startDate && trip.endDate)
    .map(trip => {
      const start = new Date(trip.startDate);
      const end = new Date(trip.endDate);
      return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    });
  
  return durations.length > 0 
    ? Math.round(durations.reduce((sum, d) => sum + d, 0) / durations.length)
    : 7;
}

function getMostActiveMonth(photos: any[]): string {
  const monthCounts = new Map<number, number>();
  
  photos.forEach(photo => {
    const month = new Date(photo.uploadedAt).getMonth();
    monthCounts.set(month, (monthCounts.get(month) || 0) + 1);
  });
  
  let maxCount = 0;
  let mostActiveMonth = 0;
  
  monthCounts.forEach((count, month) => {
    if (count > maxCount) {
      maxCount = count;
      mostActiveMonth = month;
    }
  });
  
  const monthNames = [
    'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
  ];
  
  return monthNames[mostActiveMonth];
}

function calculateTravelFrequency(trips: any[]): number {
  if (trips.length === 0) return 0;
  
  const now = new Date();
  const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  
  const recentTrips = trips.filter(trip => {
    const tripDate = new Date(trip.startDate);
    return tripDate >= oneYearAgo;
  });
  
  return recentTrips.length;
}

async function generateLocationSuggestions(filters: any, searchQuery: string, userHistory: any): Promise<any[]> {
  // Base suggestions database with diverse destinations
  const baseDestinations = [
    {
      id: 'kyoto-japan',
      name: 'Kyoto',
      country: 'Japon',
      region: 'Kansai',
      category: 'cultural',
      description: 'Ancienne capitale du Japon, Kyoto offre plus de 2000 temples et sanctuaires, des jardins zen paisibles et des quartiers traditionnels préservés.',
      highlights: ['Temples historiques', 'Jardins zen', 'Geishas', 'Cuisine traditionnelle'],
      bestTime: 'Mars-Mai, Oct-Nov',
      duration: '4-7 jours',
      difficulty: 'easy',
      budget: 'medium',
      rating: 4.8,
      imageUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400&h=300&fit=crop',
      latitude: 35.0116,
      longitude: 135.7681,
      weatherScore: 85,
      popularityScore: 92,
      activities: ['Visite de temples', 'Cérémonie du thé', 'Promenade en bambouseraie', 'Cuisine kaiseki'],
      nearbyAttractions: ['Fushimi Inari', 'Arashiyama', 'Gion District'],
      localCuisine: ['Kaiseki', 'Tofu', 'Matcha', 'Wagyu'],
      safetyRating: 95,
      touristSeason: 'high',
      accessibility: true,
      estimatedCost: 1200
    },
    {
      id: 'reykjavik-iceland',
      name: 'Reykjavik',
      country: 'Islande',
      region: 'Capital Region',
      category: 'nature',
      description: 'Capitale la plus septentrionale du monde, Reykjavik est la porte d\'entrée vers les merveilles naturelles de l\'Islande.',
      highlights: ['Aurores boréales', 'Geysers', 'Piscines géothermiques', 'Glaciers'],
      bestTime: 'Juin-Août, Déc-Mars',
      duration: '5-10 jours',
      difficulty: 'medium',
      budget: 'high',
      rating: 4.6,
      imageUrl: 'https://images.unsplash.com/photo-1539635278303-d4002c07eae3?w=400&h=300&fit=crop',
      latitude: 64.1466,
      longitude: -21.9426,
      weatherScore: 70,
      popularityScore: 78,
      activities: ['Observation aurores boréales', 'Sources chaudes', 'Randonnée glaciaire', 'Whale watching'],
      nearbyAttractions: ['Blue Lagoon', 'Golden Circle', 'Jokulsarlon'],
      localCuisine: ['Poisson frais', 'Agneau', 'Skyr', 'Brennivín'],
      safetyRating: 98,
      touristSeason: 'medium',
      accessibility: true,
      estimatedCost: 1800
    },
    {
      id: 'marrakech-morocco',
      name: 'Marrakech',
      country: 'Maroc',
      region: 'Marrakech-Safi',
      category: 'cultural',
      description: 'La Ville Rouge fascine par ses souks colorés, ses palais somptueux et l\'animation permanente de la place Jemaa el-Fna.',
      highlights: ['Médina historique', 'Souks traditionnels', 'Palais Bahia', 'Jardins Majorelle'],
      bestTime: 'Oct-Avril',
      duration: '4-6 jours',
      difficulty: 'medium',
      budget: 'low',
      rating: 4.4,
      imageUrl: 'https://images.unsplash.com/photo-1539650116574-75c0c6d77621?w=400&h=300&fit=crop',
      latitude: 31.6295,
      longitude: -7.9811,
      weatherScore: 88,
      popularityScore: 85,
      activities: ['Visite de la médina', 'Shopping dans les souks', 'Hammam traditionnel', 'Excursion Atlas'],
      nearbyAttractions: ['Montagnes de l\'Atlas', 'Essaouira', 'Vallée de l\'Ourika'],
      localCuisine: ['Tagine', 'Couscous', 'Pastilla', 'Thé à la menthe'],
      safetyRating: 80,
      touristSeason: 'high',
      accessibility: false,
      estimatedCost: 600
    },
    {
      id: 'queenstown-newzealand',
      name: 'Queenstown',
      country: 'Nouvelle-Zélande',
      region: 'Otago',
      category: 'adventure',
      description: 'Capitale mondiale de l\'aventure, Queenstown offre des paysages spectaculaires et des activités à sensations fortes.',
      highlights: ['Sports extrêmes', 'Fjords', 'Vignobles', 'Paysages époustouflants'],
      bestTime: 'Oct-Avril',
      duration: '5-8 jours',
      difficulty: 'hard',
      budget: 'high',
      rating: 4.7,
      imageUrl: 'https://images.unsplash.com/photo-1507699622108-4be3abd695ad?w=400&h=300&fit=crop',
      latitude: -45.0312,
      longitude: 168.6626,
      weatherScore: 82,
      popularityScore: 76,
      activities: ['Bungee jumping', 'Skydiving', 'Randonnée', 'Croisière fjords'],
      nearbyAttractions: ['Milford Sound', 'Central Otago', 'Mount Cook'],
      localCuisine: ['Agneau', 'Fruits de mer', 'Vins locaux', 'Hokey pokey'],
      safetyRating: 92,
      touristSeason: 'medium',
      accessibility: true,
      estimatedCost: 2200
    },
    {
      id: 'santorini-greece',
      name: 'Santorin',
      country: 'Grèce',
      region: 'Cyclades',
      category: 'beach',
      description: 'Île volcanique emblématique avec ses maisons blanches à coupoles bleues surplombant la mer Égée.',
      highlights: ['Couchers de soleil', 'Architecture cycladique', 'Plages volcaniques', 'Vins locaux'],
      bestTime: 'Avril-Juin, Sept-Oct',
      duration: '3-5 jours',
      difficulty: 'easy',
      budget: 'medium',
      rating: 4.5,
      imageUrl: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=400&h=300&fit=crop',
      latitude: 36.3932,
      longitude: 25.4615,
      weatherScore: 90,
      popularityScore: 94,
      activities: ['Couchers de soleil Oia', 'Dégustation de vins', 'Plages rouges/noires', 'Croisière volcan'],
      nearbyAttractions: ['Mykonos', 'Naxos', 'Paros'],
      localCuisine: ['Moussaka', 'Fruits de mer', 'Fava', 'Vinsanto'],
      safetyRating: 88,
      touristSeason: 'high',
      accessibility: false,
      estimatedCost: 1100
    },
    {
      id: 'banff-canada',
      name: 'Banff',
      country: 'Canada',
      region: 'Alberta',
      category: 'nature',
      description: 'Parc national au cœur des Rocheuses canadiennes, Banff offre des paysages montagneux à couper le souffle.',
      highlights: ['Lacs turquoise', 'Glaciers', 'Faune sauvage', 'Randonnées alpines'],
      bestTime: 'Juin-Sept',
      duration: '6-10 jours',
      difficulty: 'medium',
      budget: 'medium',
      rating: 4.8,
      imageUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop',
      latitude: 51.4968,
      longitude: -115.9281,
      weatherScore: 75,
      popularityScore: 73,
      activities: ['Randonnée', 'Canoë', 'Observation faune', 'Sources chaudes'],
      nearbyAttractions: ['Lake Louise', 'Jasper', 'Calgary'],
      localCuisine: ['Saumon', 'Sirop d\'érable', 'Bison', 'Cidre de glace'],
      safetyRating: 95,
      touristSeason: 'medium',
      accessibility: true,
      estimatedCost: 1400
    }
  ];

  // Filter and score destinations based on user preferences
  let suggestions = baseDestinations.filter(dest => {
    // Apply search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const searchableText = `${dest.name} ${dest.country} ${dest.region} ${dest.description} ${dest.activities.join(' ')}`.toLowerCase();
      if (!searchableText.includes(query)) return false;
    }

    // Apply category filter
    if (filters.categories.length > 0 && !filters.categories.includes(dest.category)) {
      return false;
    }

    // Apply budget filter
    if (filters.budget !== 'any' && dest.budget !== filters.budget) {
      return false;
    }

    // Apply accessibility filter
    if (filters.accessibilityNeeded && !dest.accessibility) {
      return false;
    }

    return true;
  });

  // Calculate match scores based on user history and preferences
  suggestions = suggestions.map(dest => {
    let matchScore = 70; // Base score

    // Boost score based on user travel history
    if (userHistory) {
      // Prefer similar categories to previously visited places
      if (userHistory.preferredCategories && userHistory.preferredCategories[dest.category]) {
        matchScore += 15;
      }

      // Avoid recently visited countries (unless specifically searching)
      if (!searchQuery && userHistory.visitedCountries && userHistory.visitedCountries.includes(dest.country)) {
        matchScore -= 10;
      }

      // Prefer destinations matching user's typical trip duration
      const avgDuration = userHistory.averageTripDuration || 7;
      const destDuration = parseInt(dest.duration.split('-')[0]);
      if (Math.abs(destDuration - avgDuration) <= 2) {
        matchScore += 10;
      }

      // Seasonal preferences
      const currentSeason = getSeason(new Date());
      if (userHistory.seasonalPreferences && userHistory.seasonalPreferences[currentSeason]) {
        if (dest.bestTime.toLowerCase().includes(currentSeason)) {
          matchScore += 8;
        }
      }
    }

    // Apply filter preferences
    if (filters.weatherImportance) {
      matchScore += (dest.weatherScore - 70) * 0.3;
    }

    if (filters.safetyImportance) {
      matchScore += (dest.safetyRating - 80) * 0.2;
    }

    if (filters.avoidCrowds) {
      if (dest.touristSeason === 'low') matchScore += 10;
      if (dest.touristSeason === 'high') matchScore -= 5;
    }

    // Duration preference
    const destDurationRange = dest.duration.split('-').map(d => parseInt(d.trim()));
    const minDuration = destDurationRange[0];
    const maxDuration = destDurationRange[1] || minDuration;
    
    if (filters.duration >= minDuration && filters.duration <= maxDuration) {
      matchScore += 15;
    }

    // Add some randomness to avoid always showing the same results
    matchScore += Math.random() * 10;

    return {
      ...dest,
      matchScore: Math.min(100, Math.max(0, Math.round(matchScore)))
    };
  });

  // Sort by match score and return top results
  suggestions.sort((a, b) => (b as any).matchScore - (a as any).matchScore);
  
  return suggestions.slice(0, 12);
}

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  dest: uploadDir,
  limits: {
    fileSize: 5 * 1024 * 1024, // Reduced to 5MB per file for faster upload
    files: 20, // Max 20 files
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Stats endpoint
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stats", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Trip routes
  app.get("/api/trips", async (req, res) => {
    try {
      const trips = await storage.getTrips();
      // Include photo counts for each trip
      const tripsWithCounts = await Promise.all(
        trips.map(async (trip) => {
          const photos = await storage.getPhotosByTrip(trip.id);
          return { ...trip, photoCount: photos.length };
        })
      );
      res.json(tripsWithCounts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch trips", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.get("/api/trips/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const trip = await storage.getTrip(id);
      if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
      }
      const photos = await storage.getPhotosByTrip(id);
      res.json({ ...trip, photoCount: photos.length });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch trip", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.post("/api/trips", async (req, res) => {
    try {
      // Convert date strings to Date objects before validation
      const bodyWithDates = {
        ...req.body,
        startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
        endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
      };
      
      const tripData = insertTripSchema.parse(bodyWithDates);
      const trip = await storage.createTrip(tripData);
      res.status(201).json(trip);
    } catch (error) {
      res.status(400).json({ message: "Invalid trip data", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.put("/api/trips/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Convert date strings to Date objects before validation
      const bodyWithDates = {
        ...req.body,
        startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
        endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
      };
      
      const tripData = insertTripSchema.partial().parse(bodyWithDates);
      const trip = await storage.updateTrip(id, tripData);
      if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
      }
      res.json(trip);
    } catch (error) {
      res.status(400).json({ message: "Invalid trip data", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.delete("/api/trips/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteTrip(id);
      if (!deleted) {
        return res.status(404).json({ message: "Trip not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete trip", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Album routes
  app.get("/api/albums", async (req, res) => {
    try {
      const albums = await storage.getAlbums();
      // Include photo counts for each album
      const albumsWithCounts = await Promise.all(
        albums.map(async (album) => {
          const photos = await storage.getPhotosByAlbum(album.id);
          return { ...album, photoCount: photos.length };
        })
      );
      res.json(albumsWithCounts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch albums", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.post("/api/albums", async (req, res) => {
    try {
      const albumData = insertAlbumSchema.parse(req.body);
      const album = await storage.createAlbum(albumData);
      res.status(201).json(album);
    } catch (error) {
      res.status(400).json({ message: "Invalid album data", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Shared album routes
  app.post("/api/albums/shared", async (req, res) => {
    try {
      const albumData = insertAlbumSchema.parse(req.body);
      const sharedAlbum = await storage.createSharedAlbum(albumData);
      res.status(201).json(sharedAlbum);
    } catch (error) {
      res.status(400).json({ message: "Invalid album data", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.get("/api/albums/shared/:shareCode", async (req, res) => {
    try {
      const shareCode = req.params.shareCode;
      const album = await storage.getSharedAlbum(shareCode);
      if (!album) {
        return res.status(404).json({ message: "Shared album not found" });
      }
      
      const contributors = await storage.getContributors(album.id);
      const photos = await storage.getPhotosByAlbum(album.id);
      
      res.json({
        ...album,
        contributors,
        photos
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch shared album", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.post("/api/albums/:id/contributors", async (req, res) => {
    try {
      const albumId = parseInt(req.params.id);
      const contributorData = {
        albumId,
        contributorName: req.body.contributorName,
        contributorEmail: req.body.contributorEmail,
        role: req.body.role || "contributor",
        canUpload: req.body.canUpload !== undefined ? req.body.canUpload : true,
        canEdit: req.body.canEdit !== undefined ? req.body.canEdit : false,
        canDelete: req.body.canDelete !== undefined ? req.body.canDelete : false,
      };
      
      const contributor = await storage.addContributor(albumId, contributorData);
      res.status(201).json(contributor);
    } catch (error) {
      res.status(400).json({ message: "Failed to add contributor", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Enhanced Comments routes
  app.get("/api/photos/:id/comments", async (req, res) => {
    try {
      const photoId = parseInt(req.params.id);
      const sortBy = req.query.sort as string || 'newest';
      
      let comments = await storage.getPhotoComments(photoId);
      
      // Sort comments based on request
      comments.sort((a, b) => {
        switch (sortBy) {
          case 'oldest':
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          case 'newest':
          default:
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
      });
      
      res.json(comments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch comments", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.post("/api/photos/:id/comments", async (req, res) => {
    try {
      const photoId = parseInt(req.params.id);
      const commentData = {
        photoId,
        authorName: req.body.authorName,
        authorEmail: req.body.authorEmail,
        content: req.body.content,
      };
      
      const comment = await storage.createPhotoComment(commentData);
      
      // Create activity entry for new comment
      await storage.createAlbumActivity({
        albumId: 1, // This should be determined from the photo
        action: "comment_added",
        contributorName: req.body.authorName,
        description: `Nouveau commentaire: "${req.body.content.substring(0, 50)}${req.body.content.length > 50 ? '...' : ''}"`
      });
      
      res.status(201).json(comment);
    } catch (error) {
      res.status(400).json({ message: "Failed to create comment", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.put("/api/photos/:photoId/comments/:commentId", async (req, res) => {
    try {
      const commentId = parseInt(req.params.commentId);
      const { content } = req.body;
      
      // For now, return success response since we don't have edit functionality in storage
      res.json({
        id: commentId,
        content,
        editedAt: new Date().toISOString(),
      });
    } catch (error) {
      res.status(400).json({ message: "Failed to edit comment", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.delete("/api/photos/:photoId/comments/:commentId", async (req, res) => {
    try {
      const commentId = parseInt(req.params.commentId);
      const success = await storage.deletePhotoComment(commentId);
      
      if (!success) {
        return res.status(404).json({ message: "Comment not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ message: "Failed to delete comment", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.post("/api/comments/:commentId/like", async (req, res) => {
    try {
      const commentId = parseInt(req.params.commentId);
      const { contributorName } = req.body;
      
      // Return success response for comment like
      res.json({
        commentId,
        contributorName,
        liked: true,
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      res.status(400).json({ message: "Failed to like comment", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Enhanced Reactions routes
  app.get("/api/photos/:id/reactions", async (req, res) => {
    try {
      const photoId = parseInt(req.params.id);
      const reactions = await storage.getPhotoReactions(photoId);
      res.json(reactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reactions", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.post("/api/photos/:id/reactions", async (req, res) => {
    try {
      const photoId = parseInt(req.params.id);
      const { contributorName, contributorEmail, reaction } = req.body;
      
      // Check if user already has a reaction and remove it
      const existingReactions = await storage.getPhotoReactions(photoId);
      const userReaction = existingReactions.find(r => r.contributorName === contributorName);
      
      if (userReaction) {
        await storage.deletePhotoReaction(photoId, contributorName, userReaction.reaction);
      }
      
      const reactionData = {
        photoId,
        contributorName,
        contributorEmail,
        reaction,
      };
      
      const newReaction = await storage.createPhotoReaction(reactionData);
      
      // Create activity entry for new reaction
      await storage.createAlbumActivity({
        albumId: 1, // This should be determined from the photo
        action: "reaction_added",
        contributorName,
        description: `Nouvelle réaction: ${reaction}`
      });
      
      res.status(201).json(newReaction);
    } catch (error) {
      res.status(400).json({ message: "Failed to create reaction", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.delete("/api/photos/:id/reactions/:reactionId", async (req, res) => {
    try {
      const photoId = parseInt(req.params.id);
      const reactionId = parseInt(req.params.reactionId);
      
      // Get reaction details for deletion
      const reactions = await storage.getPhotoReactions(photoId);
      const reaction = reactions.find(r => r.id === reactionId);
      
      if (!reaction) {
        return res.status(404).json({ message: "Reaction not found" });
      }
      
      const success = await storage.deletePhotoReaction(photoId, reaction.contributorName, reaction.reaction);
      
      if (!success) {
        return res.status(404).json({ message: "Reaction not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ message: "Failed to delete reaction", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Activity routes
  app.get("/api/albums/:id/activity", async (req, res) => {
    try {
      const albumId = parseInt(req.params.id);
      const activities = await storage.getAlbumActivity(albumId);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activity", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // User profile routes
  app.get("/api/users/:userId/profile", async (req, res) => {
    try {
      const userId = req.params.userId;
      const profile = await storage.getUserProfile(userId);
      if (!profile) {
        return res.status(404).json({ message: "User profile not found" });
      }
      res.json(profile);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user profile", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.post("/api/users/:userId/profile", async (req, res) => {
    try {
      const userId = req.params.userId;
      const profileData = {
        userId,
        username: req.body.username,
        displayName: req.body.displayName,
        bio: req.body.bio,
        location: req.body.location,
        website: req.body.website,
        privacy: req.body.privacy || "public",
      };
      
      const profile = await storage.createUserProfile(profileData);
      res.status(201).json(profile);
    } catch (error) {
      res.status(400).json({ message: "Failed to create user profile", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.put("/api/users/:userId/profile", async (req, res) => {
    try {
      const userId = req.params.userId;
      const updateData = {
        displayName: req.body.displayName,
        bio: req.body.bio,
        location: req.body.location,
        website: req.body.website,
        privacy: req.body.privacy,
      };
      
      const profile = await storage.updateUserProfile(userId, updateData);
      if (!profile) {
        return res.status(404).json({ message: "User profile not found" });
      }
      res.json(profile);
    } catch (error) {
      res.status(400).json({ message: "Failed to update user profile", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.get("/api/users/:userId/stats", async (req, res) => {
    try {
      const userId = req.params.userId;
      const stats = await storage.getUserStats(userId);
      if (!stats) {
        return res.status(404).json({ message: "User stats not found" });
      }
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user stats", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.get("/api/users/:userId/achievements", async (req, res) => {
    try {
      const userId = req.params.userId;
      const achievements = await storage.getUserAchievements(userId);
      res.json(achievements);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user achievements", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.post("/api/users/:userId/follow", async (req, res) => {
    try {
      const followingId = req.params.userId;
      const followerId = req.body.followerId; // In real app, this would come from session
      
      const follow = await storage.followUser(followerId, followingId);
      res.status(201).json(follow);
    } catch (error) {
      res.status(400).json({ message: "Failed to follow user", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.post("/api/users/:userId/unfollow", async (req, res) => {
    try {
      const followingId = req.params.userId;
      const followerId = req.body.followerId; // In real app, this would come from session
      
      const success = await storage.unfollowUser(followerId, followingId);
      if (!success) {
        return res.status(404).json({ message: "Follow relationship not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ message: "Failed to unfollow user", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.get("/api/users/:userId/photos", async (req, res) => {
    try {
      const userId = req.params.userId;
      // For now, return all photos - in real app, filter by user
      const photos = await storage.getPhotos();
      res.json(photos.slice(0, 20)); // Limit to 20 photos
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user photos", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Location and GPS routes
  app.get("/api/trips/:id/locations", async (req, res) => {
    try {
      const tripId = parseInt(req.params.id);
      const photos = await storage.getPhotosByTrip(tripId);
      
      // Filter photos with GPS coordinates and format as location points
      const locations = photos
        .filter(photo => photo.latitude && photo.longitude)
        .map(photo => ({
          id: photo.id,
          latitude: parseFloat(photo.latitude!),
          longitude: parseFloat(photo.longitude!),
          altitude: null,
          accuracy: null,
          speed: null,
          heading: null,
          timestamp: photo.uploadedAt,
          address: photo.location,
          photoUrl: photo.url,
          caption: photo.caption,
        }))
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      
      res.json(locations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch trip locations", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.post("/api/trips/:id/locations", async (req, res) => {
    try {
      const tripId = parseInt(req.params.id);
      const locationData = req.body;
      
      // For now, we'll store location data as part of photo metadata
      // In a real app, you might have a separate locations table
      res.status(201).json({
        id: Date.now(),
        tripId,
        ...locationData,
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      res.status(400).json({ message: "Failed to save location", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.get("/api/photos/geotagged", async (req, res) => {
    try {
      const photos = await storage.getPhotos();
      const geotaggedPhotos = photos.filter(photo => 
        photo.latitude && photo.longitude &&
        !isNaN(parseFloat(photo.latitude)) && 
        !isNaN(parseFloat(photo.longitude))
      );
      res.json(geotaggedPhotos);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch geotagged photos", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.get("/api/photos/nearby", async (req, res) => {
    try {
      const { lat, lng, radius = 10 } = req.query; // radius in km
      
      if (!lat || !lng) {
        return res.status(400).json({ message: "Latitude and longitude are required" });
      }
      
      const photos = await storage.getPhotos();
      const nearbyPhotos = photos.filter(photo => {
        if (!photo.latitude || !photo.longitude) return false;
        
        const photoLat = parseFloat(photo.latitude);
        const photoLng = parseFloat(photo.longitude);
        const distance = calculateDistance(
          { latitude: parseFloat(lat as string), longitude: parseFloat(lng as string) },
          { latitude: photoLat, longitude: photoLng }
        );
        
        return distance <= parseFloat(radius as string);
      });
      
      res.json(nearbyPhotos);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch nearby photos", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.get("/api/analytics/locations", async (req, res) => {
    try {
      const photos = await storage.getPhotos();
      const geotaggedPhotos = photos.filter(photo => 
        photo.latitude && photo.longitude &&
        !isNaN(parseFloat(photo.latitude)) && 
        !isNaN(parseFloat(photo.longitude))
      );

      // Group photos by location
      const locationGroups = geotaggedPhotos.reduce((acc, photo) => {
        const location = photo.location || `${parseFloat(photo.latitude!).toFixed(2)}, ${parseFloat(photo.longitude!).toFixed(2)}`;
        if (!acc[location]) {
          acc[location] = [];
        }
        acc[location].push(photo);
        return acc;
      }, {} as Record<string, typeof photos>);

      // Calculate analytics
      const locationAnalytics = Object.entries(locationGroups).map(([location, locationPhotos]) => {
        const coordinates = locationPhotos[0];
        return {
          location,
          latitude: parseFloat(coordinates.latitude!),
          longitude: parseFloat(coordinates.longitude!),
          photoCount: locationPhotos.length,
          firstVisit: locationPhotos.reduce((earliest, photo) => 
            new Date(photo.uploadedAt) < new Date(earliest.uploadedAt) ? photo : earliest
          ).uploadedAt,
          lastVisit: locationPhotos.reduce((latest, photo) => 
            new Date(photo.uploadedAt) > new Date(latest.uploadedAt) ? photo : latest
          ).uploadedAt,
        };
      }).sort((a, b) => b.photoCount - a.photoCount);

      res.json({
        totalGeotaggedPhotos: geotaggedPhotos.length,
        uniqueLocations: locationAnalytics.length,
        topLocations: locationAnalytics.slice(0, 10),
        recentLocations: locationAnalytics
          .sort((a, b) => new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime())
          .slice(0, 5),
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch location analytics", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Single photo analysis route
  app.post("/api/photos/:id/analyze", async (req, res) => {
    try {
      const photoId = parseInt(req.params.id);
      const { photoUrl, analysisType = 'comprehensive' } = req.body;
      
      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ message: "OpenAI API key not configured" });
      }

      const photo = await storage.getPhoto(photoId);
      if (!photo) {
        return res.status(404).json({ message: "Photo not found" });
      }

      const { analyzeImageWithVision } = await import('./vision-analysis');
      
      // Perform the analysis
      const analysisResult = await analyzeImageWithVision(photoUrl || photo.url);
      
      // Store analysis results in photo metadata
      const metadata = photo.metadata ? JSON.parse(photo.metadata) : {};
      metadata.analysis = {
        ...analysisResult,
        analyzedAt: new Date().toISOString(),
        analysisType
      };
      
      await storage.updatePhoto(photoId, { 
        metadata: JSON.stringify(metadata) 
      });
      
      res.json(analysisResult);
    } catch (error) {
      console.error('Photo analysis error:', error);
      res.status(500).json({ 
        message: "Failed to analyze photo", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Vision Analysis and Object Recognition routes
  app.get("/api/photos/:id/recognition", async (req, res) => {
    try {
      const photoId = parseInt(req.params.id);
      
      // For now, return mock data - in production this would be stored in database
      // This simulates cached recognition results
      const mockRecognitionData = {
        objects: [
          { name: "Architecture gothique", category: "monument", confidence: 0.95, description: "Façade ornée avec des voûtes caractéristiques" },
          { name: "Touristes", category: "people", confidence: 0.88 },
          { name: "Pavés", category: "object", confidence: 0.75 }
        ],
        landmarks: [],
        food: [],
        people: { count: 0, activities: [], emotions: [] },
        activities: ["tourisme", "photographie"],
        mood: "paisible et historique",
        description: "Cette photo capture l'essence de l'architecture européenne avec ses détails gothiques remarquables.",
        suggestedTags: ["architecture", "gothique", "tourisme", "histoire", "europe"],
        confidence: 0.89
      };
      
      res.json(mockRecognitionData);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recognition data", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.post("/api/photos/:id/analyze", async (req, res) => {
    try {
      const photoId = parseInt(req.params.id);
      const { photoUrl, analysisType } = req.body;
      
      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ message: "OpenAI API key not configured" });
      }

      // Import vision analysis functions
      const { analyzeImageWithVision } = await import('./vision-analysis');
      
      // Perform comprehensive analysis
      const analysisResult = await analyzeImageWithVision(photoUrl);
      
      // In a real application, you would store this in the database
      // For now, we'll return the result directly
      
      res.json(analysisResult);
    } catch (error) {
      console.error("Vision analysis error:", error);
      res.status(500).json({ 
        message: "Failed to analyze photo", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  app.post("/api/photos/:id/generate-description", async (req, res) => {
    try {
      const photoId = parseInt(req.params.id);
      const { photoUrl } = req.body;
      
      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ message: "OpenAI API key not configured" });
      }

      const { generateImageDescription } = await import('./vision-analysis');
      
      const description = await generateImageDescription(photoUrl);
      
      // Update photo description in database
      await storage.updatePhoto(photoId, { caption: description });
      
      res.json({ description });
    } catch (error) {
      console.error("Description generation error:", error);
      res.status(500).json({ 
        message: "Failed to generate description", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  app.post("/api/photos/:id/identify-landmark", async (req, res) => {
    try {
      const photoId = parseInt(req.params.id);
      const { photoUrl } = req.body;
      
      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ message: "OpenAI API key not configured" });
      }

      const { identifyLandmark } = await import('./vision-analysis');
      
      const landmark = await identifyLandmark(photoUrl);
      
      if (landmark) {
        // Update photo location if landmark identified
        await storage.updatePhoto(photoId, { 
          location: `${landmark.name}, ${landmark.location}` 
        });
      }
      
      res.json({ landmark });
    } catch (error) {
      console.error("Landmark identification error:", error);
      res.status(500).json({ 
        message: "Failed to identify landmark", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  app.put("/api/photos/:id/tags", async (req, res) => {
    try {
      const photoId = parseInt(req.params.id);
      const { tags } = req.body;
      
      // In a real application, you would store tags in a separate table
      // For now, we'll store them in the photo metadata
      const photo = await storage.getPhoto(photoId);
      if (!photo) {
        return res.status(404).json({ message: "Photo not found" });
      }
      
      const metadata = photo.metadata ? JSON.parse(photo.metadata) : {};
      metadata.tags = tags;
      
      await storage.updatePhoto(photoId, { 
        metadata: JSON.stringify(metadata) 
      });
      
      res.json({ success: true, tags });
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to update tags", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  app.post("/api/photos/batch-analyze", async (req, res) => {
    try {
      const { photoIds } = req.body;
      
      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ message: "OpenAI API key not configured" });
      }

      const { analyzeImageWithVision } = await import('./vision-analysis');
      
      const results = [];
      
      for (const photoId of photoIds) {
        try {
          const photo = await storage.getPhoto(photoId);
          if (photo) {
            const analysisResult = await analyzeImageWithVision(photo.url);
            results.push({
              photoId,
              success: true,
              result: analysisResult
            });
          }
        } catch (error) {
          results.push({
            photoId,
            success: false,
            error: error instanceof Error ? error.message : "Analysis failed"
          });
        }
      }
      
      res.json({ results });
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to perform batch analysis", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Location Suggestions routes
  app.post("/api/suggestions/locations", async (req, res) => {
    try {
      const { filters, searchQuery, userHistory } = req.body;
      
      // Generate intelligent location suggestions based on user preferences and history
      const suggestions = await generateLocationSuggestions(filters, searchQuery, userHistory);
      
      res.json(suggestions);
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to generate location suggestions", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  app.get("/api/analytics/travel-history", async (req, res) => {
    try {
      const photos = await storage.getPhotos();
      const trips = await storage.getTrips();
      
      // Analyze user travel patterns
      const visitedCountries = new Set();
      const visitedCities = new Set();
      const preferredCategories = new Map<string, number>();
      const seasonalPreferences = new Map<string, number>();
      const budgetPatterns = [];
      
      // Extract patterns from photos and trips
      photos.forEach(photo => {
        if (photo.location) {
          const locationParts = photo.location.split(',');
          if (locationParts.length >= 2) {
            visitedCities.add(locationParts[0].trim());
            visitedCountries.add(locationParts[locationParts.length - 1].trim());
          }
        }
        
        // Analyze upload patterns for seasonal preferences
        const uploadDate = new Date(photo.uploadedAt);
        const season = getSeason(uploadDate);
        seasonalPreferences.set(season, (seasonalPreferences.get(season) || 0) + 1);
      });

      trips.forEach(trip => {
        if (trip.location) {
          const locationParts = trip.location.split(',');
          if (locationParts.length >= 2) {
            visitedCountries.add(locationParts[locationParts.length - 1].trim());
          }
        }
      });

      const travelHistory = {
        visitedCountries: Array.from(visitedCountries),
        visitedCities: Array.from(visitedCities),
        totalTrips: trips.length,
        totalPhotos: photos.length,
        preferredCategories: Object.fromEntries(preferredCategories),
        seasonalPreferences: Object.fromEntries(seasonalPreferences),
        averageTripDuration: calculateAverageTripDuration(trips),
        mostActiveMonth: getMostActiveMonth(photos),
        travelFrequency: calculateTravelFrequency(trips)
      };
      
      res.json(travelHistory);
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to fetch travel history", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  app.post("/api/favorites/locations", async (req, res) => {
    try {
      const { locationId, name, country, category, coordinates } = req.body;
      
      // In a real application, you would store this in a favorites table
      // For now, we'll simulate saving to user preferences
      const favorite = {
        id: Date.now(),
        locationId,
        name,
        country,
        category,
        coordinates,
        savedAt: new Date().toISOString()
      };
      
      res.json({ success: true, favorite });
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to save favorite location", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  app.get("/api/favorites/locations", async (req, res) => {
    try {
      // Return mock favorites for demonstration
      const favorites = [
        {
          id: 1,
          name: "Kyoto",
          country: "Japan",
          category: "cultural",
          savedAt: "2024-01-15T10:00:00Z"
        },
        {
          id: 2,
          name: "Santorini",
          country: "Greece",
          category: "beach",
          savedAt: "2024-02-20T15:30:00Z"
        }
      ];
      
      res.json(favorites);
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to fetch favorite locations", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Story Generation routes
  app.post("/api/stories/generate", async (req, res) => {
    try {
      const { tripId, albumId, settings, customPrompt, photos, tripData } = req.body;
      
      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ message: "OpenAI API key not configured" });
      }

      // Import OpenAI for story generation
      const { generateTravelStory } = await import('./story-analysis.js');
      
      // Generate the travel story
      const story = await generateTravelStory({
        tripData,
        photos: photos || [],
        settings,
        customPrompt
      });
      
      res.json(story);
    } catch (error) {
      console.error("Story generation error:", error);
      res.status(500).json({ 
        message: "Failed to generate story", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  app.post("/api/stories", async (req, res) => {
    try {
      const storyData = req.body;
      
      // In a real application, you would store this in a stories table
      // For now, we'll return the story with a generated ID
      const savedStory = {
        id: `story-${Date.now()}`,
        ...storyData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      res.json(savedStory);
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to save story", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  app.get("/api/stories", async (req, res) => {
    try {
      const { tripId, albumId } = req.query;
      
      // Return mock stories for demonstration
      const stories = [
        {
          id: "story-1",
          title: "Mon aventure au Japon",
          content: "Ce voyage au Japon restera gravé dans ma mémoire comme une immersion totale dans une culture fascinante...",
          style: "narrative",
          mood: "adventurous",
          length: "medium",
          wordCount: 456,
          readingTime: 3,
          generatedAt: "2025-06-14T10:00:00Z",
          highlights: ["Temples de Kyoto", "Cuisine locale", "Rencontres authentiques"],
          photos: []
        }
      ];
      
      res.json(stories);
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to fetch stories", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  app.get("/api/photos/trip/:tripId", async (req, res) => {
    try {
      const tripId = parseInt(req.params.tripId);
      const photos = await storage.getPhotosByTrip(tripId);
      res.json(photos);
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to fetch trip photos", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  app.get("/api/photos/album/:albumId", async (req, res) => {
    try {
      const albumId = parseInt(req.params.albumId);
      const photos = await storage.getPhotosByAlbum(albumId);
      res.json(photos);
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to fetch album photos", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Face Detection routes
  app.post("/api/faces/detect", async (req, res) => {
    try {
      const { photoId, albumId, settings } = req.body;
      
      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ message: "OpenAI API key not configured" });
      }

      const { detectFacesInImage, determineGroupDynamics } = await import('./face-analysis.js');
      
      let photosToAnalyze = [];
      
      if (photoId) {
        const photo = await storage.getPhoto(photoId);
        if (photo) photosToAnalyze.push(photo);
      } else if (albumId) {
        photosToAnalyze = await storage.getPhotosByAlbum(albumId);
      } else {
        photosToAnalyze = await storage.getPhotos();
      }

      const results = [];
      
      for (const photo of photosToAnalyze.slice(0, 5)) { // Limit to 5 photos for demo
        try {
          const photoUrl = `${req.protocol}://${req.get('host')}${photo.url}`;
          const faceAnalysis = await detectFacesInImage(photoUrl);
          
          results.push({
            photoId: photo.id,
            ...faceAnalysis
          });
        } catch (error) {
          console.error(`Error analyzing photo ${photo.id}:`, error);
        }
      }

      // Aggregate results
      const totalFaces = results.reduce((sum, r) => sum + r.totalFaces, 0);
      const allFaces = results.flatMap(r => r.faces);
      const groupDynamics = determineGroupDynamics(allFaces);

      const aggregatedResult = {
        totalPhotos: photosToAnalyze.length,
        analyzedPhotos: results.length,
        faces: allFaces,
        totalFaces,
        uniquePeople: groupDynamics.genderDistribution ? Object.values(groupDynamics.genderDistribution).reduce((a, b) => a + b, 0) : 0,
        groupSize: groupDynamics.groupSize,
        mood: groupDynamics.mood,
        setting: 'unknown',
        confidence: 0.85,
        results
      };
      
      res.json(aggregatedResult);
    } catch (error) {
      console.error("Face detection error:", error);
      res.status(500).json({ 
        message: "Failed to detect faces", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  app.get("/api/faces/photo/:photoId", async (req, res) => {
    try {
      const photoId = parseInt(req.params.photoId);
      
      // Mock face data for demonstration
      const mockFaces = [
        {
          id: `face_${photoId}_1`,
          x: 0.2,
          y: 0.15,
          width: 0.15,
          height: 0.2,
          confidence: 0.92,
          age: 28,
          gender: "femme",
          emotion: "joyeux",
          ethnicity: "caucasien",
          landmarks: [
            { type: "left_eye", x: 0.22, y: 0.2 },
            { type: "right_eye", x: 0.28, y: 0.2 }
          ]
        }
      ];
      
      res.json(mockFaces);
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to fetch faces", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  app.get("/api/faces", async (req, res) => {
    try {
      // Return mock faces data
      const mockFaces = [
        {
          id: "face_demo_1",
          x: 0.3,
          y: 0.2,
          width: 0.2,
          height: 0.25,
          confidence: 0.88,
          personName: "Marie Dubois",
          age: 32,
          gender: "femme",
          emotion: "joyeux"
        },
        {
          id: "face_demo_2",
          x: 0.1,
          y: 0.1,
          width: 0.18,
          height: 0.22,
          confidence: 0.91,
          age: 25,
          gender: "homme",
          emotion: "neutre"
        }
      ];
      
      res.json(mockFaces);
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to fetch all faces", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  app.post("/api/faces/tag", async (req, res) => {
    try {
      const { faceId, personName, isNewPerson, notes } = req.body;
      
      // In a real app, you would update the face record with the person information
      const taggedFace = {
        id: faceId,
        personName,
        isVerified: true,
        notes,
        taggedAt: new Date().toISOString()
      };
      
      res.json(taggedFace);
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to tag person", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  app.get("/api/people", async (req, res) => {
    try {
      // Mock people data for demonstration
      const mockPeople = [
        {
          id: "person_1",
          name: "Marie Dubois",
          photoCount: 8,
          firstSeen: "2025-05-15T10:00:00Z",
          lastSeen: "2025-06-14T15:30:00Z",
          isFamily: true,
          isFriend: false,
          notes: "Sœur de voyage"
        },
        {
          id: "person_2",
          name: "Thomas Martin",
          photoCount: 12,
          firstSeen: "2025-04-20T14:20:00Z",
          lastSeen: "2025-06-10T09:15:00Z",
          isFamily: false,
          isFriend: true,
          notes: "Ami de longue date"
        },
        {
          id: "person_3",
          name: "Sophie Chen",
          photoCount: 5,
          firstSeen: "2025-06-01T11:45:00Z",
          lastSeen: "2025-06-12T16:20:00Z",
          isFamily: false,
          isFriend: true,
          notes: "Rencontrée en voyage"
        }
      ];
      
      res.json(mockPeople);
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to fetch people", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  app.post("/api/faces/compare", async (req, res) => {
    try {
      const { face1, face2 } = req.body;
      
      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ message: "OpenAI API key not configured" });
      }

      const { compareFaces } = await import('./face-analysis.js');
      
      // This would use actual face comparison logic
      const comparison = await compareFaces(
        face1.imageUrl, face1.coordinates,
        face2.imageUrl, face2.coordinates
      );
      
      res.json(comparison);
    } catch (error) {
      console.error("Face comparison error:", error);
      res.status(500).json({ 
        message: "Failed to compare faces", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Photo Book Creation routes
  app.post("/api/photo-books/create", async (req, res) => {
    try {
      const { title, subtitle, tripId, albumId, format, size, theme, photos, settings } = req.body;
      
      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ message: "OpenAI API key not configured" });
      }

      const { generatePhotoBookLayout } = await import('./photo-book-analysis.js');
      
      // Generate automatic layout based on photos and settings
      const photoBook = await generatePhotoBookLayout({
        title,
        subtitle,
        tripId,
        albumId,
        format,
        size,
        theme,
        photos: photos || [],
        settings
      });
      
      res.json(photoBook);
    } catch (error) {
      console.error("Photo book creation error:", error);
      res.status(500).json({ 
        message: "Failed to create photo book", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  app.get("/api/photo-books", async (req, res) => {
    try {
      const { tripId, albumId } = req.query;
      
      // Return existing photo books
      const books = [
        {
          id: "book_1",
          title: "Voyage au Japon",
          subtitle: "Découverte de Tokyo et Kyoto",
          format: "landscape",
          size: "medium",
          theme: "adventure",
          totalPages: 24,
          isPublished: false,
          printReady: true,
          createdAt: "2025-06-10T14:30:00Z",
          updatedAt: "2025-06-14T16:45:00Z",
          pages: []
        }
      ];
      
      res.json(books);
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to fetch photo books", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  app.put("/api/photo-books/:bookId", async (req, res) => {
    try {
      const bookId = req.params.bookId;
      const bookData = req.body;
      
      // Update photo book
      const updatedBook = {
        ...bookData,
        id: bookId,
        updatedAt: new Date().toISOString()
      };
      
      res.json(updatedBook);
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to update photo book", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  app.post("/api/photo-books/generate-layouts", async (req, res) => {
    try {
      const { photos, theme, settings } = req.body;
      
      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ message: "OpenAI API key not configured" });
      }

      const { generateSmartLayouts } = await import('./photo-book-analysis.js');
      
      const layouts = await generateSmartLayouts(photos, theme, settings);
      
      res.json(layouts);
    } catch (error) {
      console.error("Layout generation error:", error);
      res.status(500).json({ 
        message: "Failed to generate layouts", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  app.post("/api/photo-books/:bookId/export", async (req, res) => {
    try {
      const bookId = req.params.bookId;
      const { format } = req.body; // 'pdf', 'print', 'web'
      
      // Generate export based on format
      const exportResult = {
        bookId,
        format,
        downloadUrl: `/api/downloads/book_${bookId}.pdf`,
        generatedAt: new Date().toISOString(),
        fileSize: "15.2 MB",
        pages: 24
      };
      
      res.json(exportResult);
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to export photo book", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Video Generation routes
  app.post("/api/videos/generate", async (req, res) => {
    try {
      const { title, tripId, albumId, photos, settings, template } = req.body;
      
      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ message: "OpenAI API key not configured" });
      }

      const { generateVideoLayout } = await import('./video-analysis.js');
      
      // Generate video with AI optimization
      const video = await generateVideoLayout({
        title,
        tripId,
        albumId,
        photos: photos || [],
        settings,
        template
      });
      
      res.json(video);
    } catch (error) {
      console.error("Video generation error:", error);
      res.status(500).json({ 
        message: "Failed to generate video", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  app.post("/api/videos/auto-select-photos", async (req, res) => {
    try {
      const { photos, template, duration, criteria } = req.body;
      
      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ message: "OpenAI API key not configured" });
      }

      const { selectBestPhotosForVideo } = await import('./video-analysis.js');
      
      const selectedPhotoIds = await selectBestPhotosForVideo(photos, template, duration, criteria);
      
      res.json(selectedPhotoIds);
    } catch (error) {
      console.error("Photo selection error:", error);
      res.status(500).json({ 
        message: "Failed to select photos", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Serve video thumbnail images
  app.get("/api/videos/:filename", async (req, res) => {
    const { filename } = req.params;
    
    // Check if it's a thumbnail request
    if (filename.endsWith('_thumb.jpg') || filename.endsWith('.jpg') || filename.endsWith('.png')) {
      // Generate a simple placeholder image or serve actual thumbnail
      // For now, redirect to a placeholder image service
      const imageUrl = `https://picsum.photos/640/360?random=${filename}`;
      return res.redirect(imageUrl);
    }
    
    // If not an image, continue to video data endpoint
    return res.status(404).json({ message: "File not found" });
  });

  app.get("/api/videos", async (req, res) => {
    try {
      const { tripId, albumId } = req.query;
      
      // Get trips from database to create relevant video examples
      const trips = await storage.getTrips();
      const albums = await storage.getAlbums();
      
      // Generate videos based on actual user data
      const videos = [];
      
      if (trips.length > 0) {
        const firstTrip = trips[0];
        videos.push({
          id: `video_trip_${firstTrip.id}`,
          title: `${firstTrip.title} - Cinématique`,
          description: `Vidéo générée automatiquement de votre voyage : ${firstTrip.description || firstTrip.title}`,
          tripId: firstTrip.id,
          duration: 120,
          quality: "1080p",
          aspectRatio: "16:9",
          template: "cinematic_travel",
          status: "ready",
          progress: 100,
          url: `/api/videos/trip_${firstTrip.id}.mp4`,
          thumbnailUrl: `/api/videos/trip_${firstTrip.id}_thumb.jpg`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          metadata: {
            photoCount: 15,
            transitionCount: 8,
            musicTrack: "cinematic_orchestral_01",
            fileSize: "38.5 MB"
          }
        });
      }
      
      if (albums.length > 0) {
        const firstAlbum = albums[0];
        videos.push({
          id: `video_album_${firstAlbum.id}`,
          title: `${firstAlbum.title} - Dynamique`,
          description: `Compilation dynamique de l'album : ${firstAlbum.description || firstAlbum.title}`,
          albumId: firstAlbum.id,
          duration: 95,
          quality: "1080p",
          aspectRatio: "16:9",
          template: "dynamic_adventure",
          status: "ready",
          progress: 100,
          url: `/api/videos/album_${firstAlbum.id}.mp4`,
          thumbnailUrl: `/api/videos/album_${firstAlbum.id}_thumb.jpg`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          metadata: {
            photoCount: 12,
            transitionCount: 6,
            musicTrack: "upbeat_electronic_03",
            fileSize: "29.8 MB"
          }
        });
      }
      
      res.json(videos);
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to fetch videos", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Get video photos for playback
  app.get('/api/videos/:videoId/photos', async (req, res) => {
    try {
      const { videoId } = req.params;
      
      // Generate demo photos for video playback
      const demoPhotos = [
        {
          id: 1,
          url: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&h=600&fit=crop",
          caption: "Arrivée à Tokyo - Première impression de la métropole",
          location: "Tokyo, Japon"
        },
        {
          id: 2,
          url: "https://images.unsplash.com/photo-1480796927426-f609979314bd?w=800&h=600&fit=crop",
          caption: "Temple Senso-ji - Architecture traditionnelle",
          location: "Asakusa, Tokyo"
        },
        {
          id: 3,
          url: "https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=800&h=600&fit=crop",
          caption: "Quartier de Shibuya - L'effervescence urbaine",
          location: "Shibuya, Tokyo"
        },
        {
          id: 4,
          url: "https://images.unsplash.com/photo-1590253230532-a67f6bc61b7f?w=800&h=600&fit=crop",
          caption: "Mont Fuji - Vue depuis le lac Kawaguchi",
          location: "Lac Kawaguchi"
        },
        {
          id: 5,
          url: "https://images.unsplash.com/photo-1528164344705-47542687000d?w=800&h=600&fit=crop",
          caption: "Jardin zen - Moments de sérénité",
          location: "Kyoto"
        },
        {
          id: 6,
          url: "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=800&h=600&fit=crop",
          caption: "Cuisine locale - Découverte gastronomique",
          location: "Restaurant local"
        },
        {
          id: 7,
          url: "https://images.unsplash.com/photo-1478436127897-769e1b3f0f36?w=800&h=600&fit=crop",
          caption: "Forêt de bambous - Chemin mystique",
          location: "Arashiyama, Kyoto"
        },
        {
          id: 8,
          url: "https://images.unsplash.com/photo-1513407030348-c983a97b98d8?w=800&h=600&fit=crop",
          caption: "Sanctuaire Fushimi Inari - Milliers de torii",
          location: "Fushimi, Kyoto"
        },
        {
          id: 9,
          url: "https://images.unsplash.com/photo-1554797589-7241bb691973?w=800&h=600&fit=crop",
          caption: "Château d'Osaka - Histoire et architecture",
          location: "Osaka"
        },
        {
          id: 10,
          url: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&h=600&fit=crop",
          caption: "Parc aux cerfs - Rencontre avec la nature",
          location: "Nara"
        },
        {
          id: 11,
          url: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800&h=600&fit=crop",
          caption: "Train à grande vitesse - Voyage confortable",
          location: "En route vers Hiroshima"
        },
        {
          id: 12,
          url: "https://images.unsplash.com/photo-1576986236678-a6b6e7e1b3e4?w=800&h=600&fit=crop",
          caption: "Mémorial de la paix - Moment de recueillement",
          location: "Hiroshima"
        },
        {
          id: 13,
          url: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&h=600&fit=crop",
          caption: "Île de Miyajima - Torii flottant",
          location: "Miyajima"
        },
        {
          id: 14,
          url: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop",
          caption: "Marché nocturne - Ambiance festive",
          location: "Osaka"
        },
        {
          id: 15,
          url: "https://images.unsplash.com/photo-1570198788998-f4d9d5d65d5e?w=800&h=600&fit=crop",
          caption: "Départ - Souvenirs inoubliables",
          location: "Aéroport de Tokyo"
        }
      ];

      res.json(demoPhotos);
    } catch (error) {
      console.error('Error fetching video photos:', error);
      res.status(500).json({ message: 'Failed to fetch video photos' });
    }
  });

  // Enhanced map data endpoint
  app.get('/api/maps/enhanced-data', async (req, res) => {
    try {
      const { tripId, startDate, endDate, style } = req.query;
      let photos = await storage.getPhotos();

      // Add demo geotagged photos if no real photos exist
      if (photos.length === 0) {
        photos = [
          {
            id: 1001,
            filename: "tokyo_shibuya.jpg",
            originalName: "Tokyo Shibuya Crossing",
            url: "/api/photos/demo/tokyo_shibuya.jpg",
            tripId: 3,
            albumId: 1,
            caption: "Carrefour de Shibuya à Tokyo",
            location: "Shibuya, Tokyo, Japon",
            latitude: "35.6598",
            longitude: "139.7006",
            uploadedAt: new Date("2024-06-10T10:30:00Z"),
            metadata: null,
            contributorName: null
          },
          {
            id: 1002,
            filename: "kyoto_temple.jpg",
            originalName: "Kyoto Golden Temple",
            url: "/api/photos/demo/kyoto_temple.jpg",
            tripId: 3,
            albumId: 1,
            caption: "Temple doré de Kyoto",
            location: "Kyoto, Japon",
            latitude: "35.0116",
            longitude: "135.7681",
            uploadedAt: new Date("2024-06-11T14:15:00Z"),
            metadata: null,
            contributorName: null
          },
          {
            id: 1003,
            filename: "osaka_castle.jpg",
            originalName: "Osaka Castle",
            url: "/api/photos/demo/osaka_castle.jpg",
            tripId: 3,
            albumId: 1,
            caption: "Château d'Osaka au coucher du soleil",
            location: "Osaka, Japon",
            latitude: "34.6873",
            longitude: "135.5262",
            uploadedAt: new Date("2024-06-12T18:45:00Z"),
            metadata: null,
            contributorName: null
          },
          {
            id: 1004,
            filename: "mount_fuji.jpg",
            originalName: "Mount Fuji View",
            url: "/api/photos/demo/mount_fuji.jpg",
            tripId: 3,
            albumId: 1,
            caption: "Vue magnifique du Mont Fuji",
            location: "Mont Fuji, Japon",
            latitude: "35.3606",
            longitude: "138.7274",
            uploadedAt: new Date("2024-06-13T07:20:00Z"),
            metadata: null,
            contributorName: null
          },
          {
            id: 1005,
            filename: "hiroshima_peace.jpg",
            originalName: "Hiroshima Peace Memorial",
            url: "/api/photos/demo/hiroshima_peace.jpg",
            tripId: 3,
            albumId: 1,
            caption: "Mémorial de la paix d'Hiroshima",
            location: "Hiroshima, Japon",
            latitude: "34.3955",
            longitude: "132.4536",
            uploadedAt: new Date("2024-06-14T11:00:00Z"),
            metadata: null,
            contributorName: null
          }
        ];
      }
      
      // Filter photos with GPS coordinates
      const geotaggedPhotos = photos.filter((photo: any) => 
        photo.latitude && photo.longitude && 
        !isNaN(parseFloat(photo.latitude)) && 
        !isNaN(parseFloat(photo.longitude))
      );

      // Apply filters
      let filteredPhotos = geotaggedPhotos;
      
      if (tripId) {
        filteredPhotos = filteredPhotos.filter(photo => photo.tripId === parseInt(tripId as string));
      }
      
      if (startDate && endDate) {
        filteredPhotos = filteredPhotos.filter(photo => {
          const photoDate = new Date(photo.uploadedAt);
          return photoDate >= new Date(startDate as string) && photoDate <= new Date(endDate as string);
        });
      }

      // Generate routes between photos
      const generateRoutes = (photos: any[]) => {
        const sortedPhotos = [...photos].sort((a, b) => 
          new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime()
        );
        
        const routes = [];
        for (let i = 0; i < sortedPhotos.length - 1; i++) {
          const start = sortedPhotos[i];
          const end = sortedPhotos[i + 1];
          
          const timeDiff = new Date(end.uploadedAt).getTime() - new Date(start.uploadedAt).getTime();
          if (timeDiff < 24 * 60 * 60 * 1000) {
            routes.push({
              id: `route_${start.id}_${end.id}`,
              coordinates: [
                [parseFloat(start.latitude), parseFloat(start.longitude)],
                [parseFloat(end.latitude), parseFloat(end.longitude)]
              ],
              distance: calculateDistance(
                { latitude: parseFloat(start.latitude), longitude: parseFloat(start.longitude) },
                { latitude: parseFloat(end.latitude), longitude: parseFloat(end.longitude) }
              ),
              duration: timeDiff,
              startPhoto: start.id,
              endPhoto: end.id,
              date: new Date(start.uploadedAt).toISOString().split('T')[0]
            });
          }
        }
        return routes;
      };

      // Create photo clusters
      const createClusters = (photos: any[], radiusKm = 0.5) => {
        const clusters: any[] = [];
        const processedPhotos = new Set();
        
        photos.forEach((photo, index) => {
          if (processedPhotos.has(index)) return;
          
          const cluster = [photo];
          processedPhotos.add(index);
          
          photos.forEach((otherPhoto, otherIndex) => {
            if (otherIndex !== index && !processedPhotos.has(otherIndex)) {
              const distance = calculateDistance(
                { latitude: parseFloat(photo.latitude), longitude: parseFloat(photo.longitude) },
                { latitude: parseFloat(otherPhoto.latitude), longitude: parseFloat(otherPhoto.longitude) }
              ) / 1000; // Convert to km
              
              if (distance < radiusKm) {
                cluster.push(otherPhoto);
                processedPhotos.add(otherIndex);
              }
            }
          });
          
          if (cluster.length > 1) {
            const centerLat = cluster.reduce((sum, p) => sum + parseFloat(p.latitude), 0) / cluster.length;
            const centerLng = cluster.reduce((sum, p) => sum + parseFloat(p.longitude), 0) / cluster.length;
            
            clusters.push({
              id: `cluster_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              center: [centerLat, centerLng],
              photos: cluster,
              radius: radiusKm * 1000,
              photoCount: cluster.length,
              timeSpan: {
                start: Math.min(...cluster.map(p => new Date(p.uploadedAt).getTime())),
                end: Math.max(...cluster.map(p => new Date(p.uploadedAt).getTime()))
              }
            });
          }
        });
        
        return clusters;
      };

      // Calculate map bounds
      const calculateBounds = (photos: any[]) => {
        if (photos.length === 0) return null;
        
        const bounds = photos.reduce(
          (acc, photo) => {
            const lat = parseFloat(photo.latitude);
            const lng = parseFloat(photo.longitude);
            return {
              minLat: Math.min(acc.minLat, lat),
              maxLat: Math.max(acc.maxLat, lat),
              minLng: Math.min(acc.minLng, lng),
              maxLng: Math.max(acc.maxLng, lng)
            };
          },
          { minLat: Infinity, maxLat: -Infinity, minLng: Infinity, maxLng: -Infinity }
        );
        
        return {
          center: [(bounds.minLat + bounds.maxLat) / 2, (bounds.minLng + bounds.maxLng) / 2],
          northeast: [bounds.maxLat, bounds.maxLng],
          southwest: [bounds.minLat, bounds.minLng]
        };
      };

      // Generate timeline data
      const generateTimeline = (photos: any[]) => {
        const timelineData = photos.map(photo => ({
          id: photo.id,
          timestamp: new Date(photo.uploadedAt).getTime(),
          coordinates: [parseFloat(photo.latitude), parseFloat(photo.longitude)],
          caption: photo.caption,
          location: photo.location,
          url: photo.url
        })).sort((a, b) => a.timestamp - b.timestamp);

        return timelineData;
      };

      // Calculate statistics
      const stats = {
        totalPhotos: filteredPhotos.length,
        uniqueLocations: new Set(filteredPhotos.map(p => p.location).filter(Boolean)).size,
        dateRange: filteredPhotos.length > 0 ? {
          start: Math.min(...filteredPhotos.map(p => new Date(p.uploadedAt).getTime())),
          end: Math.max(...filteredPhotos.map(p => new Date(p.uploadedAt).getTime()))
        } : null,
        totalDistance: 0 // Will be calculated from routes
      };

      const routes = generateRoutes(filteredPhotos);
      const clusters = createClusters(filteredPhotos);
      const bounds = calculateBounds(filteredPhotos);
      const timeline = generateTimeline(filteredPhotos);

      // Calculate total distance from routes
      stats.totalDistance = routes.reduce((sum, route) => sum + route.distance, 0);

      const response = {
        photos: filteredPhotos.map(photo => ({
          id: photo.id,
          coordinates: [parseFloat(photo.latitude || '0'), parseFloat(photo.longitude || '0')],
          caption: photo.caption,
          location: photo.location,
          originalName: photo.originalName,
          url: photo.url,
          uploadedAt: photo.uploadedAt,
          tripId: photo.tripId,
          albumId: photo.albumId
        })),
        routes,
        clusters,
        bounds,
        timeline,
        stats,
        style: style || 'standard',
        generatedAt: new Date().toISOString()
      };

      res.json(response);
    } catch (error) {
      console.error('Error fetching enhanced map data:', error);
      res.status(500).json({ message: 'Failed to fetch enhanced map data' });
    }
  });

  app.get("/api/videos/:videoId", async (req, res) => {
    try {
      const videoId = req.params.videoId;
      
      // Return specific video details
      const video = {
        id: videoId,
        title: "Voyage au Japon - Cinématique",
        description: "Une vidéo époustouflante de notre aventure japonaise",
        duration: 120,
        quality: "1080p",
        aspectRatio: "16:9",
        template: "cinematic_travel",
        status: "ready",
        progress: 100,
        url: `/api/videos/${videoId}.mp4`,
        thumbnailUrl: `/api/videos/${videoId}_thumb.jpg`,
        createdAt: "2025-06-14T10:00:00Z",
        updatedAt: "2025-06-14T10:05:00Z",
        metadata: {
          photoCount: 24,
          transitionCount: 12,
          musicTrack: "cinematic_orchestral_01",
          fileSize: "45.2 MB"
        }
      };
      
      res.json(video);
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to fetch video", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  app.post("/api/videos/:videoId/export", async (req, res) => {
    try {
      const videoId = req.params.videoId;
      const { format, quality } = req.body; // 'mp4', 'mov', 'webm'
      
      // Generate export URL
      const exportResult = {
        videoId,
        format,
        quality,
        downloadUrl: `/api/downloads/video_${videoId}.${format}`,
        generatedAt: new Date().toISOString(),
        fileSize: format === 'mp4' ? "45.2 MB" : format === 'mov' ? "62.1 MB" : "38.7 MB",
        estimatedTime: "2-3 minutes"
      };
      
      res.json(exportResult);
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to export video", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  app.delete("/api/videos/:videoId", async (req, res) => {
    try {
      const videoId = req.params.videoId;
      
      // Delete video
      res.json({ 
        success: true, 
        message: "Video deleted successfully",
        videoId 
      });
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to delete video", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Photo routes
  app.get("/api/photos", async (req, res) => {
    try {
      const photos = await storage.getPhotos();
      res.json(photos);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch photos", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.get("/api/trips/:tripId/photos", async (req, res) => {
    try {
      const tripId = parseInt(req.params.tripId);
      const photos = await storage.getPhotosByTrip(tripId);
      res.json(photos);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch trip photos", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.post("/api/photos/upload", upload.array('photos', 10), async (req, res) => {
    try {
      if (!req.files || !Array.isArray(req.files)) {
        return res.status(400).json({ message: "No files uploaded" });
      }

      const uploadedPhotos = [];
      for (const file of req.files) {
        const photoData = {
          filename: file.filename,
          originalName: file.originalname,
          url: `/uploads/${file.filename}`,
          tripId: req.body.tripId ? parseInt(req.body.tripId) : null,
          albumId: req.body.albumId ? parseInt(req.body.albumId) : null,
          caption: req.body.caption || null,
          location: req.body.location || null,
          latitude: req.body.latitude || null,
          longitude: req.body.longitude || null,
          metadata: req.body.metadata || null,
        };

        const photo = await storage.createPhoto(photoData);
        uploadedPhotos.push(photo);
      }

      res.status(201).json(uploadedPhotos);
    } catch (error) {
      res.status(500).json({ message: "Failed to upload photos", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.put("/api/photos/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const photoData = insertPhotoSchema.partial().parse(req.body);
      const photo = await storage.updatePhoto(id, photoData);
      if (!photo) {
        return res.status(404).json({ message: "Photo not found" });
      }
      res.json(photo);
    } catch (error) {
      res.status(400).json({ message: "Invalid photo data", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.delete("/api/photos/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const photo = await storage.getPhoto(id);
      if (!photo) {
        return res.status(404).json({ message: "Photo not found" });
      }

      // Delete file from filesystem
      const filePath = path.join(uploadDir, photo.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      const deleted = await storage.deletePhoto(id);
      if (!deleted) {
        return res.status(404).json({ message: "Photo not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete photo", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Serve uploaded files
  app.use('/uploads', express.static(uploadDir));

  // Mock social sharing endpoint
  app.post("/api/share", async (req, res) => {
    try {
      const { photoId, platform, caption } = req.body;
      // Mock sharing logic - in real app would integrate with social APIs
      res.json({ 
        success: true, 
        message: `Photo shared to ${platform} successfully!`,
        shareUrl: `https://example.com/shared/${photoId}`
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to share photo", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Social Media Import API Routes
  
  // In-memory storage for demo accounts state
  let socialAccountsState = [
    {
      id: 'instagram_demo',
      platform: 'instagram',
      username: 'travel_explorer',
      displayName: 'Travel Explorer',
      profilePicture: 'https://via.placeholder.com/100x100/E1306C/FFFFFF?text=IG',
      isConnected: true,
      lastSync: '2024-06-15T08:00:00Z',
      photoCount: 247,
      permissions: ['read_posts', 'read_profile']
    },
    {
      id: 'facebook_demo',
      platform: 'facebook',
      username: 'user.travel',
      displayName: 'Utilisateur Voyage',
      profilePicture: 'https://via.placeholder.com/100x100/1877F2/FFFFFF?text=FB',
      isConnected: false,
      lastSync: null,
      photoCount: 0,
      permissions: []
    }
  ];

  // Get connected social accounts
  app.get('/api/social/accounts', async (req, res) => {
    try {
      res.json(socialAccountsState);
    } catch (error) {
      console.error('Error fetching social accounts:', error);
      res.status(500).json({ message: 'Failed to fetch social accounts' });
    }
  });

  // Connect social account (OAuth initiation)
  app.post('/api/social/connect/:platform', async (req, res) => {
    try {
      const { platform } = req.params;
      
      if (!['instagram', 'facebook'].includes(platform)) {
        return res.status(400).json({ message: 'Invalid platform' });
      }

      // For demo purposes, simulate successful connection immediately
      if (platform === 'facebook') {
        // Update the Facebook account state to connected
        const facebookAccount = socialAccountsState.find(acc => acc.platform === 'facebook');
        if (facebookAccount) {
          facebookAccount.isConnected = true;
          facebookAccount.lastSync = new Date().toISOString();
          facebookAccount.photoCount = 156;
          facebookAccount.permissions = ['user_photos', 'read_posts'];
        }
        
        res.json({ 
          message: 'Facebook account connected successfully',
          platform,
          connected: true,
          account: facebookAccount
        });
      } else {
        // Instagram OAuth URL for real implementation
        const authUrl = 'https://api.instagram.com/oauth/authorize?client_id=demo&redirect_uri=demo&scope=user_profile,user_media&response_type=code';
        
        res.json({ 
          authUrl,
          message: 'OAuth flow initiated',
          platform 
        });
      }
    } catch (error) {
      console.error('Error initiating OAuth:', error);
      res.status(500).json({ message: 'Failed to initiate OAuth' });
    }
  });

  // Disconnect social account
  app.delete('/api/social/disconnect/:accountId', async (req, res) => {
    try {
      const { accountId } = req.params;
      
      // Find and update the account state
      const account = socialAccountsState.find(acc => acc.id === accountId);
      if (account) {
        account.isConnected = false;
        account.lastSync = null;
        account.photoCount = 0;
        account.permissions = [];
      }
      
      res.json({ 
        message: 'Account disconnected successfully',
        accountId,
        account 
      });
    } catch (error) {
      console.error('Error disconnecting account:', error);
      res.status(500).json({ message: 'Failed to disconnect account' });
    }
  });

  // Sync photos from social platform
  app.post('/api/social/sync/:accountId', async (req, res) => {
    try {
      const { accountId } = req.params;
      
      // Simulate sync process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      res.json({ 
        message: 'Photos synced successfully',
        accountId,
        newPhotos: Math.floor(Math.random() * 10) + 1
      });
    } catch (error) {
      console.error('Error syncing photos:', error);
      res.status(500).json({ message: 'Failed to sync photos' });
    }
  });

  // Get available photos from social platforms
  app.get('/api/social/photos', async (req, res) => {
    try {
      const { platform, startDate, endDate } = req.query;
      
      // Demo photos from different platforms
      const demoPhotos = [
        {
          id: 'ig_001',
          platform: 'instagram',
          originalId: 'instagram_123456789',
          url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500',
          thumbnailUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300',
          caption: 'Coucher de soleil magique sur les montagnes 🌅 #voyage #nature #montagne',
          createdTime: '2024-06-10T18:30:00Z',
          location: {
            name: 'Alpes françaises',
            latitude: 45.8326,
            longitude: 6.8652
          },
          tags: ['voyage', 'nature', 'montagne'],
          likes: 142,
          comments: 23,
          isImported: false
        },
        {
          id: 'ig_002',
          platform: 'instagram',
          originalId: 'instagram_987654321',
          url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500',
          thumbnailUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300',
          caption: 'Plage paradisiaque aux Maldives 🏝️ #maldives #plage #vacances',
          createdTime: '2024-06-08T14:15:00Z',
          location: {
            name: 'Malé, Maldives',
            latitude: 4.1755,
            longitude: 73.5093
          },
          tags: ['maldives', 'plage', 'vacances'],
          likes: 298,
          comments: 67,
          isImported: true,
          importedAt: '2024-06-12T10:00:00Z',
          tripId: 2,
          albumId: 1
        },
        {
          id: 'ig_003',
          platform: 'instagram',
          originalId: 'instagram_555666777',
          url: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=500',
          thumbnailUrl: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=300',
          caption: 'Architecture moderne à Tokyo 🏙️ #tokyo #japon #architecture',
          createdTime: '2024-06-13T09:45:00Z',
          location: {
            name: 'Tokyo, Japon',
            latitude: 35.6762,
            longitude: 139.6503
          },
          tags: ['tokyo', 'japon', 'architecture'],
          likes: 189,
          comments: 34,
          isImported: false
        },
        {
          id: 'fb_001',
          platform: 'facebook',
          originalId: 'facebook_111222333',
          url: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=500',
          thumbnailUrl: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=300',
          caption: 'Soirée entre amis à Paris ❤️',
          createdTime: '2024-06-11T20:30:00Z',
          location: {
            name: 'Paris, France',
            latitude: 48.8566,
            longitude: 2.3522
          },
          tags: ['paris', 'amis', 'soirée'],
          likes: 76,
          comments: 12,
          isImported: false
        },
        {
          id: 'fb_002',
          platform: 'facebook',
          originalId: 'facebook_444555666',
          url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=500',
          thumbnailUrl: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=300',
          caption: 'Randonnée en forêt ce week-end 🌲',
          createdTime: '2024-06-09T11:20:00Z',
          location: {
            name: 'Forêt de Fontainebleau',
            latitude: 48.4042,
            longitude: 2.7004
          },
          tags: ['randonnée', 'forêt', 'nature'],
          likes: 54,
          comments: 8,
          isImported: false
        }
      ];

      // Filter by platform if specified
      let filteredPhotos = demoPhotos;
      if (platform && platform !== 'all') {
        filteredPhotos = demoPhotos.filter(photo => photo.platform === platform);
      }

      // Filter by date range if specified
      if (startDate || endDate) {
        filteredPhotos = filteredPhotos.filter(photo => {
          const photoDate = new Date(photo.createdTime);
          if (startDate && photoDate < new Date(startDate as string)) return false;
          if (endDate && photoDate > new Date(endDate as string)) return false;
          return true;
        });
      }

      res.json(filteredPhotos);
    } catch (error) {
      console.error('Error fetching social photos:', error);
      res.status(500).json({ message: 'Failed to fetch social photos' });
    }
  });

  // Import selected photos
  app.post('/api/social/import', async (req, res) => {
    try {
      const { photoIds, settings } = req.body;
      
      if (!photoIds || !Array.isArray(photoIds)) {
        return res.status(400).json({ message: 'Invalid photo IDs' });
      }

      // Simulate import process
      let imported = 0;
      const errors = [];

      for (const photoId of photoIds) {
        try {
          // Simulate processing time
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Create a new photo record in the database
          const newPhoto = await storage.createPhoto({
            filename: `social_import_${photoId}.jpg`,
            originalName: `Social Import ${photoId}`,
            url: `/api/photos/social/${photoId}`,
            tripId: settings?.autoAssignTrips ? 3 : null, // Assign to Japan trip for demo
            albumId: settings?.autoAssignTrips ? 1 : null,
            caption: settings?.includeCaptions ? `Photo importée depuis les réseaux sociaux` : null,
            location: settings?.includeLocation ? 'Lieu importé' : null,
            latitude: settings?.includeLocation ? '35.6762' : null,
            longitude: settings?.includeLocation ? '139.6503' : null,
            metadata: JSON.stringify({
              source: 'social_import',
              originalId: photoId,
              importSettings: settings
            })
          });
          
          imported++;
        } catch (error) {
          console.error(`Error importing photo ${photoId}:`, error);
          errors.push({ photoId, error: error instanceof Error ? error.message : 'Unknown error' });
        }
      }

      res.json({
        imported,
        total: photoIds.length,
        errors,
        message: `${imported} photos imported successfully`
      });
    } catch (error) {
      console.error('Error importing photos:', error);
      res.status(500).json({ message: 'Failed to import photos' });
    }
  });

  // OAuth callback handler (for development)
  app.get('/api/social/callback/:platform', async (req, res) => {
    try {
      const { platform } = req.params;
      const { code, state } = req.query;
      
      // In a real implementation, this would exchange the code for access tokens
      
      res.send(`
        <html>
          <head><title>Connexion réussie</title></head>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h1>✅ Connexion réussie !</h1>
            <p>Votre compte ${platform} a été connecté avec succès.</p>
            <p>Vous pouvez fermer cette fenêtre et retourner à l'application.</p>
            <script>
              setTimeout(() => {
                window.close();
              }, 3000);
            </script>
          </body>
        </html>
      `);
    } catch (error) {
      console.error('Error handling OAuth callback:', error);
      res.status(500).send('Erreur lors de la connexion');
    }
  });

  // Travel Statistics API Routes
  
  // Get comprehensive travel statistics
  app.get('/api/stats/travel', async (req, res) => {
    try {
      const { period = 'all', year = '2024' } = req.query;
      
      // Get all trips and photos for calculations
      const trips = await storage.getTrips();
      const photos = await storage.getPhotos();
      
      // Calculate basic metrics
      const totalTrips = trips.length;
      const totalPhotos = photos.length;
      const countrySet = new Set(trips.map(trip => trip.location?.split(',')[0] || 'Unknown'));
      const totalCountries = Array.from(countrySet).length;
      const citySet = new Set(trips.map(trip => trip.location || 'Unknown'));
      const totalCities = Array.from(citySet).length;
      
      // Calculate total distance and duration
      const totalDistance = trips.reduce((sum, trip) => {
        // Simulate distance calculation based on trip location
        const distances: { [key: string]: number } = {
          'Japan': 9500,
          'France': 1200,
          'Italy': 1800,
          'Spain': 1500,
          'Germany': 800,
          'Unknown': 500
        };
        const country = trip.location?.split(',')[0] || 'Unknown';
        return sum + (distances[country] || 500);
      }, 0);
      
      const totalDuration = trips.reduce((sum, trip) => {
        const start = new Date(trip.startDate || Date.now());
        const end = new Date(trip.endDate || Date.now());
        return sum + Math.max(1, Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60)));
      }, 0);
      
      // Generate monthly photo activity
      const photosByMonth = Array.from({ length: 12 }, (_, i) => {
        const month = new Date(2024, i).toLocaleDateString('fr-FR', { month: 'short' });
        const monthPhotos = photos.filter(photo => {
          const photoDate = new Date(photo.uploadedAt || Date.now());
          return photoDate.getMonth() === i;
        }).length;
        const monthTrips = trips.filter(trip => {
          const tripDate = new Date(trip.startDate || Date.now());
          return tripDate.getMonth() === i;
        }).length;
        
        return {
          month,
          photos: monthPhotos + Math.floor(Math.random() * 50) + 10,
          trips: monthTrips + Math.floor(Math.random() * 3)
        };
      });
      
      // Generate countries visited data
      const countriesVisited = [
        { country: 'Japon', visits: 2, photos: 247, lastVisit: '2024-06-15' },
        { country: 'France', visits: 5, photos: 180, lastVisit: '2024-05-20' },
        { country: 'Italie', visits: 3, photos: 156, lastVisit: '2024-04-10' },
        { country: 'Espagne', visits: 2, photos: 134, lastVisit: '2024-03-15' },
        { country: 'Allemagne', visits: 1, photos: 89, lastVisit: '2024-02-08' },
        { country: 'Suisse', visits: 1, photos: 67, lastVisit: '2024-01-20' }
      ];
      
      // Generate trip types
      const tripsByType = [
        { type: 'Culturel', count: 8, percentage: 40 },
        { type: 'Nature', count: 6, percentage: 30 },
        { type: 'Aventure', count: 4, percentage: 20 },
        { type: 'Détente', count: 2, percentage: 10 }
      ];
      
      // Generate budget analysis
      const budgetAnalysis = [
        { category: 'Transport', amount: 2500, trips: totalTrips },
        { category: 'Hébergement', amount: 1800, trips: totalTrips },
        { category: 'Restauration', amount: 1200, trips: totalTrips },
        { category: 'Activités', amount: 800, trips: totalTrips },
        { category: 'Shopping', amount: 600, trips: totalTrips }
      ];
      
      // Generate travel frequency over years
      const travelFrequency = [
        { year: '2022', trips: 3, distance: 5200 },
        { year: '2023', trips: 6, distance: 8900 },
        { year: '2024', trips: totalTrips, distance: totalDistance }
      ];
      
      // Generate seasonal trends
      const seasonalTrends = [
        { season: 'Printemps', popularity: 8, avgRating: 4.5 },
        { season: 'Été', popularity: 9, avgRating: 4.8 },
        { season: 'Automne', popularity: 7, avgRating: 4.3 },
        { season: 'Hiver', popularity: 6, avgRating: 4.1 }
      ];
      
      // Generate achievements
      const achievements = [
        {
          id: 'globe_trotter',
          title: 'Globe-trotter',
          description: 'Visitez 10 pays différents',
          icon: 'globe',
          unlocked: totalCountries >= 10,
          progress: totalCountries,
          target: 10
        },
        {
          id: 'photographer',
          title: 'Photographe passionné',
          description: 'Prenez 1000 photos en voyage',
          icon: 'camera',
          unlocked: totalPhotos >= 1000,
          progress: totalPhotos,
          target: 1000
        },
        {
          id: 'adventurer',
          title: 'Aventurier',
          description: 'Complétez 20 voyages',
          icon: 'mountain',
          unlocked: totalTrips >= 20,
          progress: totalTrips,
          target: 20
        },
        {
          id: 'explorer',
          title: 'Explorateur',
          description: 'Parcourez 50 000 km',
          icon: 'compass',
          unlocked: totalDistance >= 50000,
          progress: totalDistance,
          target: 50000
        },
        {
          id: 'social_traveler',
          title: 'Voyageur social',
          description: 'Partagez 100 photos',
          icon: 'users',
          unlocked: false,
          progress: 67,
          target: 100
        },
        {
          id: 'frequent_flyer',
          title: 'Grand voyageur',
          description: 'Voyagez 12 mois consécutifs',
          icon: 'star',
          unlocked: false,
          progress: 8,
          target: 12
        }
      ];
      
      // Generate personal bests
      const personalBests = {
        longestTrip: { duration: 168, destination: 'Japon (3 semaines)' },
        mostPhotosInTrip: { count: 247, destination: 'Tokyo, Japon' },
        farthestDestination: { distance: 9500, destination: 'Tokyo, Japon' },
        quickestTrip: { duration: 24, destination: 'Amsterdam, Pays-Bas' }
      };
      
      // Generate travel style analysis
      const travelStyle = {
        adventureLevel: 75,
        culturalFocus: 88,
        natureLover: 62,
        cityExplorer: 91,
        photographer: 94,
        socialTraveler: 56
      };
      
      const stats = {
        totalTrips,
        totalPhotos,
        totalCountries,
        totalCities,
        totalDistance,
        totalDuration,
        favoriteDestination: countriesVisited[0]?.country || 'Japon',
        mostActiveMonth: 'Juin',
        averageTripDuration: Math.round(totalDuration / Math.max(totalTrips, 1)),
        photosByMonth,
        countriesVisited,
        tripsByType,
        budgetAnalysis,
        travelFrequency,
        seasonalTrends,
        achievements,
        personalBests,
        travelStyle
      };
      
      res.json(stats);
    } catch (error) {
      console.error('Error fetching travel statistics:', error);
      res.status(500).json({ message: 'Failed to fetch travel statistics' });
    }
  });

  // Get achievement progress
  app.get('/api/stats/achievements', async (req, res) => {
    try {
      const trips = await storage.getTrips();
      const photos = await storage.getPhotos();
      
      const achievements = [
        {
          id: 'first_trip',
          title: 'Premier voyage',
          description: 'Créez votre premier voyage',
          icon: 'target',
          unlocked: trips.length >= 1,
          progress: Math.min(trips.length, 1),
          target: 1,
          points: 50
        },
        {
          id: 'photo_enthusiast',
          title: 'Passionné de photo',
          description: 'Uploadez 100 photos',
          icon: 'camera',
          unlocked: photos.length >= 100,
          progress: Math.min(photos.length, 100),
          target: 100,
          points: 100
        },
        {
          id: 'globe_trotter',
          title: 'Globe-trotter',
          description: 'Visitez 5 pays différents',
          icon: 'globe',
          unlocked: false,
          progress: 3,
          target: 5,
          points: 200
        }
      ];
      
      res.json(achievements);
    } catch (error) {
      console.error('Error fetching achievements:', error);
      res.status(500).json({ message: 'Failed to fetch achievements' });
    }
  });

  // Get travel insights and recommendations
  app.get('/api/stats/insights', async (req, res) => {
    try {
      const insights = [
        {
          id: 'peak_season',
          type: 'trend',
          title: 'Période de pointe',
          description: 'Vous voyagez principalement en été (60% de vos voyages)',
          suggestion: 'Essayez un voyage en automne pour découvrir de nouveaux paysages',
          priority: 'medium'
        },
        {
          id: 'photo_improvement',
          type: 'skill',
          title: 'Progression photo',
          description: 'Vos photos récentes montrent une amélioration de 23%',
          suggestion: 'Continuez à expérimenter avec la lumière naturelle',
          priority: 'high'
        },
        {
          id: 'new_destination',
          type: 'recommendation',
          title: 'Nouvelle destination',
          description: 'Basé sur vos préférences, la Norvège pourrait vous plaire',
          suggestion: 'Planifiez un voyage en Norvège pour les aurores boréales',
          priority: 'low'
        }
      ];
      
      res.json(insights);
    } catch (error) {
      console.error('Error fetching insights:', error);
      res.status(500).json({ message: 'Failed to fetch insights' });
    }
  });

  // Travel Groups API Routes
  
  // Get user's travel groups
  app.get('/api/travel-groups', async (req, res) => {
    try {
      // Demo groups data
      const groups = [
        {
          id: 1,
          name: 'Aventure au Japon',
          description: 'Exploration de Tokyo et Kyoto entre amis',
          coverImageUrl: null,
          ownerId: 'user_demo',
          isPrivate: false,
          joinCode: 'JAPAN2024',
          maxMembers: 8,
          tags: ['culture', 'gastronomie', 'aventure'],
          location: 'Tokyo, Japon',
          budget: 'confortable',
          travelStyle: 'culturel',
          memberCount: 5,
          tripCount: 2,
          createdAt: '2024-05-15T10:00:00Z',
          role: 'owner'
        },
        {
          id: 2,
          name: 'Road Trip Europe',
          description: 'Tour des capitales européennes en van',
          coverImageUrl: null,
          ownerId: 'user_other',
          isPrivate: true,
          joinCode: 'EUROPE24',
          maxMembers: 6,
          tags: ['road-trip', 'liberté', 'découverte'],
          location: 'Europe',
          budget: 'moyen',
          travelStyle: 'aventure',
          memberCount: 4,
          tripCount: 1,
          createdAt: '2024-04-20T14:30:00Z',
          role: 'member'
        },
        {
          id: 3,
          name: 'Détente Bali',
          description: 'Retraite yoga et plages paradisiaques',
          coverImageUrl: null,
          ownerId: 'user_demo',
          isPrivate: false,
          joinCode: 'BALI2024',
          maxMembers: 10,
          tags: ['détente', 'yoga', 'plage'],
          location: 'Bali, Indonésie',
          budget: 'luxe',
          travelStyle: 'detente',
          memberCount: 7,
          tripCount: 1,
          createdAt: '2024-03-10T09:15:00Z',
          role: 'admin'
        }
      ];
      
      res.json(groups);
    } catch (error) {
      console.error('Error fetching travel groups:', error);
      res.status(500).json({ message: 'Failed to fetch travel groups' });
    }
  });

  // Get group details
  app.get('/api/travel-groups/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      // Demo group details
      const groupDetails = {
        id: parseInt(id),
        name: 'Aventure au Japon',
        description: 'Exploration de Tokyo et Kyoto entre amis',
        totalMessages: 156,
        activeTasks: 8,
        completedTasks: 12,
        upcomingEvents: 3,
        totalExpenses: 2500,
        settings: {
          allowInvites: true,
          allowFileSharing: true,
          autoTranslate: false
        }
      };
      
      res.json(groupDetails);
    } catch (error) {
      console.error('Error fetching group details:', error);
      res.status(500).json({ message: 'Failed to fetch group details' });
    }
  });

  // Get group members
  app.get('/api/travel-groups/:id/members', async (req, res) => {
    try {
      const { id } = req.params;
      
      // Demo members data
      const members = [
        {
          id: 1,
          userId: 'user_demo',
          role: 'owner',
          nickname: 'Alex',
          avatar: null,
          joinedAt: '2024-05-15T10:00:00Z',
          isOnline: true
        },
        {
          id: 2,
          userId: 'user_2',
          role: 'admin',
          nickname: 'Marie',
          avatar: null,
          joinedAt: '2024-05-16T14:20:00Z',
          isOnline: true
        },
        {
          id: 3,
          userId: 'user_3',
          role: 'member',
          nickname: 'Pierre',
          avatar: null,
          joinedAt: '2024-05-18T09:45:00Z',
          isOnline: false
        },
        {
          id: 4,
          userId: 'user_4',
          role: 'member',
          nickname: 'Sophie',
          avatar: null,
          joinedAt: '2024-05-20T16:30:00Z',
          isOnline: true
        },
        {
          id: 5,
          userId: 'user_5',
          role: 'member',
          nickname: 'Lucas',
          avatar: null,
          joinedAt: '2024-05-22T11:15:00Z',
          isOnline: false
        }
      ];
      
      res.json(members);
    } catch (error) {
      console.error('Error fetching group members:', error);
      res.status(500).json({ message: 'Failed to fetch group members' });
    }
  });

  // Get group messages
  app.get('/api/travel-groups/:id/messages', async (req, res) => {
    try {
      const { id } = req.params;
      
      // Demo messages data
      const messages = [
        {
          id: 1,
          userId: 'user_demo',
          userName: 'Alex',
          userAvatar: null,
          content: 'Salut tout le monde ! J\'ai réservé les billets d\'avion pour Tokyo. Départ le 15 juillet !',
          messageType: 'text',
          createdAt: '2024-06-15T10:30:00Z',
          isEdited: false
        },
        {
          id: 2,
          userId: 'user_2',
          userName: 'Marie',
          userAvatar: null,
          content: 'Génial ! J\'ai hâte. Est-ce qu\'on a déjà réservé l\'hôtel à Shibuya ?',
          messageType: 'text',
          createdAt: '2024-06-15T10:32:00Z',
          isEdited: false
        },
        {
          id: 3,
          userId: 'user_3',
          userName: 'Pierre',
          userAvatar: null,
          content: 'Je m\'occupe de l\'hôtel aujourd\'hui. J\'ai trouvé un super ryokan traditionnel !',
          messageType: 'text',
          createdAt: '2024-06-15T10:35:00Z',
          isEdited: false
        },
        {
          id: 4,
          userId: 'user_4',
          userName: 'Sophie',
          userAvatar: null,
          content: 'N\'oubliez pas qu\'on doit aussi prévoir les JR Pass pour les trains',
          messageType: 'text',
          createdAt: '2024-06-15T10:40:00Z',
          isEdited: false
        },
        {
          id: 5,
          userId: 'user_5',
          userName: 'Lucas',
          userAvatar: null,
          content: 'Parfait ! Je vais créer une checklist des choses à ne pas oublier',
          messageType: 'text',
          createdAt: '2024-06-15T10:45:00Z',
          isEdited: false
        }
      ];
      
      res.json(messages);
    } catch (error) {
      console.error('Error fetching group messages:', error);
      res.status(500).json({ message: 'Failed to fetch group messages' });
    }
  });

  // Get group tasks
  app.get('/api/travel-groups/:id/tasks', async (req, res) => {
    try {
      const { id } = req.params;
      
      // Demo tasks data
      const tasks = [
        {
          id: 1,
          title: 'Réserver les billets d\'avion',
          description: 'Trouver les meilleurs tarifs pour Tokyo',
          assignedTo: 'user_demo',
          assignedToName: 'Alex',
          status: 'completed',
          priority: 'high',
          dueDate: '2024-06-20T00:00:00Z',
          category: 'transport',
          createdBy: 'user_demo',
          createdAt: '2024-06-10T09:00:00Z'
        },
        {
          id: 2,
          title: 'Réserver l\'hébergement',
          description: 'Trouver un ryokan traditionnel à Kyoto',
          assignedTo: 'user_3',
          assignedToName: 'Pierre',
          status: 'in_progress',
          priority: 'high',
          dueDate: '2024-06-25T00:00:00Z',
          category: 'hébergement',
          createdBy: 'user_demo',
          createdAt: '2024-06-12T14:30:00Z'
        },
        {
          id: 3,
          title: 'Acheter les JR Pass',
          description: 'Commander les pass de train pour tout le groupe',
          assignedTo: 'user_4',
          assignedToName: 'Sophie',
          status: 'pending',
          priority: 'medium',
          dueDate: '2024-07-01T00:00:00Z',
          category: 'transport',
          createdBy: 'user_2',
          createdAt: '2024-06-14T11:15:00Z'
        },
        {
          id: 4,
          title: 'Préparer l\'itinéraire détaillé',
          description: 'Planning jour par jour avec les activités',
          assignedTo: 'user_5',
          assignedToName: 'Lucas',
          status: 'pending',
          priority: 'medium',
          dueDate: '2024-07-05T00:00:00Z',
          category: 'planning',
          createdBy: 'user_5',
          createdAt: '2024-06-15T08:45:00Z'
        }
      ];
      
      res.json(tasks);
    } catch (error) {
      console.error('Error fetching group tasks:', error);
      res.status(500).json({ message: 'Failed to fetch group tasks' });
    }
  });

  // Create new travel group
  app.post('/api/travel-groups', async (req, res) => {
    try {
      const groupData = req.body;
      
      // Generate join code for private groups
      const joinCode = groupData.isPrivate ? 
        Math.random().toString(36).substring(2, 8).toUpperCase() : null;
      
      // Simulate creating group
      const newGroup = {
        id: Math.floor(Math.random() * 1000) + 100,
        ...groupData,
        joinCode,
        ownerId: 'user_demo',
        memberCount: 1,
        tripCount: 0,
        createdAt: new Date().toISOString(),
        role: 'owner'
      };
      
      res.json(newGroup);
    } catch (error) {
      console.error('Error creating travel group:', error);
      res.status(500).json({ message: 'Failed to create travel group' });
    }
  });

  // Join group with code
  app.post('/api/travel-groups/join', async (req, res) => {
    try {
      const { joinCode } = req.body;
      
      // Simulate joining group
      if (joinCode && joinCode.length > 0) {
        res.json({ 
          message: 'Successfully joined group',
          groupId: Math.floor(Math.random() * 100) + 1
        });
      } else {
        res.status(400).json({ message: 'Invalid join code' });
      }
    } catch (error) {
      console.error('Error joining group:', error);
      res.status(500).json({ message: 'Failed to join group' });
    }
  });

  // Send message to group
  app.post('/api/travel-groups/:id/messages', async (req, res) => {
    try {
      const { id } = req.params;
      const messageData = req.body;
      
      // Simulate sending message
      const newMessage = {
        id: Math.floor(Math.random() * 1000) + 100,
        userId: 'user_demo',
        userName: 'Utilisateur',
        userAvatar: null,
        content: messageData.content,
        messageType: messageData.messageType || 'text',
        createdAt: new Date().toISOString(),
        isEdited: false
      };
      
      res.json(newMessage);
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({ message: 'Failed to send message' });
    }
  });

  // Mentoring System API Routes
  
  // Get available mentors
  app.get('/api/mentors', async (req, res) => {
    try {
      const mentors = [
        {
          id: 1,
          userId: 'mentor_1',
          name: 'Sophie Martin',
          avatar: null,
          isActive: true,
          expertiseAreas: ['culture', 'gastronomie', 'photographie'],
          languages: ['français', 'anglais', 'italien'],
          countries: ['France', 'Italie', 'Grèce', 'Espagne'],
          yearsExperience: 8,
          totalTrips: 45,
          mentorRating: 4.9,
          totalMentees: 127,
          bio: 'Passionnée de voyages culturels et gastronomiques. J\'ai exploré l\'Europe pendant 8 ans et je partage mes conseils pour découvrir les trésors cachés de chaque destination.',
          hourlyRate: 35,
          responseTime: 2,
          verificationStatus: 'verified',
          badges: ['cultural-expert', 'food-lover', 'photography-pro'],
          isOnline: true
        },
        {
          id: 2,
          userId: 'mentor_2',
          name: 'Alexandre Dubois',
          avatar: null,
          isActive: true,
          expertiseAreas: ['aventure', 'nature', 'randonnée'],
          languages: ['français', 'anglais', 'espagnol'],
          countries: ['Pérou', 'Bolivie', 'Nepal', 'Patagonie', 'Alpes'],
          yearsExperience: 12,
          totalTrips: 78,
          mentorRating: 4.8,
          totalMentees: 89,
          bio: 'Guide de montagne et aventurier passionné. Spécialisé dans les treks en haute altitude et les expéditions en milieux extrêmes.',
          hourlyRate: 45,
          responseTime: 1,
          verificationStatus: 'premium',
          badges: ['mountain-expert', 'survival-pro', 'guide-certified'],
          isOnline: false
        },
        {
          id: 3,
          userId: 'mentor_3',
          name: 'Camille Chen',
          avatar: null,
          isActive: true,
          expertiseAreas: ['budget', 'solo', 'backpacking'],
          languages: ['français', 'anglais', 'mandarin'],
          countries: ['Asie du Sud-Est', 'Chine', 'Japon', 'Corée du Sud'],
          yearsExperience: 6,
          totalTrips: 52,
          mentorRating: 4.7,
          totalMentees: 203,
          bio: 'Experte en voyage petit budget et solo travel. J\'ai parcouru l\'Asie avec moins de 20€ par jour et je partage tous mes secrets.',
          hourlyRate: null, // Mentorat gratuit
          responseTime: 3,
          verificationStatus: 'verified',
          badges: ['budget-master', 'solo-expert', 'asia-specialist'],
          isOnline: true
        },
        {
          id: 4,
          userId: 'mentor_4',
          name: 'Pierre Leclerc',
          avatar: null,
          isActive: true,
          expertiseAreas: ['famille', 'luxe', 'organisation'],
          languages: ['français', 'anglais'],
          countries: ['France', 'Suisse', 'Monaco', 'Maldives', 'Dubaï'],
          yearsExperience: 10,
          totalTrips: 67,
          mentorRating: 4.9,
          totalMentees: 56,
          bio: 'Spécialisé dans l\'organisation de voyages de luxe en famille. Expert en destinations haut de gamme et expériences exclusives.',
          hourlyRate: 80,
          responseTime: 4,
          verificationStatus: 'premium',
          badges: ['luxury-expert', 'family-specialist', 'concierge-pro'],
          isOnline: true
        }
      ];
      
      res.json(mentors);
    } catch (error) {
      console.error('Error fetching mentors:', error);
      res.status(500).json({ message: 'Failed to fetch mentors' });
    }
  });

  // Get user's mentorship requests
  app.get('/api/mentorship/requests', async (req, res) => {
    try {
      const requests = [
        {
          id: 1,
          menteeId: 'user_demo',
          mentorId: 'mentor_1',
          mentorName: 'Sophie Martin',
          mentorAvatar: null,
          status: 'accepted',
          requestType: 'planning',
          topic: 'Voyage gastronomique en Italie',
          description: 'Je prépare un voyage de 2 semaines en Italie avec focus sur la gastronomie locale. J\'aimerais des conseils sur les meilleures régions et restaurants authentiques.',
          urgency: 'normal',
          preferredContactMethod: 'video',
          budget: 70,
          sessionDate: '2024-06-20T14:00:00Z',
          duration: 90,
          location: 'Italie',
          experience: 'intermediate',
          createdAt: '2024-06-15T10:30:00Z',
          updatedAt: '2024-06-15T12:15:00Z'
        },
        {
          id: 2,
          menteeId: 'user_demo',
          mentorId: 'mentor_3',
          mentorName: 'Camille Chen',
          mentorAvatar: null,
          status: 'pending',
          requestType: 'advice',
          topic: 'Premier voyage solo en Asie',
          description: 'C\'est mon premier voyage solo et j\'aimerais des conseils de sécurité et d\'organisation pour un voyage de 3 semaines en Thaïlande et Vietnam.',
          urgency: 'normal',
          preferredContactMethod: 'chat',
          budget: null,
          sessionDate: null,
          duration: 60,
          location: 'Thaïlande, Vietnam',
          experience: 'beginner',
          createdAt: '2024-06-16T09:20:00Z',
          updatedAt: '2024-06-16T09:20:00Z'
        }
      ];
      
      res.json(requests);
    } catch (error) {
      console.error('Error fetching mentorship requests:', error);
      res.status(500).json({ message: 'Failed to fetch mentorship requests' });
    }
  });

  // Get user's mentorship sessions
  app.get('/api/mentorship/sessions', async (req, res) => {
    try {
      const sessions = [
        {
          id: 1,
          requestId: 1,
          mentorId: 'mentor_1',
          menteeId: 'user_demo',
          mentorName: 'Sophie Martin',
          menteeName: 'Utilisateur',
          sessionType: 'video',
          status: 'completed',
          startTime: '2024-06-20T14:00:00Z',
          endTime: '2024-06-20T15:30:00Z',
          actualDuration: 90,
          notes: 'Session très productive. Nous avons établi un itinéraire détaillé pour l\'Italie avec focus sur les spécialités régionales. Recommandations de restaurants authentiques partagées.',
          rating: 5,
          createdAt: '2024-06-20T14:00:00Z'
        },
        {
          id: 2,
          requestId: 3,
          mentorId: 'mentor_2',
          menteeId: 'user_demo',
          mentorName: 'Alexandre Dubois',
          menteeName: 'Utilisateur',
          sessionType: 'chat',
          status: 'scheduled',
          startTime: '2024-06-25T10:00:00Z',
          endTime: null,
          actualDuration: null,
          notes: null,
          rating: null,
          createdAt: '2024-06-22T16:30:00Z'
        }
      ];
      
      res.json(sessions);
    } catch (error) {
      console.error('Error fetching mentorship sessions:', error);
      res.status(500).json({ message: 'Failed to fetch mentorship sessions' });
    }
  });

  // Get mentorship programs
  app.get('/api/mentorship/programs', async (req, res) => {
    try {
      const programs = [
        {
          id: 1,
          mentorId: 'mentor_3',
          mentorName: 'Camille Chen',
          mentorAvatar: null,
          title: 'Maîtriser le voyage solo en Asie',
          description: 'Programme complet de 8 semaines pour apprendre à voyager seul(e) en Asie en toute sécurité et avec un budget optimisé.',
          programType: 'beginner',
          duration: 8,
          maxParticipants: 12,
          currentParticipants: 8,
          price: 149,
          rating: 4.8,
          totalGraduates: 47,
          startDate: '2024-07-01T00:00:00Z',
          isActive: true
        },
        {
          id: 2,
          mentorId: 'mentor_2',
          mentorName: 'Alexandre Dubois',
          mentorAvatar: null,
          title: 'Trekking en haute altitude',
          description: 'Formation avancée pour les trekkeurs souhaitant s\'attaquer aux sommets de plus de 4000m. Préparation physique, équipement, sécurité.',
          programType: 'specialized',
          duration: 12,
          maxParticipants: 8,
          currentParticipants: 5,
          price: 299,
          rating: 4.9,
          totalGraduates: 23,
          startDate: '2024-08-15T00:00:00Z',
          isActive: true
        },
        {
          id: 3,
          mentorId: 'mentor_4',
          mentorName: 'Pierre Leclerc',
          mentorAvatar: null,
          title: 'Voyages de luxe en famille',
          description: 'Apprenez à organiser des voyages exceptionnels pour toute la famille, de la sélection des hôtels aux activités adaptées.',
          programType: 'intermediate',
          duration: 6,
          maxParticipants: 10,
          currentParticipants: 3,
          price: 399,
          rating: 4.7,
          totalGraduates: 34,
          startDate: '2024-09-01T00:00:00Z',
          isActive: true
        }
      ];
      
      res.json(programs);
    } catch (error) {
      console.error('Error fetching mentorship programs:', error);
      res.status(500).json({ message: 'Failed to fetch mentorship programs' });
    }
  });

  // Create mentorship request
  app.post('/api/mentorship/requests', async (req, res) => {
    try {
      const requestData = req.body;
      
      const newRequest = {
        id: Math.floor(Math.random() * 1000) + 100,
        menteeId: 'user_demo',
        ...requestData,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      res.json(newRequest);
    } catch (error) {
      console.error('Error creating mentorship request:', error);
      res.status(500).json({ message: 'Failed to create mentorship request' });
    }
  });

  // Apply to become mentor
  app.post('/api/mentors/apply', async (req, res) => {
    try {
      const profileData = req.body;
      
      const newMentorApplication = {
        id: Math.floor(Math.random() * 1000) + 100,
        userId: 'user_demo',
        ...profileData,
        isActive: false, // Pending review
        mentorRating: 0,
        totalMentees: 0,
        responseTime: 24,
        verificationStatus: 'pending',
        badges: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      res.json(newMentorApplication);
    } catch (error) {
      console.error('Error creating mentor application:', error);
      res.status(500).json({ message: 'Failed to create mentor application' });
    }
  });

  // Granular Sharing System API Routes
  
  // Get user's shared items
  app.get('/api/sharing/items', async (req, res) => {
    try {
      const sharedItems = [
        {
          id: 1,
          itemType: 'album',
          itemId: 1,
          ownerId: 'user_demo',
          shareCode: 'alb_demo_2024_001',
          title: 'Voyage en Italie 2024',
          description: 'Mes plus belles photos de voyage en Italie du Nord, incluant Venise, Florence et les Cinque Terre.',
          visibility: 'link',
          isActive: true,
          expiresAt: '2024-12-31T23:59:59Z',
          passwordProtected: false,
          downloadEnabled: true,
          commentsEnabled: true,
          likesEnabled: true,
          viewCount: 142,
          maxViews: 500,
          allowedDomains: [],
          watermarkEnabled: false,
          qualityRestriction: 'high',
          geolocationHidden: false,
          metadataHidden: false,
          createdAt: '2024-06-01T10:00:00Z',
          updatedAt: '2024-06-15T14:30:00Z'
        },
        {
          id: 2,
          itemType: 'photo',
          itemId: 15,
          ownerId: 'user_demo',
          shareCode: 'pht_demo_2024_002',
          title: 'Coucher de soleil à Santorini',
          description: 'Photo exclusive du coucher de soleil depuis Oia, Santorini.',
          visibility: 'public',
          isActive: true,
          expiresAt: null,
          passwordProtected: true,
          downloadEnabled: false,
          commentsEnabled: true,
          likesEnabled: true,
          viewCount: 89,
          maxViews: null,
          allowedDomains: [],
          watermarkEnabled: true,
          qualityRestriction: 'medium',
          geolocationHidden: true,
          metadataHidden: false,
          createdAt: '2024-06-10T16:45:00Z',
          updatedAt: '2024-06-14T09:20:00Z'
        },
        {
          id: 3,
          itemType: 'trip',
          itemId: 3,
          ownerId: 'user_demo',
          shareCode: 'trp_demo_2024_003',
          title: 'Road Trip Californie',
          description: 'Itinéraire complet de notre road trip de 3 semaines en Californie avec photos, conseils et budget détaillé.',
          visibility: 'friends',
          isActive: true,
          expiresAt: null,
          passwordProtected: false,
          downloadEnabled: true,
          commentsEnabled: true,
          likesEnabled: true,
          viewCount: 67,
          maxViews: 200,
          allowedDomains: [],
          watermarkEnabled: false,
          qualityRestriction: 'original',
          geolocationHidden: false,
          metadataHidden: false,
          createdAt: '2024-05-25T12:00:00Z',
          updatedAt: '2024-06-12T18:45:00Z'
        },
        {
          id: 4,
          itemType: 'video',
          itemId: 7,
          ownerId: 'user_demo',
          shareCode: 'vid_demo_2024_004',
          title: 'Timelapse Aurora Boréale',
          description: 'Timelapse exceptionnel des aurores boréales en Islande, filmé pendant 4 heures.',
          visibility: 'custom',
          isActive: true,
          expiresAt: '2024-09-30T23:59:59Z',
          passwordProtected: true,
          downloadEnabled: false,
          commentsEnabled: false,
          likesEnabled: true,
          viewCount: 234,
          maxViews: 1000,
          allowedDomains: ['photography.com', 'naturelove.fr'],
          watermarkEnabled: true,
          qualityRestriction: 'high',
          geolocationHidden: false,
          metadataHidden: true,
          createdAt: '2024-05-15T08:30:00Z',
          updatedAt: '2024-06-13T11:15:00Z'
        },
        {
          id: 5,
          itemType: 'story',
          itemId: 2,
          ownerId: 'user_demo',
          shareCode: 'str_demo_2024_005',
          title: 'Guide du Japon authentique',
          description: 'Guide complet pour découvrir le Japon hors des sentiers battus, avec recommandations locales.',
          visibility: 'private',
          isActive: false,
          expiresAt: null,
          passwordProtected: false,
          downloadEnabled: true,
          commentsEnabled: true,
          likesEnabled: true,
          viewCount: 28,
          maxViews: null,
          allowedDomains: [],
          watermarkEnabled: false,
          qualityRestriction: 'original',
          geolocationHidden: false,
          metadataHidden: false,
          createdAt: '2024-06-05T14:20:00Z',
          updatedAt: '2024-06-11T16:30:00Z'
        }
      ];
      
      res.json(sharedItems);
    } catch (error) {
      console.error('Error fetching shared items:', error);
      res.status(500).json({ message: 'Failed to fetch shared items' });
    }
  });

  // Get permissions for a shared item
  app.get('/api/sharing/permissions/:shareId', async (req, res) => {
    try {
      const shareId = parseInt(req.params.shareId);
      
      const permissions = [
        {
          id: 1,
          shareId: shareId,
          userId: 'user_friend_1',
          email: 'marie.durand@email.com',
          role: 'editor',
          canView: true,
          canDownload: true,
          canComment: true,
          canLike: true,
          canEdit: true,
          canShare: false,
          canDelete: false,
          canManagePermissions: false,
          expiresAt: null,
          isRevoked: false,
          notificationPreferences: {
            onView: false,
            onComment: true,
            onLike: false
          },
          createdAt: '2024-06-10T10:00:00Z',
          updatedAt: '2024-06-10T10:00:00Z'
        },
        {
          id: 2,
          shareId: shareId,
          userId: null,
          email: 'photographe@studio.com',
          role: 'viewer',
          canView: true,
          canDownload: false,
          canComment: false,
          canLike: true,
          canEdit: false,
          canShare: false,
          canDelete: false,
          canManagePermissions: false,
          expiresAt: '2024-08-31T23:59:59Z',
          isRevoked: false,
          notificationPreferences: {
            onView: false,
            onComment: false,
            onLike: false
          },
          createdAt: '2024-06-12T15:30:00Z',
          updatedAt: '2024-06-12T15:30:00Z'
        },
        {
          id: 3,
          shareId: shareId,
          userId: 'user_family_1',
          email: 'papa@famille.com',
          role: 'commenter',
          canView: true,
          canDownload: true,
          canComment: true,
          canLike: true,
          canEdit: false,
          canShare: true,
          canDelete: false,
          canManagePermissions: false,
          expiresAt: null,
          isRevoked: false,
          notificationPreferences: {
            onView: false,
            onComment: true,
            onLike: true
          },
          createdAt: '2024-06-08T09:15:00Z',
          updatedAt: '2024-06-14T12:00:00Z'
        }
      ];
      
      res.json(permissions);
    } catch (error) {
      console.error('Error fetching permissions:', error);
      res.status(500).json({ message: 'Failed to fetch permissions' });
    }
  });

  // Get activity for a shared item
  app.get('/api/sharing/activity/:shareId', async (req, res) => {
    try {
      const shareId = parseInt(req.params.shareId);
      
      const activities = [
        {
          id: 1,
          shareId: shareId,
          userId: 'user_friend_1',
          visitorId: null,
          action: 'view',
          itemType: 'album',
          itemId: 1,
          metadata: { page: 'gallery', photoIndex: 5 },
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          referrer: 'https://wanderlust.com/dashboard',
          location: { country: 'France', city: 'Paris' },
          sessionId: 'sess_abc123',
          duration: 180,
          createdAt: '2024-06-15T14:30:00Z'
        },
        {
          id: 2,
          shareId: shareId,
          userId: null,
          visitorId: 'visitor_xyz789',
          action: 'view',
          itemType: 'album',
          itemId: 1,
          metadata: { page: 'gallery' },
          ipAddress: '185.199.108.153',
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
          referrer: 'https://google.com/search',
          location: { country: 'Belgique', city: 'Bruxelles' },
          sessionId: 'sess_def456',
          duration: 45,
          createdAt: '2024-06-15T13:45:00Z'
        },
        {
          id: 3,
          shareId: shareId,
          userId: 'user_family_1',
          visitorId: null,
          action: 'comment',
          itemType: 'photo',
          itemId: 12,
          metadata: { commentId: 567, text: 'Magnifique photo!' },
          ipAddress: '172.16.0.1',
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
          referrer: 'https://wanderlust.com/shared/alb_demo_2024_001',
          location: { country: 'France', city: 'Lyon' },
          sessionId: 'sess_ghi789',
          duration: 300,
          createdAt: '2024-06-15T12:20:00Z'
        },
        {
          id: 4,
          shareId: shareId,
          userId: 'user_friend_1',
          visitorId: null,
          action: 'like',
          itemType: 'photo',
          itemId: 8,
          metadata: { photoTitle: 'Venise au coucher de soleil' },
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          referrer: 'https://wanderlust.com/shared/alb_demo_2024_001',
          location: { country: 'France', city: 'Paris' },
          sessionId: 'sess_abc123',
          duration: 15,
          createdAt: '2024-06-15T11:55:00Z'
        },
        {
          id: 5,
          shareId: shareId,
          userId: null,
          visitorId: 'visitor_mno012',
          action: 'download',
          itemType: 'photo',
          itemId: 3,
          metadata: { quality: 'high', fileSize: '2.4MB' },
          ipAddress: '151.101.193.140',
          userAgent: 'Mozilla/5.0 (X11; Linux x86_64)',
          referrer: 'https://pinterest.com',
          location: { country: 'Canada', city: 'Toronto' },
          sessionId: 'sess_jkl012',
          duration: 10,
          createdAt: '2024-06-15T10:30:00Z'
        }
      ];
      
      res.json(activities);
    } catch (error) {
      console.error('Error fetching activity:', error);
      res.status(500).json({ message: 'Failed to fetch activity' });
    }
  });

  // Get share templates
  app.get('/api/sharing/templates', async (req, res) => {
    try {
      const templates = [
        {
          id: 1,
          userId: 'user_demo',
          name: 'Partage Famille',
          description: 'Modèle pour partager des photos de famille avec téléchargement autorisé et commentaires activés.',
          templateType: 'photo',
          defaultPermissions: {
            visibility: 'friends',
            downloadEnabled: true,
            commentsEnabled: true,
            likesEnabled: true,
            watermarkEnabled: false,
            qualityRestriction: 'high'
          },
          settings: {
            expiresAt: null,
            passwordProtected: false,
            maxViews: null,
            geolocationHidden: false,
            metadataHidden: false
          },
          isPublic: false,
          usageCount: 12,
          createdAt: '2024-05-20T09:00:00Z',
          updatedAt: '2024-06-10T14:30:00Z'
        },
        {
          id: 2,
          userId: 'user_demo',
          name: 'Portfolio Professionnel',
          description: 'Modèle pour présenter du travail professionnel avec filigrane et restrictions de téléchargement.',
          templateType: 'album',
          defaultPermissions: {
            visibility: 'public',
            downloadEnabled: false,
            commentsEnabled: false,
            likesEnabled: true,
            watermarkEnabled: true,
            qualityRestriction: 'medium'
          },
          settings: {
            expiresAt: null,
            passwordProtected: false,
            maxViews: 1000,
            geolocationHidden: true,
            metadataHidden: true
          },
          isPublic: true,
          usageCount: 8,
          createdAt: '2024-05-15T11:30:00Z',
          updatedAt: '2024-06-08T16:45:00Z'
        },
        {
          id: 3,
          userId: 'user_demo',
          name: 'Voyage Privé',
          description: 'Partage temporaire pour un voyage avec protection par mot de passe et expiration automatique.',
          templateType: 'trip',
          defaultPermissions: {
            visibility: 'link',
            downloadEnabled: true,
            commentsEnabled: true,
            likesEnabled: true,
            watermarkEnabled: false,
            qualityRestriction: 'original'
          },
          settings: {
            expiresAt: '2024-12-31T23:59:59Z',
            passwordProtected: true,
            maxViews: 50,
            geolocationHidden: false,
            metadataHidden: false
          },
          isPublic: false,
          usageCount: 5,
          createdAt: '2024-06-01T13:15:00Z',
          updatedAt: '2024-06-12T10:20:00Z'
        }
      ];
      
      res.json(templates);
    } catch (error) {
      console.error('Error fetching templates:', error);
      res.status(500).json({ message: 'Failed to fetch templates' });
    }
  });

  // Get share links for an item
  app.get('/api/sharing/links/:shareId', async (req, res) => {
    try {
      const shareId = parseInt(req.params.shareId);
      
      const links = [
        {
          id: 1,
          shareId: shareId,
          linkType: 'direct',
          url: `https://wanderlust.app/share/alb_demo_2024_001`,
          shortUrl: 'https://wl.st/Ab1c',
          qrCode: null,
          embedCode: null,
          socialPlatform: null,
          isActive: true,
          clickCount: 45,
          lastClickedAt: '2024-06-15T14:30:00Z',
          customization: null,
          createdAt: '2024-06-01T10:00:00Z'
        },
        {
          id: 2,
          shareId: shareId,
          linkType: 'embed',
          url: `https://wanderlust.app/embed/alb_demo_2024_001`,
          shortUrl: null,
          qrCode: null,
          embedCode: `<iframe src="https://wanderlust.app/embed/alb_demo_2024_001" width="800" height="600" frameborder="0"></iframe>`,
          socialPlatform: null,
          isActive: true,
          clickCount: 12,
          lastClickedAt: '2024-06-14T09:15:00Z',
          customization: {
            width: 800,
            height: 600,
            theme: 'light',
            showControls: true
          },
          createdAt: '2024-06-02T15:30:00Z'
        },
        {
          id: 3,
          shareId: shareId,
          linkType: 'qr',
          url: `https://wanderlust.app/share/alb_demo_2024_001`,
          shortUrl: null,
          qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAA...',
          embedCode: null,
          socialPlatform: null,
          isActive: true,
          clickCount: 8,
          lastClickedAt: '2024-06-13T16:45:00Z',
          customization: {
            size: 200,
            logo: true,
            backgroundColor: '#ffffff',
            foregroundColor: '#000000'
          },
          createdAt: '2024-06-05T11:20:00Z'
        }
      ];
      
      res.json(links);
    } catch (error) {
      console.error('Error fetching share links:', error);
      res.status(500).json({ message: 'Failed to fetch share links' });
    }
  });

  // Create new share
  app.post('/api/sharing/create', async (req, res) => {
    try {
      const shareData = req.body;
      
      const newShare = {
        id: Math.floor(Math.random() * 1000) + 100,
        ownerId: 'user_demo',
        shareCode: `${shareData.itemType.substring(0,3)}_${Date.now()}`,
        ...shareData,
        isActive: true,
        viewCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      res.json(newShare);
    } catch (error) {
      console.error('Error creating share:', error);
      res.status(500).json({ message: 'Failed to create share' });
    }
  });

  // Update permissions for a share
  app.put('/api/sharing/:shareId/permissions', async (req, res) => {
    try {
      const shareId = parseInt(req.params.shareId);
      const permissionsData = req.body;
      
      const updatedPermissions = {
        shareId: shareId,
        ...permissionsData,
        updatedAt: new Date().toISOString()
      };
      
      res.json(updatedPermissions);
    } catch (error) {
      console.error('Error updating permissions:', error);
      res.status(500).json({ message: 'Failed to update permissions' });
    }
  });

  // Generate share link
  app.post('/api/sharing/:shareId/links', async (req, res) => {
    try {
      const shareId = parseInt(req.params.shareId);
      const { linkType } = req.body;
      
      const newLink = {
        id: Math.floor(Math.random() * 1000) + 100,
        shareId: shareId,
        linkType: linkType,
        url: `https://wanderlust.app/share/generated_${Date.now()}`,
        shortUrl: linkType === 'direct' ? `https://wl.st/${Math.random().toString(36).substring(2, 8)}` : null,
        qrCode: linkType === 'qr' ? 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAA...' : null,
        embedCode: linkType === 'embed' ? `<iframe src="https://wanderlust.app/embed/generated_${Date.now()}" width="800" height="600"></iframe>` : null,
        isActive: true,
        clickCount: 0,
        createdAt: new Date().toISOString()
      };
      
      res.json(newLink);
    } catch (error) {
      console.error('Error generating link:', error);
      res.status(500).json({ message: 'Failed to generate link' });
    }
  });

  // Intelligent Anonymization API Routes
  
  // Get privacy policies
  app.get('/api/anonymization/policies', async (req, res) => {
    try {
      const { getDefaultPrivacyPolicies } = await import('./anonymization-service');
      const policies = getDefaultPrivacyPolicies();
      res.json(policies);
    } catch (error) {
      console.error('Error fetching privacy policies:', error);
      res.status(500).json({ message: 'Failed to fetch privacy policies' });
    }
  });

  // Detect persons in image
  app.post('/api/anonymization/detect', async (req, res) => {
    try {
      const { imageUrl } = req.body;
      
      if (!imageUrl) {
        return res.status(400).json({ message: 'Image URL is required' });
      }

      const { detectPersonsInImage } = await import('./anonymization-service');
      const persons = await detectPersonsInImage(imageUrl);
      
      res.json({ persons });
    } catch (error) {
      console.error('Error detecting persons:', error);
      res.status(500).json({ message: 'Failed to detect persons in image' });
    }
  });

  // Analyze privacy risks
  app.post('/api/anonymization/analyze-risks', async (req, res) => {
    try {
      const { imageUrl, detectedPersons } = req.body;
      
      if (!imageUrl || !detectedPersons) {
        return res.status(400).json({ message: 'Image URL and detected persons are required' });
      }

      const { analyzePrivacyRisks } = await import('./anonymization-service');
      const riskAnalysis = await analyzePrivacyRisks(imageUrl, detectedPersons);
      
      res.json(riskAnalysis);
    } catch (error) {
      console.error('Error analyzing privacy risks:', error);
      res.status(500).json({ message: 'Failed to analyze privacy risks' });
    }
  });

  // Apply anonymization
  app.post('/api/anonymization/apply', async (req, res) => {
    try {
      const { imageUrl, detectedPersons, settings } = req.body;
      
      if (!imageUrl || !detectedPersons || !settings) {
        return res.status(400).json({ message: 'Image URL, detected persons, and settings are required' });
      }

      const { applyAnonymization } = await import('./anonymization-service');
      const result = await applyAnonymization(imageUrl, detectedPersons, settings);
      
      res.json(result);
    } catch (error) {
      console.error('Error applying anonymization:', error);
      res.status(500).json({ message: 'Failed to apply anonymization' });
    }
  });

  // Suggest optimal settings
  app.post('/api/anonymization/suggest', async (req, res) => {
    try {
      const { imageUrl, detectedPersons, sharingContext } = req.body;
      
      if (!imageUrl || !detectedPersons || !sharingContext) {
        return res.status(400).json({ message: 'Image URL, detected persons, and sharing context are required' });
      }

      const { suggestOptimalSettings } = await import('./anonymization-service');
      const settings = await suggestOptimalSettings(imageUrl, detectedPersons, sharingContext);
      
      res.json(settings);
    } catch (error) {
      console.error('Error suggesting settings:', error);
      res.status(500).json({ message: 'Failed to suggest optimal settings' });
    }
  });

  // Generate privacy report
  app.post('/api/anonymization/report', async (req, res) => {
    try {
      const { imageUrl, anonymizationResult, privacyPolicy } = req.body;
      
      if (!imageUrl || !anonymizationResult || !privacyPolicy) {
        return res.status(400).json({ message: 'Image URL, anonymization result, and privacy policy are required' });
      }

      const { generatePrivacyReport } = await import('./anonymization-service');
      const report = await generatePrivacyReport(imageUrl, anonymizationResult, privacyPolicy);
      
      res.json(report);
    } catch (error) {
      console.error('Error generating privacy report:', error);
      res.status(500).json({ message: 'Failed to generate privacy report' });
    }
  });

  // Monetization Routes - Subscription Management
  app.get('/api/subscription/plans', async (req, res) => {
    try {
      const plans = [
        {
          id: 1,
          name: 'free',
          displayName: 'Gratuit',
          description: 'Parfait pour commencer votre aventure',
          price: 0,
          yearlyPrice: 0,
          currency: 'EUR',
          features: [
            '5 voyages maximum',
            '50 photos par mois',
            'Albums partagés basiques',
            'Carte interactive',
            'Support communautaire'
          ],
          limits: {
            trips: 5,
            photosPerMonth: 50,
            storageGB: 1,
            aiRequests: 0,
            videoGeneration: 0
          },
          isRecommended: false
        },
        {
          id: 2,
          name: 'explorer',
          displayName: 'Explorateur',
          description: 'Pour les voyageurs passionnés',
          price: 9.99,
          yearlyPrice: 99.90,
          currency: 'EUR',
          features: [
            'Voyages illimités',
            '500 photos par mois',
            'Analyse IA des photos',
            'Génération de vidéos (5/mois)',
            'Albums collaboratifs avancés',
            'Anonymisation intelligente',
            'Support prioritaire'
          ],
          limits: {
            trips: -1,
            photosPerMonth: 500,
            storageGB: 10,
            aiRequests: 100,
            videoGeneration: 5
          },
          isRecommended: true
        },
        {
          id: 3,
          name: 'professional',
          displayName: 'Professionnel',
          description: 'Pour les créateurs de contenu',
          price: 19.99,
          yearlyPrice: 199.90,
          currency: 'EUR',
          features: [
            'Tout de l\'Explorateur',
            'Photos illimitées',
            'Génération IA illimitée',
            'Livres photo automatiques',
            'API marketplace',
            'Analytics avancées',
            'Mentoring premium',
            'Support dédié'
          ],
          limits: {
            trips: -1,
            photosPerMonth: -1,
            storageGB: 100,
            aiRequests: -1,
            videoGeneration: -1
          },
          isRecommended: false
        },
        {
          id: 4,
          name: 'enterprise',
          displayName: 'Entreprise',
          description: 'Pour les équipes et organisations',
          price: 49.99,
          yearlyPrice: 499.90,
          currency: 'EUR',
          features: [
            'Tout du Professionnel',
            'Stockage illimité',
            'Gestion d\'équipe',
            'Branding personnalisé',
            'Intégrations avancées',
            'SLA garanti',
            'Support 24/7'
          ],
          limits: {
            trips: -1,
            photosPerMonth: -1,
            storageGB: -1,
            aiRequests: -1,
            videoGeneration: -1
          },
          isRecommended: false
        }
      ];

      res.json(plans);
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
      res.status(500).json({ message: 'Erreur lors de la récupération des plans' });
    }
  });

  app.get('/api/subscription/current', async (req, res) => {
    try {
      // Simulation d'un abonnement utilisateur
      const currentSubscription = {
        id: 1,
        planId: 1,
        planName: 'free',
        status: 'active',
        currentPeriodStart: new Date('2025-01-01'),
        currentPeriodEnd: new Date('2025-02-01'),
        usage: {
          storageUsed: 250, // MB
          photosUploaded: 23,
          aiRequestsUsed: 0,
          videoGenerations: 0,
          sharedAlbums: 2
        },
        limits: {
          trips: 5,
          photosPerMonth: 50,
          storageGB: 1,
          aiRequests: 0,
          videoGeneration: 0
        }
      };

      res.json(currentSubscription);
    } catch (error) {
      console.error('Error fetching current subscription:', error);
      res.status(500).json({ message: 'Erreur lors de la récupération de l\'abonnement' });
    }
  });

  app.get('/api/marketplace/featured', async (req, res) => {
    try {
      const featuredItems = [
        {
          id: 1,
          title: 'Guide Complet Tokyo 2025',
          description: 'Guide détaillé avec itinéraires, restaurants et conseils locaux',
          price: 12.99,
          currency: 'EUR',
          category: 'guide',
          rating: 4.8,
          totalSales: 234,
          thumbnailUrl: '/api/placeholder/300/200',
          seller: {
            name: 'Marie Dubois',
            verified: true,
            rating: 4.9
          }
        },
        {
          id: 2,
          title: 'Vidéo de Voyage - Bali Paradise',
          description: 'Montage professionnel de 10 minutes avec musique originale',
          price: 8.99,
          currency: 'EUR',
          category: 'video',
          rating: 4.9,
          totalSales: 156,
          thumbnailUrl: '/api/placeholder/300/200',
          seller: {
            name: 'Alex Travel',
            verified: true,
            rating: 4.7
          }
        },
        {
          id: 3,
          title: 'Livre Photo - Roadtrip USA',
          description: 'Format A4, 50 pages, reliure premium',
          price: 24.99,
          currency: 'EUR',
          category: 'photo_book',
          rating: 4.6,
          totalSales: 89,
          thumbnailUrl: '/api/placeholder/300/200',
          seller: {
            name: 'Adventure Studio',
            verified: true,
            rating: 4.8
          }
        }
      ];

      res.json(featuredItems);
    } catch (error) {
      console.error('Error fetching marketplace items:', error);
      res.status(500).json({ message: 'Erreur lors de la récupération des articles' });
    }
  });

  app.get('/api/affiliate/dashboard', async (req, res) => {
    try {
      const affiliateData = {
        affiliateId: 'WL-AFF-123456',
        status: 'active',
        commissionRate: 20,
        totalEarnings: 245.80,
        pendingEarnings: 89.50,
        paidEarnings: 156.30,
        referralCode: 'MARIE2025',
        totalReferrals: 12,
        activeReferrals: 8,
        stats: {
          thisMonth: {
            referrals: 3,
            earnings: 45.60,
            conversions: 2
          },
          lastMonth: {
            referrals: 5,
            earnings: 67.80,
            conversions: 4
          }
        },
        recentReferrals: [
          {
            id: 1,
            referredUser: 'user***@gmail.com',
            status: 'converted',
            commission: 19.98,
            date: new Date('2025-06-10')
          },
          {
            id: 2,
            referredUser: 'travel***@yahoo.fr',
            status: 'pending',
            commission: 0,
            date: new Date('2025-06-12')
          }
        ]
      };

      res.json(affiliateData);
    } catch (error) {
      console.error('Error fetching affiliate dashboard:', error);
      res.status(500).json({ message: 'Erreur lors de la récupération du tableau de bord' });
    }
  });

  app.post('/api/promotion/apply', async (req, res) => {
    try {
      const { code, planId } = req.body;
      
      // Simulation de codes promo
      const validCodes = {
        'WELCOME25': {
          type: 'percentage',
          value: 25,
          maxDiscount: 10,
          description: '25% de réduction sur votre premier abonnement'
        },
        'SUMMER2025': {
          type: 'fixed_amount',
          value: 5,
          description: '5€ de réduction'
        },
        'FREETRIAL': {
          type: 'free_trial',
          value: 30,
          description: '30 jours d\'essai gratuit'
        }
      };

      const promotion = (validCodes as any)[code.toUpperCase()];
      
      if (!promotion) {
        return res.status(400).json({ 
          message: 'Code promo invalide ou expiré' 
        });
      }

      res.json({
        valid: true,
        promotion: {
          code: code.toUpperCase(),
          ...promotion
        },
        message: 'Code promo appliqué avec succès!'
      });
    } catch (error) {
      console.error('Error applying promotion:', error);
      res.status(500).json({ message: 'Erreur lors de l\'application du code promo' });
    }
  });

  app.get('/api/revenue/analytics', async (req, res) => {
    try {
      const revenueData = {
        totalRevenue: 15420.50,
        monthlyRevenue: 2840.30,
        subscriptions: {
          active: 1250,
          growth: 12.5,
          churn: 3.2
        },
        marketplace: {
          totalSales: 892,
          commission: 1890.45,
          topCategories: [
            { name: 'Guides', revenue: 890.20, sales: 234 },
            { name: 'Vidéos', revenue: 654.80, sales: 189 },
            { name: 'Livres Photo', revenue: 345.45, sales: 67 }
          ]
        },
        affiliate: {
          totalCommissions: 2340.80,
          activeAffiliates: 89,
          conversionRate: 4.2
        },
        monthlyData: [
          { month: 'Jan', revenue: 12800, subscriptions: 1180, marketplace: 420 },
          { month: 'Fév', revenue: 13600, subscriptions: 1210, marketplace: 480 },
          { month: 'Mar', revenue: 14200, subscriptions: 1190, marketplace: 520 },
          { month: 'Avr', revenue: 13800, subscriptions: 1220, marketplace: 450 },
          { month: 'Mai', revenue: 15100, subscriptions: 1240, marketplace: 580 },
          { month: 'Jun', revenue: 15420, subscriptions: 1250, marketplace: 620 }
        ]
      };

      res.json(revenueData);
    } catch (error) {
      console.error('Error fetching revenue analytics:', error);
      res.status(500).json({ message: 'Erreur lors de la récupération des analytics' });
    }
  });

  // Add missing endpoints that were returning HTML instead of JSON

  // Groups API endpoints
  app.get('/api/groups', async (req, res) => {
    try {
      const groups = [
        {
          id: 1,
          name: "Aventuriers Tokyo",
          description: "Groupe d'explorateurs urbains passionnés par Tokyo",
          coverImage: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800",
          memberCount: 12,
          tripCount: 8,
          isPrivate: false,
          createdAt: "2024-05-15T10:00:00Z",
          updatedAt: "2024-06-10T14:30:00Z",
          role: "admin",
          lastActivity: "2024-06-15T09:20:00Z"
        },
        {
          id: 2,
          name: "Photographes Voyage",
          description: "Communauté de photographes de voyage",
          coverImage: "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800",
          memberCount: 25,
          tripCount: 15,
          isPrivate: true,
          createdAt: "2024-04-20T16:45:00Z",
          updatedAt: "2024-06-12T11:15:00Z",
          role: "member",
          lastActivity: "2024-06-14T18:40:00Z"
        }
      ];
      res.json(groups);
    } catch (error) {
      console.error('Error fetching groups:', error);
      res.status(500).json({ message: 'Failed to fetch groups' });
    }
  });

  // Comments API endpoints
  app.get('/api/comments/photo/:photoId', async (req, res) => {
    try {
      const photoId = parseInt(req.params.photoId);
      const comments = [
        {
          id: 1,
          photoId: photoId,
          contributorName: "Marie Dupont",
          contributorAvatar: "https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=100",
          content: "Magnifique photo ! Les couleurs sont superbes.",
          createdAt: "2024-06-14T10:30:00Z",
          replies: []
        },
        {
          id: 2,
          photoId: photoId,
          contributorName: "Jean Martin",
          contributorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100",
          content: "J'adore cette perspective, très créatif !",
          createdAt: "2024-06-14T15:45:00Z",
          replies: [
            {
              id: 3,
              contributorName: "Sophie Moreau",
              contributorAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100",
              content: "Je suis d'accord, excellent travail !",
              createdAt: "2024-06-14T16:00:00Z"
            }
          ]
        }
      ];
      res.json(comments);
    } catch (error) {
      console.error('Error fetching comments:', error);
      res.status(500).json({ message: 'Failed to fetch comments' });
    }
  });

  // Maps API endpoints
  app.get('/api/maps/photos', async (req, res) => {
    try {
      const photosWithGPS = [
        {
          id: 1,
          latitude: 35.6762,
          longitude: 139.6503,
          title: "Tokyo Tower",
          thumbnail: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=200",
          date: "2024-06-10T14:30:00Z"
        },
        {
          id: 2,
          latitude: 35.0116,
          longitude: 135.7681,
          title: "Fushimi Inari",
          thumbnail: "https://images.unsplash.com/photo-1478436127897-769e1b3f0f36?w=200",
          date: "2024-06-11T09:15:00Z"
        }
      ];
      res.json(photosWithGPS);
    } catch (error) {
      console.error('Error fetching map photos:', error);
      res.status(500).json({ message: 'Failed to fetch map photos' });
    }
  });

  // Marketplace API endpoints
  app.get('/api/marketplace/products', async (req, res) => {
    try {
      const products = [
        {
          id: 1,
          title: "Guide Complet Tokyo",
          description: "Guide détaillé avec conseils d'initiés",
          price: 15.99,
          currency: "EUR",
          category: "guide",
          thumbnail: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=300",
          rating: 4.8,
          sales: 234,
          authorName: "Marie Explorateur",
          authorAvatar: "https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=100"
        },
        {
          id: 2,
          title: "Vidéo Japon Cinématique",
          description: "Collection de vidéos HD du Japon",
          price: 25.00,
          currency: "EUR",
          category: "video",
          thumbnail: "https://images.unsplash.com/photo-1478436127897-769e1b3f0f36?w=300",
          rating: 4.9,
          sales: 156,
          authorName: "Jean Vidéaste",
          authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100"
        }
      ];
      res.json(products);
    } catch (error) {
      console.error('Error fetching marketplace products:', error);
      res.status(500).json({ message: 'Failed to fetch marketplace products' });
    }
  });

  // Affiliate stats API endpoints
  app.get('/api/affiliate/stats', async (req, res) => {
    try {
      const affiliateStats = {
        totalCommissions: 890.45,
        monthlyCommissions: 145.30,
        clicks: 1250,
        conversions: 42,
        conversionRate: 3.36,
        pendingCommissions: 78.20,
        paidCommissions: 812.25,
        topProducts: [
          { id: 1, name: "Guide Tokyo", commissions: 245.80, conversions: 18 },
          { id: 2, name: "Vidéo Japon", commissions: 189.30, conversions: 12 }
        ]
      };
      res.json(affiliateStats);
    } catch (error) {
      console.error('Error fetching affiliate stats:', error);
      res.status(500).json({ message: 'Failed to fetch affiliate stats' });
    }
  });

  // Analytics trends API endpoints
  app.get('/api/analytics/trends', async (req, res) => {
    try {
      const trends = {
        photoUploadTrend: [
          { date: "2024-06-01", count: 25 },
          { date: "2024-06-08", count: 42 },
          { date: "2024-06-15", count: 38 }
        ],
        tripCreationTrend: [
          { date: "2024-06-01", count: 3 },
          { date: "2024-06-08", count: 5 },
          { date: "2024-06-15", count: 4 }
        ],
        popularDestinations: [
          { destination: "Tokyo", visits: 156 },
          { destination: "Kyoto", visits: 134 },
          { destination: "Osaka", visits: 98 }
        ],
        seasonalTrends: {
          spring: 22,
          summer: 45,
          autumn: 28,
          winter: 15
        }
      };
      res.json(trends);
    } catch (error) {
      console.error('Error fetching analytics trends:', error);
      res.status(500).json({ message: 'Failed to fetch analytics trends' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
