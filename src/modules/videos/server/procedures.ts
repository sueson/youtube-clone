import { db } from "@/db";
import { subscriptions, users, videoReactions, videos, videoUpdateSchema, videoViews } from "@/db/schema";
import { mux } from "@/lib/mux";
import { workflow } from "@/lib/workflow";
import { baseProcedure, createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, getTableColumns, inArray, isNotNull, lt, or } from "drizzle-orm";
import { UTApi } from "uploadthing/server";
import { z } from "zod";

// handles video crud operation / api
export const videosRouter = createTRPCRouter({
    // Only for logged user
    getManySubscribed: protectedProcedure
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

        const viewerSubscriptions = db.$with("viewer_subscriptions").as(
            db
                .select({
                    userId: subscriptions.creatorId,
                })
                .from(subscriptions)
                .where(eq(subscriptions.viewerId, userId)),
        );

        const data = await db
            .with(viewerSubscriptions)
            .select({
                ...getTableColumns(videos),
                user: users,
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
            .innerJoin(
                viewerSubscriptions,
                eq(viewerSubscriptions.userId, users.id)
            )
            .where(and(
                eq(videos.visibility, "public"),
                cursor
                    ? or(
                        lt(videos.updatedAt, cursor.updatedAt),  // lt - larger than
                        and(
                            eq(videos.updatedAt, cursor.updatedAt),
                            lt(videos.id, cursor.id)
                        )
                    )
                    : undefined,
            ))
            .orderBy(desc(videos.updatedAt), desc(videos.id))
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
    getManyTrending: baseProcedure
    .input(
        z.object({
            cursor: z.object({
                id: z.string().uuid(),  // This is a unique identifier for pagination.
                viewCount: z.number(),
            })
            .nullish(),  // This means the cursor is optional, allowing the first request to be made without it.
            limit: z.number().min(1).max(100),  // This sets a limit on the number of videos returned, between 1 and 100.
        }),
    )
    .query(async ({ input }) => {
        const { cursor, limit } = input;

        const viewCountSubquery = db.$count(
            videoViews,
            eq(videoViews.videoId, videos.id),
        );

        const data = await db
            .select({
                ...getTableColumns(videos),
                user: users,
                viewCount: viewCountSubquery,
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
            .where(and(
                eq(videos.visibility, "public"),
                cursor
                    ? or(
                        lt(viewCountSubquery, cursor.viewCount),  // lt - larger than
                        and(
                            eq(viewCountSubquery, cursor.viewCount),
                            lt(videos.id, cursor.id)
                        )
                    )
                    : undefined,
            ))
            .orderBy(desc(viewCountSubquery), desc(videos.id))
            .limit(limit + 1)  // Add 1 to check if there is more data

            const hasMore = data.length > limit;
            // Remove the last item if there is more data
            const items = hasMore ? data.slice(0, -1) : data;
            // set the next cursor to the last item if there is more data
            const lastItem = items[items.length - 1];
            const nextCursor = hasMore ? 
                {
                    id: lastItem.id,
                    viewCount: lastItem.viewCount
                } 
                : null;

        return {
            items,
            nextCursor
        };
    }),
    getMany: baseProcedure
    .input(
        z.object({
            categoryId: z.string().uuid().nullish(),
            cursor: z.object({
                id: z.string().uuid(),  // This is a unique identifier for pagination.
                updatedAt: z.date()     // This is the date when the video was last updated.
            })
            .nullish(),  // This means the cursor is optional, allowing the first request to be made without it.
            limit: z.number().min(1).max(100),  // This sets a limit on the number of videos returned, between 1 and 100.
        }),
    )
    .query(async ({ input }) => {
        const { cursor, limit, categoryId } = input;

        const data = await db
            .select({
                ...getTableColumns(videos),
                user: users,
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
            .where(and(
                eq(videos.visibility, "public"),
                categoryId ? eq(videos.categoryId, categoryId) : undefined,
                cursor
                    ? or(
                        lt(videos.updatedAt, cursor.updatedAt),  // lt - larger than
                        and(
                            eq(videos.updatedAt, cursor.updatedAt),
                            lt(videos.id, cursor.id)
                        )
                    )
                    : undefined,
            ))
            .orderBy(desc(videos.updatedAt), desc(videos.id))
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
    getOne: baseProcedure
        .input(z.object({ id: z.string().uuid() }))
        .query(async ({ input, ctx }) => {
            const { clerkUserId } = ctx;

            let userId;

            const [user] = await db
                .select()
                .from(users)
                .where(inArray(users.clerkId, clerkUserId ? [clerkUserId] : []))

                if(user) {
                    userId = user.id
                }

            const viewerReactions = db.$with("viewer_reactions").as(
                db
                    .select({
                        videoId: videoReactions.videoId,
                        type: videoReactions.type
                    })
                    .from(videoReactions)
                    .where(inArray(videoReactions.userId, userId ? [userId] : []))
            );

            const viewerSubscriptions = db.$with("viewer_subscriptions").as(
                db
                    .select()
                    .from(subscriptions)
                    // Filters subscriptions to include only those where the viewerId matches the current user's ID, if available.
                    .where(inArray(subscriptions.viewerId, userId ? [userId] : []))
            )

            const [existingVideo] = await db
                .with(viewerReactions, viewerSubscriptions)
                .select({
                    ...getTableColumns(videos),
                    user: {
                        ...getTableColumns(users),
                        subscriberCount: db.$count(subscriptions, eq(subscriptions.creatorId, users.id)),
                        viewerSubscribed: isNotNull(viewerSubscriptions.viewerId).mapWith(Boolean),
                    },
                    viewCount: db.$count(videoViews, eq(videoViews.videoId, videos.id)),
                    likeCount: db.$count(
                        videoReactions,
                        and(
                            eq(videoReactions.videoId, videos.id),
                            eq(videoReactions.type, "like")
                        ),
                    ),
                    dislikeCount: db.$count(
                        videoReactions,
                        and(
                            eq(videoReactions.videoId, videos.id),
                            eq(videoReactions.type, "dislike")
                        ),
                    ),
                    viewerReactions: viewerReactions.type,
                })
                .from(videos)
                .innerJoin(users, eq(videos.userId, users.id))
                .leftJoin(viewerReactions, eq(viewerReactions.videoId, videos.id))
                .leftJoin(viewerSubscriptions, eq(viewerSubscriptions.creatorId, users.id))
                .where(eq(videos.id, input.id))
                // .groupBy(
                //     videos.id,
                //     users.id,
                //     viewerReactions.type,
                // )

                if(!existingVideo) {
                    throw new TRPCError({ code: "NOT_FOUND" });
                };

            return existingVideo
        }),
    generateThumbnail: protectedProcedure
        .input(z.object({ id: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            const { id: userId } = ctx.user
            const { workflowRunId } = await workflow.trigger({
                url: `${process.env.UPSTASH_WORKFLOW_URL}/api/videos/workflows/title`,
                body: { userId, videoId: input.id },
            });

            return workflowRunId;
        }),
    // Re-Validate the video when mux_status gets preparing & playback id gets null
    // Once re-validation complete the video mux status shows to be ready and the video becomes playable
    revalidate: protectedProcedure
        .input(z.object({ id: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            const { id: userId } = ctx.user;

            const [existingVideo] = await db
                .select()
                .from(videos)
                .where(and(
                    eq(videos.id, input.id),
                    eq(videos.userId, userId)
                ));

                if(!existingVideo) {
                    throw new TRPCError({ code: "NOT_FOUND" });
                };

                if(!existingVideo.muxUploadId) {
                    throw new TRPCError({ code: "BAD_REQUEST" });
                };

                const upload = await mux.video.uploads.retrieve(
                    existingVideo.muxUploadId
                );

                if(!upload || !upload.asset_id) {
                    throw new TRPCError({ code: "BAD_REQUEST" });
                };

                const asset = await mux.video.assets.retrieve(
                    upload.asset_id
                );

                if(!asset) {
                    throw new TRPCError({ code: "BAD_REQUEST" });
                };

                const playbackId = asset.playback_ids?.[0].id;
                const duration = asset.duration ? Math.round(asset.duration * 1000) : 0;

                const [updatedVideo] = await db
                    .update(videos)
                    .set({
                        muxStatus: asset.status,
                        muxPlaybackId: playbackId,
                        muxAssetId: asset.id,
                        duration,
                    })
                    .where(and(
                        eq(videos.id, input.id),
                        eq(videos.userId, userId),
                    ))
                    .returning();

                return updatedVideo;
        }),
    // reset thumbnail
    restoreThumbnail: protectedProcedure
        .input(z.object({ id: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            const { id: userId } = ctx.user;

            const [existingVideo] = await db
                .select()
                .from(videos)
                .where(and(
                    eq(videos.id, input.id),
                    eq(videos.userId, userId)
                ));

            if(!existingVideo) {
                throw new TRPCError({ code: "NOT_FOUND" });
            };

            //  Delete the new thumbnail using key when restore hits, beofre hits the updateVideo
            if(existingVideo.thumbnailKey) {
                const utapi = new UTApi();
    
                await utapi.deleteFiles(existingVideo.thumbnailKey);
                await db
                  .update(videos)
                  .set({
                    thumbnailKey: null,
                    thumbnailUrl: null
                  })
                  .where(and(
                    eq(videos.id, input.id),
                    eq(videos.userId, userId)
                  ));
              }

            if(!existingVideo.muxPlaybackId) {
                throw new TRPCError({ code: "BAD_REQUEST" });
            };

            // For generate thumbnail
            const tempThumbnailUrl = `https://image.mux.com/${existingVideo.muxPlaybackId}/thumbnail.jpg`;

            // To store our files into uploadThing
            const utapi = new UTApi();
            const uploadedThumbnail = await utapi.uploadFilesFromUrl(tempThumbnailUrl);

            if(!uploadedThumbnail.data) {
                throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
            };

            const { key: thumbnailKey, ufsUrl: thumbnailUrl } = uploadedThumbnail.data;

            const [updatedVideo] = await db
                .update(videos)
                .set({
                    thumbnailUrl,
                    thumbnailKey
                })
                .where(and(
                    eq(videos.id, input.id),
                    eq(videos.userId, userId)
                ))
                .returning();
            
            return updatedVideo;
        }),
    remove: protectedProcedure
        .input(z.object({ id: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            const { id: userId } = ctx.user;

            const [removedVideo] = await db
                .delete(videos)
                .where(and(
                    eq(videos.id, input.id),
                    eq(videos.userId, userId)
                ))
                .returning();

                if(!removedVideo) {
                    throw new TRPCError({ code: "NOT_FOUND" });
                };

            return removedVideo;
        }),
    update: protectedProcedure
        .input(videoUpdateSchema)
        .mutation(async ({ ctx, input }) => {
            const { id: userId } = ctx.user;

            if(!input.id) {
                throw new TRPCError({ code: "BAD_REQUEST" });
            };

            const [updatedVideo] = await db
                .update(videos)
                .set({
                    title: input.title,
                    description: input.description,
                    categoryId: input.categoryId,
                    visibility: input.visibility,
                    updatedAt: new Date()
                })
                .where(and(
                    eq(videos.id, input.id),
                    eq(videos.userId, userId)
                ))
                .returning()

                if(!updatedVideo) {
                    throw new TRPCError({ code: "NOT_FOUND" });
                };
            return updatedVideo;
        }),
    create: protectedProcedure.mutation(async ({ ctx }) => {
        const { id: userId } = ctx.user;

        const uploadVideo = await mux.video.uploads.create({
            new_asset_settings: {
                passthrough: userId,  // using userId for getting to know which video belongs to which user
                playback_policy: ["public"],
                input: [
                    {
                        generated_subtitles: [
                            {
                                language_code: "en",
                                name: "English"
                            }
                        ]
                    }
                ]
            },
            cors_origin: "*",  // TODO: in production set the url
        });

        const [video] = await db
            .insert(videos)
            .values({
                userId,
                title: "Untitled",
                muxStatus: "waiting",
                muxUploadId: uploadVideo.id,
            })
            .returning();  // to return back

        return {
            video,
            url: uploadVideo.url
        };
    })
});