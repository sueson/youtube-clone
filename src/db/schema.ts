import { foreignKey, integer, pgEnum, pgTable, primaryKey, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import {
    createInsertSchema,
    createSelectSchema,
    createUpdateSchema
} from "drizzle-zod";


export const reactionType = pgEnum("reaction_type", ["like", "dislike"]);


export const users = pgTable("users", {
    id: uuid("id").primaryKey().defaultRandom(),
    clerkId: text("clerk_id").unique().notNull(),  // notNull - required
    name: text("name").notNull(),
    bannerUrl: text("banner_url"),  // optional
    bannerKey: text("banner_key"),  // optional
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
    videoViews: many(videoViews),
    videoReactions: many(videoReactions),
    subscriptions: many(subscriptions, {
        relationName: "subscriptions_viewer_id_fkey"
    }),
    subscribers: many(subscriptions, {
        relationName: "subscriptions_creator_id_fkey"
    }),
    comments: many(comments),
    commentReactions: many(commentReactions),
    playlists: many(playlists),
}));


export const subscriptions = pgTable("subscriptions", {
    viewerId: uuid("viewer_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    creatorId: uuid("creator_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull()
}, (t) => [
    primaryKey({
        name: "subscriptions_pk",
        columns: [t.viewerId, t.creatorId],
    }),
]);


export const subscriptionRelations = relations(subscriptions, ({ one }) => ({
    viewer: one(users, {
        fields: [subscriptions.viewerId],
        references: [users.id],
        relationName: "subscriptions_viewer_id_fkey",
    }),
    creator: one(users, {
        fields: [subscriptions.creatorId],
        references: [users.id],
        relationName: "subscriptions_creator_id_fkey",
    }),
}))


export const categories = pgTable("categories", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull().unique(),
    description: text("description"),  //optional
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
        // if user id deleted all their videos deleted too
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


// foreign keys
export const videoRelations = relations(videos, ({ one, many }) => ({
    user: one(users, {
        fields: [videos.id],
        references: [users.id]
    }),
    category: one(categories, {
        fields: [videos.categoryId],
        references: [categories.id]
    }),
    views: many(videoViews),
    reactions: many(videoReactions),
    comments: many(comments),
    playlistVideos: many(playlistVideos),
}));


export const videoViews = pgTable("video_views", {
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    videoId: uuid("video_id").references(() => videos.id, { onDelete: "cascade" }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull()
}, (t) => [
    primaryKey({
        name: "video_views_pk",
        columns: [t.userId, t.videoId]
    }),
]);


export const videoViewsRelations = relations(videoViews, ({ one }) => ({
    user: one(users, {
        fields: [videoViews.userId],
        references: [users.id]
    }),
    video: one(videos, {
        fields: [videoViews.videoId],
        references: [videos.id]
    }),
}));


// Creating schemas for video views to manage database operations efficiently.
export const videoViewInsertSchema = createInsertSchema(videoViews);
export const videoViewUpdateSchema = createUpdateSchema(videoViews);
export const videoViewSelectSchema = createSelectSchema(videoViews);



export const videoReactions = pgTable("video_reactions", {
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    videoId: uuid("video_id").references(() => videos.id, { onDelete: "cascade" }).notNull(),
    type: reactionType("type").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull()
}, (t) => [
    primaryKey({
        name: "video_reactions_pk",
        columns: [t.userId, t.videoId]
    }),
]);


export const videoReactionRelations = relations(videoReactions, ({ one }) => ({
    user: one(users, {
        fields: [videoReactions.userId],
        references: [users.id]
    }),
    video: one(videos, {
        fields: [videoReactions.videoId],
        references: [videos.id]
    }),
}));


export const videoReactionInsertSchema = createInsertSchema(videoReactions);
export const videoReactionUpdateSchema = createUpdateSchema(videoReactions);
export const videoReactionSelectSchema = createSelectSchema(videoReactions);


export const comments = pgTable("comments", {
    id: uuid("id").primaryKey().defaultRandom(),
    parentId: uuid("parent_id"),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    videoId: uuid("video_id").references(() => videos.id, { onDelete: "cascade" }).notNull(),
    value: text("value").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull()
}, (t) => {
    return [
        foreignKey({
            columns: [t.parentId],
            foreignColumns: [t.id],
            name: "comments_parent_id_fkey",
        })
        .onDelete("cascade")
    ]
});


export const commentRelations = relations(comments, ({ one, many }) => ({
    user: one(users, {
        fields: [comments.userId],
        references: [users.id]
    }),
    video: one(videos, {
        fields: [comments.videoId],
        references: [videos.id]
    }),
    parent: one(comments, {
        fields: [comments.parentId],
        references: [comments.id],
        relationName: "comments_parent_id_fkey"
    }),
    reactions: many(commentReactions),
    replies: many(comments, {
        relationName: "comments_parent_id_fkey"
    }),
}));


export const commentInsertSchema = createInsertSchema(comments);
export const commentUpdateSchema = createUpdateSchema(comments);
export const commentSelectSchema = createSelectSchema(comments);


export const commentReactions = pgTable("comment_reactions", {
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    commentId: uuid("comment_id").references(() => comments.id, { onDelete: "cascade" }).notNull(),
    type: reactionType("type").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull()
}, (t) => [
    primaryKey({
        name: "comment_reactions_pk",
        columns: [t.userId, t.commentId]
    }),
]); 


export const commentReactionRelations = relations(commentReactions, ({ one }) => ({
    user: one(users, {
        fields: [commentReactions.userId],
        references: [users.id]
    }),
    comment: one(comments, {
        fields: [commentReactions.commentId],
        references: [comments.id]
    }),
}));


export const playlistVideos = pgTable("playlist_videos", {
    playlistId: uuid("playlist_id").references(() => playlists.id, { onDelete: "cascade" }).notNull(),
    videoId: uuid("video_id").references(() => videos.id, { onDelete: "cascade" }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull()
}, (t) => [
    primaryKey({
        name: "playlist_videos_pk",
        columns: [t.playlistId, t.videoId],
    })
]);


export const playlistVideosRelation = relations(playlistVideos, ({ one }) => ({
    playlist: one(playlists, {
        fields: [playlistVideos.playlistId],
        references: [playlists.id],
    }),
    video: one(videos, {
        fields: [playlistVideos.videoId],
        references: [videos.id],
    })
}));


export const playlists = pgTable("playlists", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    description: text("description"),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull() 
});


export const playlistsRelation = relations(playlists, ({ one, many }) => ({
    user: one(users, {
        fields: [playlists.userId],
        references: [users.id],
    }),
    playlistVideos: many(playlistVideos),
}));