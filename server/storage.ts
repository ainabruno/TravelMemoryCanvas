import { trips, albums, photos, albumContributors, photoComments, albumActivity, photoReactions, collaborationSessions, userProfiles, userStats, userAchievements, userFollows, type Trip, type Album, type Photo, type AlbumContributor, type PhotoComment, type AlbumActivity, type PhotoReaction, type CollaborationSession, type UserProfile, type UserStats, type UserAchievement, type UserFollow, type InsertTrip, type InsertAlbum, type InsertPhoto, type InsertAlbumContributor, type InsertPhotoComment, type InsertAlbumActivity, type InsertPhotoReaction, type InsertCollaborationSession, type InsertUserProfile, type InsertUserStats, type InsertUserAchievement, type InsertUserFollow } from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";

export interface IStorage {
  // Trip operations
  getTrips(): Promise<Trip[]>;
  getTrip(id: number): Promise<Trip | undefined>;
  createTrip(trip: InsertTrip): Promise<Trip>;
  updateTrip(id: number, trip: Partial<InsertTrip>): Promise<Trip | undefined>;
  deleteTrip(id: number): Promise<boolean>;

  // Album operations
  getAlbums(): Promise<Album[]>;
  getAlbum(id: number): Promise<Album | undefined>;
  getAlbumsByTrip(tripId: number): Promise<Album[]>;
  createAlbum(album: InsertAlbum): Promise<Album>;
  updateAlbum(id: number, album: Partial<InsertAlbum>): Promise<Album | undefined>;
  deleteAlbum(id: number): Promise<boolean>;
  
  // Shared album operations
  getSharedAlbum(shareCode: string): Promise<Album | undefined>;
  createSharedAlbum(album: InsertAlbum): Promise<Album & { shareCode: string }>;
  addContributor(albumId: number, contributor: InsertAlbumContributor): Promise<AlbumContributor>;
  getContributors(albumId: number): Promise<AlbumContributor[]>;
  removeContributor(albumId: number, contributorId: number): Promise<boolean>;
  updateContributorPermissions(contributorId: number, permissions: Partial<InsertAlbumContributor>): Promise<AlbumContributor | undefined>;

  // Photo operations
  getPhotos(): Promise<Photo[]>;
  getPhoto(id: number): Promise<Photo | undefined>;
  getPhotosByTrip(tripId: number): Promise<Photo[]>;
  getPhotosByAlbum(albumId: number): Promise<Photo[]>;
  createPhoto(photo: InsertPhoto): Promise<Photo>;
  updatePhoto(id: number, photo: Partial<InsertPhoto>): Promise<Photo | undefined>;
  deletePhoto(id: number): Promise<boolean>;

  // Comments operations
  getPhotoComments(photoId: number): Promise<PhotoComment[]>;
  createPhotoComment(comment: InsertPhotoComment): Promise<PhotoComment>;
  deletePhotoComment(id: number): Promise<boolean>;

  // Reactions operations
  getPhotoReactions(photoId: number): Promise<PhotoReaction[]>;
  createPhotoReaction(reaction: InsertPhotoReaction): Promise<PhotoReaction>;
  deletePhotoReaction(photoId: number, contributorName: string, reaction: string): Promise<boolean>;

  // Activity operations
  getAlbumActivity(albumId: number): Promise<AlbumActivity[]>;
  createAlbumActivity(activity: InsertAlbumActivity): Promise<AlbumActivity>;

  // Collaboration sessions
  getActiveCollaborators(albumId: number): Promise<CollaborationSession[]>;
  createCollaborationSession(session: InsertCollaborationSession): Promise<CollaborationSession>;
  updateSessionActivity(sessionId: string): Promise<boolean>;
  endCollaborationSession(sessionId: string): Promise<boolean>;

