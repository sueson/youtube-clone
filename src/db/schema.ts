import { integer, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import {
    createInsertSchema,
    createSelectSchema,
    createUpdateSchema
} from "drizzle-zod";


export const users = pgTable("users", {
    id: uuid("id").primaryKey().defaultRandom(),
    clerkId: text("clerk_id").unique().notNull(),  // notNull - required
    name: text("name").notNull(),
    imageUrl: text("image_url").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull()
}, (t) => [uniqueIndex("clerk_id_idx").on(t.clerkId)]);  //idx(index) - using index to query by clerk id, and this arrow method used to find the user fast


// This code establishes the relationship between the 'users' table and the 'videos' table.
// It specifies that each user can have multiple videos associated with them. This relationship 
// is crucial for efficiently querying and managing data, as it allows us to easily access all 
// videos created by a specific user, enhancing the overall functionality of our application.
export const userRelations = relations(users, ({ many }) => ({
    videos: many(videos),
}));


export const categories = pgTable("categories", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull().unique(),
    description: text("description"),  //optiional
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull()
}, (t) => [uniqueIndex("name_idx").on(t.name)]);

export const categoryRelations = relations(users, ({ many }) => ({
    videos: many(videos),
}));


export const videoVisibility = pgEnum("video_visibility", [
    "private",
    "public"
]);


export const videos = pgTable("videos", {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    description: text("description"),
    muxStatus: text("mux_status"),
    muxAssetId: text("mux_assest_id").unique(),
    muxUploadId: text("mux_upload_id").unique(),
    muxPlaybackId: text("mux_playback_id").unique(),
    muxTrackId: text("mux_track_id").unique(),
    muxTrackStatus: text("mux_track_status"),
    thumbnailUrl: text("thumbnail_url"),
    thumbnailKey: text("thumbnail_key"),   // Get the key to delete files from uploadThing once restore 
    previewUrl: text("preview_url"),
    previewKey: text("preview_key"),
    duration: integer("duration").default(0).notNull(),
    visibility: videoVisibility("visibility").default("private").notNull(),
    userId: uuid("user_id").references(() => users.id, {
        // if user id deleted all thier videos deleted too
        onDelete: "cascade"
    }).notNull(),
    categoryId: uuid("category_id").references(() => categories.id, {
        onDelete: "set null"
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull()
});


export const videoInsertSchema = createInsertSchema(videos);
export const videoUpdateSchema = createUpdateSchema(videos);
export const videoSelectSchema = createSelectSchema(videos);


export const videoRelations = relations(videos, ({ one }) => ({
    user: one(users, {
        fields: [videos.id],
        references: [users.id]
    }),
    category: one(categories, {
        fields: [videos.categoryId],
        references: [categories.id]
    })
}));