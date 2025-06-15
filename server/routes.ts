import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTripSchema, insertAlbumSchema, insertPhotoSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";

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

  // Comments routes
  app.get("/api/photos/:id/comments", async (req, res) => {
    try {
      const photoId = parseInt(req.params.id);
      const comments = await storage.getPhotoComments(photoId);
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
      res.status(201).json(comment);
    } catch (error) {
      res.status(400).json({ message: "Failed to create comment", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Reactions routes
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
      const reactionData = {
        photoId,
        contributorName: req.body.contributorName,
        contributorEmail: req.body.contributorEmail,
        reaction: req.body.reaction,
      };
      
      const reaction = await storage.createPhotoReaction(reactionData);
      res.status(201).json(reaction);
    } catch (error) {
      res.status(400).json({ message: "Failed to create reaction", error: error instanceof Error ? error.message : "Unknown error" });
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
