import { db } from "@/db";
import { commentReactions } from "@/db/schema";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { and, eq } from "drizzle-orm";
import { z } from "zod";


export const commentReactionsRouter = createTRPCRouter({
    like: protectedProcedure
        .input(z.object({ commentId: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            const { commentId } = input;
            const { id: userId } = ctx.user;

            // only for logged in user and 1 view for 1 user
            const [existingCommentReactionLike] = await db
                .select()
                .from(commentReactions)
                .where(and(
                    eq(commentReactions.commentId, commentId),
                    eq(commentReactions.userId, userId),
                    eq(commentReactions.type, "like")
                ));

                // removing user like, if already there
                if(existingCommentReactionLike) {
                    const [deletedViewerReaction] = await db
                        .delete(commentReactions)
                        .where(
                            and(
                                eq(commentReactions.userId, userId),
                                eq(commentReactions.commentId, commentId)
                            )
                        )
                        .returning();

                    return deletedViewerReaction;
                }

            const [createdCommentReaction] = await db
                .insert(commentReactions)
                .values({ userId, commentId, type: "like" })
                .onConflictDoUpdate({
                    target: [commentReactions.userId, commentReactions.commentId],
                    set: {
                        type: "like"
                    },
                })
                .returning();

            return createdCommentReaction;
        }),
    dislike: protectedProcedure
        .input(z.object({ commentId: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            const { commentId } = input;
            const { id: userId } = ctx.user;

            // only for logged in user and 1 view for 1 user
            const [existingCommentReactionDislike] = await db
                .select()
                .from(commentReactions)
                .where(and(
                    eq(commentReactions.commentId, commentId),
                    eq(commentReactions.userId, userId),
                    eq(commentReactions.type, "dislike")
                ));

                // removing user dislike, if already there
                if(existingCommentReactionDislike) {
                    const [deletedViewerReaction] = await db
                        .delete(commentReactions)
                        .where(
                            and(
                                eq(commentReactions.userId, userId),
                                eq(commentReactions.commentId, commentId)
                            )
                        )
                        .returning();

                    return deletedViewerReaction;
                }
            
            // update new dislike
            const [createdCommentReaction] = await db
                .insert(commentReactions)
                .values({ userId, commentId, type: "dislike" })
                // if already have like then change into dislike
                .onConflictDoUpdate({
                    target: [commentReactions.userId, commentReactions.commentId],
                    set: {
                        type: "dislike"
                    },
                })
                .returning();

            return createdCommentReaction;
        }),
});