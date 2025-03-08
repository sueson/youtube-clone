import { db } from "@/db";
import { playlists, playlistVideos, users, videoReactions, videos, videoViews } from "@/db/schema";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, getTableColumns, lt, or, sql } from "drizzle-orm";
import { z } from "zod";

// handles video crud operation / api
export const playlistsRouter = createTRPCRouter({
    getManyForVideo: protectedProcedure
    .input(
        z.object({
            videoId: z.string().uuid(),
            cursor: z.object({
                id: z.string().uuid(),  // This is a unique identifier for pagination.
                updatedAt: z.date()     // This is the date when the video was last updated.
            })
            .nullish(),  // This means the cursor is optional, allowing the first request to be made without it.
            limit: z.number().min(1).max(100),  // This sets a limit on the number of videos returned, between 1 and 100.
        }),
    )
    .query(async ({ ctx, input }) => {
        const { id: userId } = ctx.user;

        const { cursor, limit, videoId } = input;

        const data = await db
            .select({
                ...getTableColumns(playlists),
                videoCount: db.$count(
                    playlistVideos,
                    eq(playlists.id, playlistVideos.playlistId),
                ),
                user: users,
                containsVideo: videoId
                // playlist_id name should match exactly like in schema 
                    ? sql<boolean> `(
                        SELECT EXISTS (
                            SELECT 1
                            FROM ${playlistVideos} pv
                            WHERE pv.playlist_id = ${playlists.id} AND pv.video_id = ${videoId}
                        )
                    )`
                    : sql<boolean> `false`,
            })
            .from(playlists)
            .innerJoin(users, eq(playlists.userId, users.id))
            .where(and(
                eq(playlists.userId, userId),
                cursor
                    ? or(
                        lt(playlists.updatedAt, cursor.updatedAt),  // lt - larger than
                        and(
                            eq(playlists.updatedAt, cursor.updatedAt),
                            lt(playlists.id, cursor.id)
                        )
                    )
                    : undefined,
            ))
            .orderBy(desc(playlists.updatedAt), desc(playlists.id))
            .limit(limit + 1)  // Add 1 to check if there is more data

            const hasMore = data.length > limit;
            // Remove the last item if there is more data
            const items = hasMore ? data.slice(0, -1) : data;
            // set the next cursor to the last item if there is more data
            const lastItem = items[items.length - 1];
            const nextCursor = hasMore ? 
                {
                    id: lastItem.id,
                    updatedAt: lastItem.updatedAt
                } 
                : null;

        return {
            items,
            nextCursor
        };
    }),
    // To get all the videos to add in playlist by user preference
    getMany: protectedProcedure
    .input(
        z.object({
            cursor: z.object({
                id: z.string().uuid(),  // This is a unique identifier for pagination.
                updatedAt: z.date()     // This is the date when the video was last updated.
            })
            .nullish(),  // This means the cursor is optional, allowing the first request to be made without it.
            limit: z.number().min(1).max(100),  // This sets a limit on the number of videos returned, between 1 and 100.
        }),
    )
    .query(async ({ ctx, input }) => {
        const { id: userId } = ctx.user;

        const { cursor, limit } = input;

        const data = await db
            .select({
                ...getTableColumns(playlists),
                videoCount: db.$count(
                    playlistVideos,
                    eq(playlists.id, playlistVideos.playlistId),
                ),
                user: users,
            })
            .from(playlists)
            .innerJoin(users, eq(playlists.userId, users.id))
            .where(and(
                eq(playlists.userId, userId),
                cursor
                    ? or(
                        lt(playlists.updatedAt, cursor.updatedAt),  // lt - larger than
                        and(
                            eq(playlists.updatedAt, cursor.updatedAt),
                            lt(playlists.id, cursor.id)
                        )
                    )
                    : undefined,
            ))
            .orderBy(desc(playlists.updatedAt), desc(playlists.id))
            .limit(limit + 1)  // Add 1 to check if there is more data

            const hasMore = data.length > limit;
            // Remove the last item if there is more data
            const items = hasMore ? data.slice(0, -1) : data;
            // set the next cursor to the last item if there is more data
            const lastItem = items[items.length - 1];
            const nextCursor = hasMore ? 
                {
                    id: lastItem.id,
                    updatedAt: lastItem.updatedAt
                } 
                : null;

        return {
            items,
            nextCursor
        };
    }),
    create: protectedProcedure
        .input(z.object({ name: z.string().min(1) }))
        .mutation(async ({ ctx, input }) => {
            const { name } = input;
            const { id: userId } = ctx.user;

            const [createdPlaylist] = await db
                .insert(playlists)
                .values({
                    userId,
                    name,
                })
                .returning();

                if(!createdPlaylist) {
                    throw new TRPCError({ code: "BAD_REQUEST" });
                };

            return createdPlaylist;
        }),
    getHistory: protectedProcedure
    .input(
        z.object({
            cursor: z.object({
                id: z.string().uuid(),  // This is a unique identifier for pagination.
                viewedAt: z.date()     // This is the date when the video was last updated.
            })
            .nullish(),  // This means the cursor is optional, allowing the first request to be made without it.
            limit: z.number().min(1).max(100),  // This sets a limit on the number of videos returned, between 1 and 100.
        }),
    )
    .query(async ({ ctx, input }) => {
        const { id: userId } = ctx.user;

        const { cursor, limit } = input;

        const viewerVideoViews = db.$with("viewer_video_views").as(
            db
                .select({
                    videoId: videoViews.videoId,
                    viewedAt: videoViews.updatedAt,
                })
                .from(videoViews)
                .where(eq(videoViews.userId, userId))
        );

        const data = await db
            .with(viewerVideoViews)
            .select({
                ...getTableColumns(videos),
                user: users,
                viewedAt: viewerVideoViews.viewedAt,
                viewCount: db.$count(videoViews, eq(videoViews.videoId, videos.id)),
                likeCount: db.$count(videoReactions, and(
                    eq(videoReactions.videoId, videos.id),
                    eq(videoReactions.type, "like"),
                )),
                dislikeCount: db.$count(videoReactions, and(
                    eq(videoReactions.videoId, videos.id),
                    eq(videoReactions.type, "dislike"),
                )),
            })
            .from(videos)
            .innerJoin(users, eq(videos.userId, users.id))
            .innerJoin(viewerVideoViews, eq(videos.id, viewerVideoViews.videoId))
            .where(and(
                eq(videos.visibility, "public"),
                cursor
                    ? or(
                        lt(viewerVideoViews.viewedAt, cursor.viewedAt),  // lt - larger than
                        and(
                            eq(viewerVideoViews.viewedAt, cursor.viewedAt),
                            lt(videos.id, cursor.id)
                        )
                    )
                    : undefined,
            ))
            .orderBy(desc(viewerVideoViews.viewedAt), desc(videos.id))
            .limit(limit + 1)  // Add 1 to check if there is more data

            const hasMore = data.length > limit;
            // Remove the last item if there is more data
            const items = hasMore ? data.slice(0, -1) : data;
            // set the next cursor to the last item if there is more data
            const lastItem = items[items.length - 1];
            const nextCursor = hasMore ? 
                {
                    id: lastItem.id,
                    viewedAt: lastItem.viewedAt
                } 
                : null;

        return {
            items,
            nextCursor
        };
    }),
    getLiked: protectedProcedure
    .input(
        z.object({
            cursor: z.object({
                id: z.string().uuid(),  // This is a unique identifier for pagination.
                likedAt: z.date()     // This is the date when the video was last updated.
            })
            .nullish(),  // This means the cursor is optional, allowing the first request to be made without it.
            limit: z.number().min(1).max(100),  // This sets a limit on the number of videos returned, between 1 and 100.
        }),
    )
    .query(async ({ ctx, input }) => {
        const { id: userId } = ctx.user;

        const { cursor, limit } = input;

        const viewerVideoReactions = db.$with("viewer_video_reactions").as(
            db
                .select({
                    videoId: videoReactions.videoId,
                    likedAt: videoReactions.updatedAt
                })
                .from(videoReactions)
                .where(and(
                    eq(videoReactions.userId, userId),
                    eq(videoReactions.type, "like")
                ))
        );
                

        const data = await db
            .with(viewerVideoReactions)
            .select({
                ...getTableColumns(videos),
                user: users,
                likedAt: viewerVideoReactions.likedAt,
                viewCount: db.$count(videoViews, eq(videoViews.videoId, videos.id)),
                likeCount: db.$count(videoReactions, and(
                    eq(videoReactions.videoId, videos.id),
                    eq(videoReactions.type, "like"),
                )),
                dislikeCount: db.$count(videoReactions, and(
                    eq(videoReactions.videoId, videos.id),
                    eq(videoReactions.type, "dislike"),
                )),
            })
            .from(videos)
            .innerJoin(users, eq(videos.userId, users.id))
            .innerJoin(viewerVideoReactions, eq(videos.id, viewerVideoReactions.videoId))
            .where(and(
                eq(videos.visibility, "public"),
                cursor
                    ? or(
                        lt(viewerVideoReactions.likedAt, cursor.likedAt),  // lt - larger than
                        and(
                            eq(viewerVideoReactions.likedAt, cursor.likedAt),
                            lt(videos.id, cursor.id)
                        )
                    )
                    : undefined,
            ))
            .orderBy(desc(viewerVideoReactions.likedAt), desc(videos.id))
            .limit(limit + 1)  // Add 1 to check if there is more data

            const hasMore = data.length > limit;
            // Remove the last item if there is more data
            const items = hasMore ? data.slice(0, -1) : data;
            // set the next cursor to the last item if there is more data
            const lastItem = items[items.length - 1];
            const nextCursor = hasMore ? 
                {
                    id: lastItem.id,
                    likedAt: lastItem.likedAt
                } 
                : null;

        return {
            items,
            nextCursor
        };
    }),
});