import { db } from "@/db";
import { videoReactions } from "@/db/schema";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { and, eq } from "drizzle-orm";
import { z } from "zod";


export const videoReactionsRouter = createTRPCRouter({
    like: protectedProcedure
        .input(z.object({ videoId: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            const { videoId } = input;
            const { id: userId } = ctx.user;

            // only for logged in user and 1 view for 1 user
            const [existingVideoReactionLike] = await db
                .select()
                .from(videoReactions)
                .where(and(
                    eq(videoReactions.videoId, videoId),
                    eq(videoReactions.userId, userId),
                    eq(videoReactions.type, "like")
                ));

                // removing user like, if already there
                if(existingVideoReactionLike) {
                    const [deletedViewerReaction] = await db
                        .delete(videoReactions)
                        .where(
                            and(
                                eq(videoReactions.userId, userId),
                                eq(videoReactions.videoId, videoId)
                            )
                        )
                        .returning();

                    return deletedViewerReaction;
                }

            const [createdVideoReaction] = await db
                .insert(videoReactions)
                .values({ userId, videoId, type: "like" })
                .onConflictDoUpdate({
                    target: [videoReactions.userId, videoReactions.videoId],
                    set: {
                        type: "like"
                    },
                })
                .returning();

            return createdVideoReaction;
        }),
    dislike: protectedProcedure
        .input(z.object({ videoId: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            const { videoId } = input;
            const { id: userId } = ctx.user;

            // only for logged in user and 1 view for 1 user
            const [existingVideoReactionDislike] = await db
                .select()
                .from(videoReactions)
                .where(and(
                    eq(videoReactions.videoId, videoId),
                    eq(videoReactions.userId, userId),
                    eq(videoReactions.type, "dislike")
                ));

                // removing user dislike, if already there
                if(existingVideoReactionDislike) {
                    const [deletedViewerReaction] = await db
                        .delete(videoReactions)
                        .where(
                            and(
                                eq(videoReactions.userId, userId),
                                eq(videoReactions.videoId, videoId)
                            )
                        )
                        .returning();

                    return deletedViewerReaction;
                }
            
            // update new dislike
            const [createdVideoReaction] = await db
                .insert(videoReactions)
                .values({ userId, videoId, type: "dislike" })
                // if already have like then change into dislike
                .onConflictDoUpdate({
                    target: [videoReactions.userId, videoReactions.videoId],
                    set: {
                        type: "dislike"
                    },
                })
                .returning();

            return createdVideoReaction;
        }),
});