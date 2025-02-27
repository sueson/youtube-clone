import { pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

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


export const videos = pgTable("videos", {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    description: text("description"),
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