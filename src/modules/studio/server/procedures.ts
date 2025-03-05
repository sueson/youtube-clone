import { db } from "@/db";
import { videos } from "@/db/schema";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { eq, and, or, lt, desc } from "drizzle-orm";
import { z } from "zod";



// This router allows authorized users to fetch their videos with pagination. 
// The `getMany` procedure supports an optional cursor and a limit (1-100). 
// It retrieves videos ordered by the last updated date and provides a next cursor if more videos are available.
export const studioRouter = createTRPCRouter({
    // only authorized users can access their video
    // To get a specific video id when click the video
    getOne: protectedProcedure
        .input(z.object({ id: z.string().uuid() }))
        .query(async ({ ctx, input }) => {
            const {id: userId} = ctx.user;  // user from database
            const { id } = input;

            const [video] = await db
                .select()
                .from(videos)
                .where(and(
                    eq(videos.id, id),
                    eq(videos.userId, userId)
                ));

                if(!video) {
                    throw new TRPCError({ code: "NOT_FOUND" });
                };

            return video;
        }),
    // To get all videos which uploaded by author
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
        const { cursor, limit } = input;
        const { id: userId } = ctx.user;

        const data = await db
            .select()
            .from(videos)
            .where(and(
                eq(videos.userId, userId),
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
    })
})