  // User profile operations
  getUserProfile(userId: string): Promise<UserProfile | undefined>;
  createUserProfile(profile: InsertUserProfile): Promise<UserProfile>;
  updateUserProfile(userId: string, profile: Partial<InsertUserProfile>): Promise<UserProfile | undefined>;
  getUserStats(userId: string): Promise<UserStats | undefined>;
  updateUserStats(userId: string, stats: Partial<InsertUserStats>): Promise<UserStats | undefined>;
  getUserAchievements(userId: string): Promise<UserAchievement[]>;
  createUserAchievement(achievement: InsertUserAchievement): Promise<UserAchievement>;
  updateUserAchievement(id: number, achievement: Partial<InsertUserAchievement>): Promise<UserAchievement | undefined>;
  followUser(followerId: string, followingId: string): Promise<UserFollow>;
  unfollowUser(followerId: string, followingId: string): Promise<boolean>;
  getUserFollowers(userId: string): Promise<UserFollow[]>;
  getUserFollowing(userId: string): Promise<UserFollow[]>;

  // Stats
  getStats(): Promise<{
    totalTrips: number;
    totalPhotos: number;
    totalCountries: number;
    sharedPosts: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getTrips(): Promise<Trip[]> {
    return await db.select().from(trips).orderBy(trips.startDate);
  }

  async getTrip(id: number): Promise<Trip | undefined> {
    const [trip] = await db.select().from(trips).where(eq(trips.id, id));
    return trip || undefined;
  }

  async createTrip(trip: InsertTrip): Promise<Trip> {
    const [newTrip] = await db
      .insert(trips)
      .values(trip)
      .returning();
    return newTrip;
  }

  async updateTrip(id: number, trip: Partial<InsertTrip>): Promise<Trip | undefined> {
    const [updatedTrip] = await db
      .update(trips)
      .set(trip)
      .where(eq(trips.id, id))
      .returning();
    return updatedTrip || undefined;
  }

  async deleteTrip(id: number): Promise<boolean> {
    const result = await db.delete(trips).where(eq(trips.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getAlbums(): Promise<Album[]> {
    return await db.select().from(albums);
  }

  async getAlbum(id: number): Promise<Album | undefined> {
    const [album] = await db.select().from(albums).where(eq(albums.id, id));
    return album || undefined;
  }

  async getAlbumsByTrip(tripId: number): Promise<Album[]> {
    return await db.select().from(albums).where(eq(albums.tripId, tripId));
  }

  async createAlbum(album: InsertAlbum): Promise<Album> {
    const [newAlbum] = await db
      .insert(albums)
      .values(album)
      .returning();
    return newAlbum;
  }

  async updateAlbum(id: number, album: Partial<InsertAlbum>): Promise<Album | undefined> {
    const [updatedAlbum] = await db
      .update(albums)
      .set(album)
      .where(eq(albums.id, id))
      .returning();
    return updatedAlbum || undefined;
  }

  async deleteAlbum(id: number): Promise<boolean> {
    const result = await db.delete(albums).where(eq(albums.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Shared album operations
  async getSharedAlbum(shareCode: string): Promise<Album | undefined> {
    const [album] = await db.select().from(albums).where(eq(albums.shareCode, shareCode));
    return album || undefined;
  }

  async createSharedAlbum(album: InsertAlbum): Promise<Album & { shareCode: string }> {
    // Generate unique share code
    const shareCode = this.generateShareCode();
    const sharedAlbumData = {
      ...album,
      isShared: true,
      shareCode,
    };

    const [newAlbum] = await db
      .insert(albums)
      .values(sharedAlbumData)
      .returning();
    
    return { ...newAlbum, shareCode };
  }

  async addContributor(albumId: number, contributor: InsertAlbumContributor): Promise<AlbumContributor> {
    const [newContributor] = await db
      .insert(albumContributors)
      .values({ ...contributor, albumId })
      .returning();
    return newContributor;
  }

  async getContributors(albumId: number): Promise<AlbumContributor[]> {
    return await db.select().from(albumContributors).where(eq(albumContributors.albumId, albumId));
  }

  async removeContributor(albumId: number, contributorId: number): Promise<boolean> {
    const result = await db
      .delete(albumContributors)
      .where(eq(albumContributors.id, contributorId));
    return (result.rowCount ?? 0) > 0;
  }

  async updateContributorPermissions(contributorId: number, permissions: Partial<InsertAlbumContributor>): Promise<AlbumContributor | undefined> {
    const [updatedContributor] = await db
      .update(albumContributors)
      .set(permissions)
      .where(eq(albumContributors.id, contributorId))
      .returning();
    return updatedContributor || undefined;
  }

  private generateShareCode(): string {
    // Generate a unique 8-character alphanumeric code
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  async getPhotos(): Promise<Photo[]> {
    return await db.select().from(photos).orderBy(photos.uploadedAt);
  }

  async getPhoto(id: number): Promise<Photo | undefined> {
    const [photo] = await db.select().from(photos).where(eq(photos.id, id));
    return photo || undefined;
  }

  async getPhotosByTrip(tripId: number): Promise<Photo[]> {
    return await db.select().from(photos).where(eq(photos.tripId, tripId)).orderBy(photos.uploadedAt);
  }

  async getPhotosByAlbum(albumId: number): Promise<Photo[]> {
    return await db.select().from(photos).where(eq(photos.albumId, albumId)).orderBy(photos.uploadedAt);
  }

  async createPhoto(photo: InsertPhoto): Promise<Photo> {
    const [newPhoto] = await db
      .insert(photos)
      .values(photo)
      .returning();
    return newPhoto;
  }

  async updatePhoto(id: number, photo: Partial<InsertPhoto>): Promise<Photo | undefined> {
    const [updatedPhoto] = await db
      .update(photos)
      .set(photo)
      .where(eq(photos.id, id))
      .returning();
    return updatedPhoto || undefined;
  }

  async deletePhoto(id: number): Promise<boolean> {
    const result = await db.delete(photos).where(eq(photos.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Comments operations
  async getPhotoComments(photoId: number): Promise<PhotoComment[]> {
    return await db.select().from(photoComments)
      .where(eq(photoComments.photoId, photoId))
      .orderBy(photoComments.createdAt);
  }

  async createPhotoComment(comment: InsertPhotoComment): Promise<PhotoComment> {
    const [newComment] = await db.insert(photoComments).values(comment).returning();
    return newComment;
  }

  async deletePhotoComment(id: number): Promise<boolean> {
    const result = await db.delete(photoComments).where(eq(photoComments.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Reactions operations
  async getPhotoReactions(photoId: number): Promise<PhotoReaction[]> {
    return await db.select().from(photoReactions)
      .where(eq(photoReactions.photoId, photoId))
      .orderBy(photoReactions.createdAt);
  }

  async createPhotoReaction(reaction: InsertPhotoReaction): Promise<PhotoReaction> {
    // Remove existing reaction from this user for this photo
    await db.delete(photoReactions)
      .where(
        and(
          eq(photoReactions.photoId, reaction.photoId),
          eq(photoReactions.contributorName, reaction.contributorName)
        )
      );

    const [newReaction] = await db.insert(photoReactions).values(reaction).returning();
    return newReaction;
  }

  async deletePhotoReaction(photoId: number, contributorName: string, reaction: string): Promise<boolean> {
    const result = await db.delete(photoReactions)
      .where(
        and(
          eq(photoReactions.photoId, photoId),
          eq(photoReactions.contributorName, contributorName),
          eq(photoReactions.reaction, reaction)
        )
      );
    return (result.rowCount ?? 0) > 0;
  }

  // Activity operations
  async getAlbumActivity(albumId: number): Promise<AlbumActivity[]> {
    return await db.select().from(albumActivity)
      .where(eq(albumActivity.albumId, albumId))
      .orderBy(albumActivity.createdAt)
      .limit(50);
  }

  async createAlbumActivity(activity: InsertAlbumActivity): Promise<AlbumActivity> {
    const [newActivity] = await db.insert(albumActivity).values(activity).returning();
    return newActivity;
  }

  // Collaboration sessions
  async getActiveCollaborators(albumId: number): Promise<CollaborationSession[]> {
    return await db.select().from(collaborationSessions)
      .where(
        and(
          eq(collaborationSessions.albumId, albumId),
          eq(collaborationSessions.isActive, true)
        )
      );
  }

  async createCollaborationSession(session: InsertCollaborationSession): Promise<CollaborationSession> {
    const [newSession] = await db.insert(collaborationSessions).values(session).returning();
    return newSession;
  }

  async updateSessionActivity(sessionId: string): Promise<boolean> {
    const result = await db.update(collaborationSessions)
      .set({ lastActivity: new Date() })
      .where(eq(collaborationSessions.sessionId, sessionId));
    return (result.rowCount ?? 0) > 0;
  }

  async endCollaborationSession(sessionId: string): Promise<boolean> {
    const result = await db.update(collaborationSessions)
      .set({ isActive: false })
      .where(eq(collaborationSessions.sessionId, sessionId));
    return (result.rowCount ?? 0) > 0;
  }

  // User profile operations
  async getUserProfile(userId: string): Promise<UserProfile | undefined> {
    const [profile] = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId));
    return profile || undefined;
  }

  async createUserProfile(profile: InsertUserProfile): Promise<UserProfile> {
    const [newProfile] = await db.insert(userProfiles).values(profile).returning();
    
    // Create initial user stats
    await db.insert(userStats).values({
      userId: profile.userId,
      totalPhotos: 0,
      totalTrips: 0,
      totalAlbums: 0,
      totalCountries: 0,
      totalLikes: 0,
      totalComments: 0,
      totalShares: 0,
      featuredPhotos: 0,
    });

    return newProfile;
  }

  async updateUserProfile(userId: string, profile: Partial<InsertUserProfile>): Promise<UserProfile | undefined> {
    const [updatedProfile] = await db
      .update(userProfiles)
      .set({ ...profile, updatedAt: new Date() })
      .where(eq(userProfiles.userId, userId))
      .returning();
    return updatedProfile || undefined;
  }

  async getUserStats(userId: string): Promise<UserStats | undefined> {
    const [stats] = await db.select().from(userStats).where(eq(userStats.userId, userId));
    return stats || undefined;
  }

  async updateUserStats(userId: string, stats: Partial<InsertUserStats>): Promise<UserStats | undefined> {
    const [updatedStats] = await db
      .update(userStats)
      .set({ ...stats, updatedAt: new Date() })
      .where(eq(userStats.userId, userId))
      .returning();
    return updatedStats || undefined;
  }

  async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    return await db.select().from(userAchievements)
      .where(eq(userAchievements.userId, userId))
      .orderBy(userAchievements.createdAt);
  }

  async createUserAchievement(achievement: InsertUserAchievement): Promise<UserAchievement> {
    const [newAchievement] = await db.insert(userAchievements).values(achievement).returning();
    return newAchievement;
  }

  async updateUserAchievement(id: number, achievement: Partial<InsertUserAchievement>): Promise<UserAchievement | undefined> {
    const [updatedAchievement] = await db
      .update(userAchievements)
      .set(achievement)
      .where(eq(userAchievements.id, id))
      .returning();
    return updatedAchievement || undefined;
  }

  async followUser(followerId: string, followingId: string): Promise<UserFollow> {
    const [follow] = await db.insert(userFollows).values({
      followerId,
      followingId,
    }).returning();
    return follow;
  }

  async unfollowUser(followerId: string, followingId: string): Promise<boolean> {
    const result = await db.delete(userFollows)
      .where(
        and(
          eq(userFollows.followerId, followerId),
          eq(userFollows.followingId, followingId)
        )
      );
    return (result.rowCount ?? 0) > 0;
  }

  async getUserFollowers(userId: string): Promise<UserFollow[]> {
    return await db.select().from(userFollows)
      .where(eq(userFollows.followingId, userId))
      .orderBy(userFollows.createdAt);
  }

  async getUserFollowing(userId: string): Promise<UserFollow[]> {
    return await db.select().from(userFollows)
      .where(eq(userFollows.followerId, userId))
      .orderBy(userFollows.createdAt);
  }

  async getStats(): Promise<{
    totalTrips: number;
    totalPhotos: number;
    totalCountries: number;
    sharedPosts: number;
  }> {
    const allTrips = await db.select().from(trips);
    const allPhotos = await db.select().from(photos);
    const sharedAlbums = await db.select().from(albums).where(eq(albums.isShared, true));
    const countries = new Set(allTrips.map(trip => trip.location)).size;
    
    return {
      totalTrips: allTrips.length,
      totalPhotos: allPhotos.length,
      totalCountries: countries,
      sharedPosts: sharedAlbums.length,
    };
  }
}

export const storage = new DatabaseStorage();
