import { trips, albums, photos, type Trip, type Album, type Photo, type InsertTrip, type InsertAlbum, type InsertPhoto } from "@shared/schema";

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

export class MemStorage implements IStorage {
  private trips: Map<number, Trip> = new Map();
  private albums: Map<number, Album> = new Map();
  private photos: Map<number, Photo> = new Map();
  private currentTripId = 1;
  private currentAlbumId = 1;
  private currentPhotoId = 1;

  constructor() {
    // Initialize with some sample data
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Sample trips
    const trip1: Trip = {
      id: this.currentTripId++,
      title: "Swiss Alps Adventure",
      description: "7 days exploring the magnificent Swiss Alps with breathtaking mountain views",
      location: "Switzerland",
      startDate: new Date("2023-12-01"),
      endDate: new Date("2023-12-08"),
      coverPhotoUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
    };

    const trip2: Trip = {
      id: this.currentTripId++,
      title: "Bali Paradise",
      description: "10 days in tropical paradise with beaches, temples, and amazing culture",
      location: "Indonesia",
      startDate: new Date("2023-11-15"),
      endDate: new Date("2023-11-25"),
      coverPhotoUrl: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
    };

    const trip3: Trip = {
      id: this.currentTripId++,
      title: "Japan Discovery",
      description: "Cultural immersion through Tokyo, Kyoto, and rural Japan",
      location: "Japan",
      startDate: new Date("2023-10-01"),
      endDate: new Date("2023-10-14"),
      coverPhotoUrl: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
    };

    this.trips.set(trip1.id, trip1);
    this.trips.set(trip2.id, trip2);
    this.trips.set(trip3.id, trip3);

    // Sample albums
    const album1: Album = {
      id: this.currentAlbumId++,
      title: "Adventure Essentials",
      description: "Gear and moments",
      coverPhotoUrl: "https://images.unsplash.com/photo-1551632811-561732d1e306?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
      tripId: trip1.id,
    };

    const album2: Album = {
      id: this.currentAlbumId++,
      title: "Travel Memories",
      description: "Best moments",
      coverPhotoUrl: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
      tripId: null,
    };

    this.albums.set(album1.id, album1);
    this.albums.set(album2.id, album2);
  }

  // Trip operations
  async getTrips(): Promise<Trip[]> {
    return Array.from(this.trips.values()).sort((a, b) => b.startDate.getTime() - a.startDate.getTime());
  }

  async getTrip(id: number): Promise<Trip | undefined> {
    return this.trips.get(id);
  }

  async createTrip(trip: InsertTrip): Promise<Trip> {
    const newTrip: Trip = {
      ...trip,
      id: this.currentTripId++,
    };
    this.trips.set(newTrip.id, newTrip);
    return newTrip;
  }

  async updateTrip(id: number, trip: Partial<InsertTrip>): Promise<Trip | undefined> {
    const existing = this.trips.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...trip };
    this.trips.set(id, updated);
    return updated;
  }

  async deleteTrip(id: number): Promise<boolean> {
    return this.trips.delete(id);
  }

  // Album operations
  async getAlbums(): Promise<Album[]> {
    return Array.from(this.albums.values());
  }

  async getAlbum(id: number): Promise<Album | undefined> {
    return this.albums.get(id);
  }

  async getAlbumsByTrip(tripId: number): Promise<Album[]> {
    return Array.from(this.albums.values()).filter(album => album.tripId === tripId);
  }

  async createAlbum(album: InsertAlbum): Promise<Album> {
    const newAlbum: Album = {
      ...album,
      id: this.currentAlbumId++,
    };
    this.albums.set(newAlbum.id, newAlbum);
    return newAlbum;
  }

  async updateAlbum(id: number, album: Partial<InsertAlbum>): Promise<Album | undefined> {
    const existing = this.albums.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...album };
    this.albums.set(id, updated);
    return updated;
  }

  async deleteAlbum(id: number): Promise<boolean> {
    return this.albums.delete(id);
  }

  // Photo operations
  async getPhotos(): Promise<Photo[]> {
    return Array.from(this.photos.values()).sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
  }

  async getPhoto(id: number): Promise<Photo | undefined> {
    return this.photos.get(id);
  }

  async getPhotosByTrip(tripId: number): Promise<Photo[]> {
    return Array.from(this.photos.values())
      .filter(photo => photo.tripId === tripId)
      .sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
  }

  async getPhotosByAlbum(albumId: number): Promise<Photo[]> {
    return Array.from(this.photos.values())
      .filter(photo => photo.albumId === albumId)
      .sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
  }

  async createPhoto(photo: InsertPhoto): Promise<Photo> {
    const newPhoto: Photo = {
      ...photo,
      id: this.currentPhotoId++,
      uploadedAt: new Date(),
    };
    this.photos.set(newPhoto.id, newPhoto);
    return newPhoto;
  }

  async updatePhoto(id: number, photo: Partial<InsertPhoto>): Promise<Photo | undefined> {
    const existing = this.photos.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...photo };
    this.photos.set(id, updated);
    return updated;
  }

  async deletePhoto(id: number): Promise<boolean> {
    return this.photos.delete(id);
  }

  async getStats(): Promise<{
    totalTrips: number;
    totalPhotos: number;
    totalCountries: number;
    sharedPosts: number;
  }> {
    const trips = Array.from(this.trips.values());
    const photos = Array.from(this.photos.values());
    const countries = new Set(trips.map(trip => trip.location)).size;
    
    return {
      totalTrips: trips.length,
      totalPhotos: photos.length,
      totalCountries: countries,
      sharedPosts: Math.floor(photos.length * 0.3), // Mock shared posts
    };
  }
}

export const storage = new MemStorage();
