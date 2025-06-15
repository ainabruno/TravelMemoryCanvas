import { trips, albums, photos, type Trip, type Album, type Photo, type InsertTrip, type InsertAlbum, type InsertPhoto } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

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

  // Photo operations
  getPhotos(): Promise<Photo[]>;
  getPhoto(id: number): Promise<Photo | undefined>;
  getPhotosByTrip(tripId: number): Promise<Photo[]>;
  getPhotosByAlbum(albumId: number): Promise<Photo[]>;
  createPhoto(photo: InsertPhoto): Promise<Photo>;
  updatePhoto(id: number, photo: Partial<InsertPhoto>): Promise<Photo | undefined>;
  deletePhoto(id: number): Promise<boolean>;

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
    return result.rowCount > 0;
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
    return result.rowCount > 0;
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
    return result.rowCount > 0;
  }

  async getStats(): Promise<{
    totalTrips: number;
    totalPhotos: number;
    totalCountries: number;
    sharedPosts: number;
  }> {
    const allTrips = await db.select().from(trips);
    const allPhotos = await db.select().from(photos);
    const countries = new Set(allTrips.map(trip => trip.location)).size;
    
    return {
      totalTrips: allTrips.length,
      totalPhotos: allPhotos.length,
      totalCountries: countries,
      sharedPosts: Math.floor(allPhotos.length * 0.3), // Mock shared posts
    };
  }
}

export const storage = new DatabaseStorage();
