import { db } from "@/db";
import { users, videos, videoUpdateSchema } from "@/db/schema";
import { mux } from "@/lib/mux";
import { workflow } from "@/lib/workflow";
import { baseProcedure, createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { and, eq, getTableColumns } from "drizzle-orm";
import { UTApi } from "uploadthing/server";
import { z } from "zod";

// handles video crud operation
export const videosRouter = createTRPCRouter({
    getOne: baseProcedure
        .input(z.object({ id: z.string().uuid() }))
        .query(async ({ input }) => {
            const [existingVideo] = await db
                .select({
                    ...getTableColumns(videos),
                    user: {
                        ...getTableColumns(users)
                    }
                })
                .from(videos)
                .innerJoin(users, eq(videos.id, users.id))
                .where(eq(videos.id, input.id))

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