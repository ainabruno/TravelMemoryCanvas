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
