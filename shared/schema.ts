import { pgTable, text, varchar, serial, integer, boolean, timestamp, numeric, jsonb, unique } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
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
  // GPS coordinates for trip location
  latitude: numeric("latitude"),
  longitude: numeric("longitude"),
  // Route tracking data as JSON
  routeData: text("route_data"), // JSON string of GPS coordinates for the route
});

export const albums = pgTable("albums", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  coverPhotoUrl: text("cover_photo_url"),
  tripId: integer("trip_id").references(() => trips.id),
  // Shared album functionality
  isShared: boolean("is_shared").default(false),
  shareCode: text("share_code"), // Unique code for sharing
  allowUploads: boolean("allow_uploads").default(true), // Allow contributors to add photos
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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
  // GPS coordinates for photos
  latitude: numeric("latitude"),
  longitude: numeric("longitude"),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  metadata: text("metadata"), // JSON string for EXIF data
  contributorName: text("contributor_name"), // Name of person who added this photo
});

// Table for managing album contributors and permissions
export const albumContributors = pgTable("album_contributors", {
  id: serial("id").primaryKey(),
  albumId: integer("album_id").references(() => albums.id).notNull(),
  contributorName: text("contributor_name").notNull(),
  contributorEmail: text("contributor_email"),
  role: text("role").notNull().default("contributor"), // "owner", "contributor", "viewer"
  canUpload: boolean("can_upload").default(true),
  canEdit: boolean("can_edit").default(false),
  canDelete: boolean("can_delete").default(false),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

// Comments system for collaborative discussions
export const photoComments = pgTable("photo_comments", {
  id: serial("id").primaryKey(),
  photoId: integer("photo_id").notNull().references(() => photos.id, { onDelete: "cascade" }),
  authorName: text("author_name").notNull(),
  authorEmail: text("author_email"),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Activity feed for collaborative actions
export const albumActivity = pgTable("album_activity", {
  id: serial("id").primaryKey(),
  albumId: integer("album_id").notNull().references(() => albums.id, { onDelete: "cascade" }),
  contributorName: text("contributor_name").notNull(),
  action: text("action").notNull(), // photo_added, photo_edited, comment_added, etc.
  description: text("description").notNull(),
  metadata: text("metadata"), // JSON string with additional data about the action
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Photo likes/reactions for engagement
export const photoReactions = pgTable("photo_reactions", {
  id: serial("id").primaryKey(),
  photoId: integer("photo_id").notNull().references(() => photos.id, { onDelete: "cascade" }),
  contributorName: text("contributor_name").notNull(),
  contributorEmail: text("contributor_email"),
  reaction: text("reaction").notNull().default("like"), // like, love, laugh, wow
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Real-time collaboration sessions
export const collaborationSessions = pgTable("collaboration_sessions", {
  id: serial("id").primaryKey(),
  albumId: integer("album_id").notNull().references(() => albums.id, { onDelete: "cascade" }),
  contributorName: text("contributor_name").notNull(),
  sessionId: text("session_id").notNull(),
  isActive: boolean("is_active").default(true),
  lastActivity: timestamp("last_activity").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User profiles and settings
export const userProfiles = pgTable("user_profiles", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  username: text("username").notNull().unique(),
  displayName: text("display_name").notNull(),
  bio: text("bio"),
  avatar: text("avatar"),
  coverPhoto: text("cover_photo"),
  location: text("location"),
  website: text("website"),
  socialLinks: text("social_links"), // JSON string
  preferences: text("preferences"), // JSON string for user preferences
  privacy: text("privacy").notNull().default("public"), // public, friends, private
  isVerified: boolean("is_verified").default(false),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
  lastActiveAt: timestamp("last_active_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// User followers/following system
export const userFollows = pgTable("user_follows", {
  id: serial("id").primaryKey(),
  followerId: text("follower_id").notNull().references(() => userProfiles.userId),
  followingId: text("following_id").notNull().references(() => userProfiles.userId),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  uniqueFollow: unique().on(table.followerId, table.followingId),
}));

// User achievements and badges
export const userAchievements = pgTable("user_achievements", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => userProfiles.userId),
  achievementType: text("achievement_type").notNull(), // photographer, explorer, collaborator, etc.
  title: text("title").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  progress: integer("progress").default(0),
  maxProgress: integer("max_progress").notNull(),
  isCompleted: boolean("is_completed").default(false),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User photo statistics
export const userStats = pgTable("user_stats", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => userProfiles.userId).unique(),
  totalPhotos: integer("total_photos").default(0),
  totalTrips: integer("total_trips").default(0),
  totalAlbums: integer("total_albums").default(0),
  totalCountries: integer("total_countries").default(0),
  totalLikes: integer("total_likes").default(0),
  totalComments: integer("total_comments").default(0),
  totalShares: integer("total_shares").default(0),
  featuredPhotos: integer("featured_photos").default(0),
  lastPhotoAt: timestamp("last_photo_at"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Define relations
export const tripsRelations = relations(trips, ({ many }) => ({
  albums: many(albums),
  photos: many(photos),
}));

export const albumsRelations = relations(albums, ({ one, many }) => ({
  trip: one(trips, {
    fields: [albums.tripId],
    references: [trips.id],
  }),
  photos: many(photos),
  contributors: many(albumContributors),
}));

export const albumContributorsRelations = relations(albumContributors, ({ one }) => ({
  album: one(albums, {
    fields: [albumContributors.albumId],
    references: [albums.id],
  }),
}));

export const photosRelations = relations(photos, ({ one, many }) => ({
  trip: one(trips, {
    fields: [photos.tripId],
    references: [trips.id],
  }),
  album: one(albums, {
    fields: [photos.albumId],
    references: [albums.id],
  }),
  comments: many(photoComments),
  reactions: many(photoReactions),
}));

export const photoCommentsRelations = relations(photoComments, ({ one }) => ({
  photo: one(photos, {
    fields: [photoComments.photoId],
    references: [photos.id],
  }),
}));

export const albumActivityRelations = relations(albumActivity, ({ one }) => ({
  album: one(albums, {
    fields: [albumActivity.albumId],
    references: [albums.id],
  }),
}));

export const photoReactionsRelations = relations(photoReactions, ({ one }) => ({
  photo: one(photos, {
    fields: [photoReactions.photoId],
    references: [photos.id],
  }),
}));

export const collaborationSessionsRelations = relations(collaborationSessions, ({ one }) => ({
  album: one(albums, {
    fields: [collaborationSessions.albumId],
    references: [albums.id],
  }),
}));

export const userProfilesRelations = relations(userProfiles, ({ one, many }) => ({
  stats: one(userStats, {
    fields: [userProfiles.userId],
    references: [userStats.userId],
  }),
  achievements: many(userAchievements),
  followers: many(userFollows, { relationName: "following" }),
  following: many(userFollows, { relationName: "follower" }),
}));

export const userFollowsRelations = relations(userFollows, ({ one }) => ({
  follower: one(userProfiles, {
    fields: [userFollows.followerId],
    references: [userProfiles.userId],
    relationName: "follower",
  }),
  following: one(userProfiles, {
    fields: [userFollows.followingId],
    references: [userProfiles.userId],
    relationName: "following",
  }),
}));

// Travel Groups System
export const travelGroups = pgTable("travel_groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  coverImageUrl: text("cover_image_url"),
  ownerId: varchar("owner_id").notNull(),
  isPrivate: boolean("is_private").default(false),
  joinCode: text("join_code"), // Unique code for joining private groups
  maxMembers: integer("max_members").default(20),
  tags: text("tags").array(), // Travel interests/tags
  location: text("location"), // Primary destination
  budget: text("budget"), // Budget range
  travelStyle: text("travel_style"), // Adventure, Cultural, Relaxation, etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const groupMembers = pgTable("group_members", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").references(() => travelGroups.id).notNull(),
  userId: varchar("user_id").notNull(),
  role: text("role").notNull(), // owner, admin, member, viewer
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
  nickname: text("nickname"), // Optional nickname in group
  bio: text("bio"), // Member bio for the group
  permissions: jsonb("permissions"), // Custom permissions object
  isActive: boolean("is_active").default(true),
}, (table) => [
  unique().on(table.groupId, table.userId)
]);

export const groupTrips = pgTable("group_trips", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").references(() => travelGroups.id).notNull(),
  tripId: integer("trip_id").references(() => trips.id).notNull(),
  status: text("status").default("planned"), // planned, active, completed, cancelled
  createdBy: varchar("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  unique().on(table.groupId, table.tripId)
]);

export const groupMessages = pgTable("group_messages", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").references(() => travelGroups.id).notNull(),
  userId: varchar("user_id").notNull(),
  content: text("content").notNull(),
  messageType: text("message_type").default("text"), // text, image, file, system
  attachmentUrl: text("attachment_url"),
  replyToId: integer("reply_to_id").references(() => groupMessages.id),
  isEdited: boolean("is_edited").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const groupEvents = pgTable("group_events", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").references(() => travelGroups.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  eventType: text("event_type").notNull(), // meeting, deadline, activity, milestone
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  location: text("location"),
  isAllDay: boolean("is_all_day").default(false),
  reminderTime: integer("reminder_time"), // Minutes before event
  createdBy: varchar("created_by").notNull(),
  attendees: text("attendees").array(), // User IDs of attendees
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const groupPolls = pgTable("group_polls", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").references(() => travelGroups.id).notNull(),
  question: text("question").notNull(),
  options: jsonb("options").notNull(), // Array of poll options
  votes: jsonb("votes").notNull(), // Voting results
  allowMultiple: boolean("allow_multiple").default(false),
  isAnonymous: boolean("is_anonymous").default(false),
  endDate: timestamp("end_date"),
  createdBy: varchar("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const groupExpenses = pgTable("group_expenses", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").references(() => travelGroups.id).notNull(),
  tripId: integer("trip_id").references(() => trips.id),
  title: text("title").notNull(),
  amount: numeric("amount").notNull(),
  currency: text("currency").default("EUR"),
  category: text("category").notNull(), // accommodation, transport, food, activities, etc.
  paidBy: varchar("paid_by").notNull(),
  splitBetween: text("split_between").array(), // User IDs to split between
  receiptUrl: text("receipt_url"),
  description: text("description"),
  date: timestamp("date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const groupTasks = pgTable("group_tasks", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").references(() => travelGroups.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  assignedTo: varchar("assigned_to"),
  status: text("status").default("pending"), // pending, in_progress, completed
  priority: text("priority").default("medium"), // low, medium, high, urgent
  dueDate: timestamp("due_date"),
  category: text("category"), // booking, planning, packing, research, etc.
  createdBy: varchar("created_by").notNull(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const groupInvitations = pgTable("group_invitations", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").references(() => travelGroups.id).notNull(),
  invitedEmail: text("invited_email"),
  invitedUserId: varchar("invited_user_id"),
  invitedBy: varchar("invited_by").notNull(),
  role: text("role").default("member"),
  message: text("message"),
  status: text("status").default("pending"), // pending, accepted, declined, expired
  token: text("token").notNull(), // Unique invitation token
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userAchievementsRelations = relations(userAchievements, ({ one }) => ({
  user: one(userProfiles, {
    fields: [userAchievements.userId],
    references: [userProfiles.userId],
  }),
}));

// Travel Groups Relations
export const travelGroupsRelations = relations(travelGroups, ({ one, many }) => ({
  owner: one(userProfiles, {
    fields: [travelGroups.ownerId],
    references: [userProfiles.userId],
  }),
  members: many(groupMembers),
  trips: many(groupTrips),
  messages: many(groupMessages),
  events: many(groupEvents),
  polls: many(groupPolls),
  expenses: many(groupExpenses),
  tasks: many(groupTasks),
  invitations: many(groupInvitations),
}));

export const groupMembersRelations = relations(groupMembers, ({ one }) => ({
  group: one(travelGroups, {
    fields: [groupMembers.groupId],
    references: [travelGroups.id],
  }),
  user: one(userProfiles, {
    fields: [groupMembers.userId],
    references: [userProfiles.userId],
  }),
}));

export const groupTripsRelations = relations(groupTrips, ({ one }) => ({
  group: one(travelGroups, {
    fields: [groupTrips.groupId],
    references: [travelGroups.id],
  }),
  trip: one(trips, {
    fields: [groupTrips.tripId],
    references: [trips.id],
  }),
}));

export const groupMessagesRelations = relations(groupMessages, ({ one }) => ({
  group: one(travelGroups, {
    fields: [groupMessages.groupId],
    references: [travelGroups.id],
  }),
  user: one(userProfiles, {
    fields: [groupMessages.userId],
    references: [userProfiles.userId],
  }),
  replyTo: one(groupMessages, {
    fields: [groupMessages.replyToId],
    references: [groupMessages.id],
  }),
}));

// Insert and Select Types for Travel Groups
export const insertTravelGroupSchema = createInsertSchema(travelGroups);
export const insertGroupMemberSchema = createInsertSchema(groupMembers);
export const insertGroupTripSchema = createInsertSchema(groupTrips);
export const insertGroupMessageSchema = createInsertSchema(groupMessages);
export const insertGroupEventSchema = createInsertSchema(groupEvents);
export const insertGroupPollSchema = createInsertSchema(groupPolls);
export const insertGroupExpenseSchema = createInsertSchema(groupExpenses);
export const insertGroupTaskSchema = createInsertSchema(groupTasks);
export const insertGroupInvitationSchema = createInsertSchema(groupInvitations);

export type InsertTravelGroup = z.infer<typeof insertTravelGroupSchema>;
export type InsertGroupMember = z.infer<typeof insertGroupMemberSchema>;
export type InsertGroupTrip = z.infer<typeof insertGroupTripSchema>;
export type InsertGroupMessage = z.infer<typeof insertGroupMessageSchema>;
export type InsertGroupEvent = z.infer<typeof insertGroupEventSchema>;
export type InsertGroupPoll = z.infer<typeof insertGroupPollSchema>;
export type InsertGroupExpense = z.infer<typeof insertGroupExpenseSchema>;
export type InsertGroupTask = z.infer<typeof insertGroupTaskSchema>;
export type InsertGroupInvitation = z.infer<typeof insertGroupInvitationSchema>;

export type TravelGroup = typeof travelGroups.$inferSelect;
export type GroupMember = typeof groupMembers.$inferSelect;
export type GroupTrip = typeof groupTrips.$inferSelect;
export type GroupMessage = typeof groupMessages.$inferSelect;
export type GroupEvent = typeof groupEvents.$inferSelect;
export type GroupPoll = typeof groupPolls.$inferSelect;
export type GroupExpense = typeof groupExpenses.$inferSelect;
export type GroupTask = typeof groupTasks.$inferSelect;
export type GroupInvitation = typeof groupInvitations.$inferSelect;

export const userStatsRelations = relations(userStats, ({ one }) => ({
  user: one(userProfiles, {
    fields: [userStats.userId],
    references: [userProfiles.userId],
  }),
}));

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

export type AlbumContributor = typeof albumContributors.$inferSelect;
export type InsertAlbumContributor = typeof albumContributors.$inferInsert;

export type PhotoComment = typeof photoComments.$inferSelect;
export type InsertPhotoComment = typeof photoComments.$inferInsert;

export type AlbumActivity = typeof albumActivity.$inferSelect;
export type InsertAlbumActivity = typeof albumActivity.$inferInsert;

export type PhotoReaction = typeof photoReactions.$inferSelect;
export type InsertPhotoReaction = typeof photoReactions.$inferInsert;

export type CollaborationSession = typeof collaborationSessions.$inferSelect;
export type InsertCollaborationSession = typeof collaborationSessions.$inferInsert;

export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = typeof userProfiles.$inferInsert;

export type UserFollow = typeof userFollows.$inferSelect;
export type InsertUserFollow = typeof userFollows.$inferInsert;

export type UserAchievement = typeof userAchievements.$inferSelect;
export type InsertUserAchievement = typeof userAchievements.$inferInsert;

export type UserStats = typeof userStats.$inferSelect;
export type InsertUserStats = typeof userStats.$inferInsert;
