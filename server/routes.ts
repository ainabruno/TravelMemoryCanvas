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
      imageUrl: '/api/placeholder/kyoto.jpg',
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
      imageUrl: '/api/placeholder/reykjavik.jpg',
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
      imageUrl: '/api/placeholder/marrakech.jpg',
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
      imageUrl: '/api/placeholder/queenstown.jpg',
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
      imageUrl: '/api/placeholder/santorini.jpg',
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
      imageUrl: '/api/placeholder/banff.jpg',
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
  suggestions.sort((a, b) => b.matchScore - a.matchScore);
  
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
      const tripData = insertTripSchema.parse(req.body);
      const trip = await storage.createTrip(tripData);
      res.status(201).json(trip);
    } catch (error) {
      res.status(400).json({ message: "Invalid trip data", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.put("/api/trips/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const tripData = insertTripSchema.partial().parse(req.body);
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

  const httpServer = createServer(app);
  return httpServer;
}
