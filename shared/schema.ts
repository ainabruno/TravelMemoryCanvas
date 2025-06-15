import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const trips = pgTable("trips", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  location: text("location").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  coverPhotoUrl: text("cover_photo_url"),
});

export const albums = pgTable("albums", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  coverPhotoUrl: text("cover_photo_url"),
  tripId: integer("trip_id").references(() => trips.id),
});

export const photos = pgTable("photos", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  url: text("url").notNull(),
  tripId: integer("trip_id").references(() => trips.id),
  albumId: integer("album_id").references(() => albums.id),
  caption: text("caption"),
  location: text("location"),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  metadata: text("metadata"), // JSON string for EXIF data
});

export const insertTripSchema = createInsertSchema(trips).omit({
  id: true,
});

export const insertAlbumSchema = createInsertSchema(albums).omit({
  id: true,
});

export const insertPhotoSchema = createInsertSchema(photos).omit({
  id: true,
  uploadedAt: true,
});

export type Trip = typeof trips.$inferSelect;
export type InsertTrip = z.infer<typeof insertTripSchema>;

export type Album = typeof albums.$inferSelect;
export type InsertAlbum = z.infer<typeof insertAlbumSchema>;

export type Photo = typeof photos.$inferSelect;
export type InsertPhoto = z.infer<typeof insertPhotoSchema>;
