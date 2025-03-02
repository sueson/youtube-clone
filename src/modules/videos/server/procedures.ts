import { db } from "@/db";
import { videos, videoUpdateSchema } from "@/db/schema";
import { mux } from "@/lib/mux";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

// handles video crud operation
export const videosRouter = createTRPCRouter({
    // reset thumbnail
    restoreThumbnail: protectedProcedure
        .input(z.object({ id: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            const { id: userId } = ctx.user;

            const [existingVideos] = await db
                .select()
                .from(videos)
                .where(and(
                    eq(videos.id, input.id),
                    eq(videos.userId, userId)
                ));

            if(!existingVideos) {
                throw new TRPCError({ code: "NOT_FOUND" });
            };

            if(!existingVideos.muxPlaybackId) {
                throw new TRPCError({ code: "BAD_REQUEST" });
            };

            const thumbnailUrl = `https://image.mux.com/${existingVideos.muxPlaybackId}/thumbnail.jpg`;

            const [updatedVideo] = await db
                .update(videos)
                .set({
                    thumbnailUrl
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