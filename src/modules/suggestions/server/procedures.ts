import { db } from "@/db";
import { videos } from "@/db/schema";
import { baseProcedure, createTRPCRouter} from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { eq, and, or, lt, desc } from "drizzle-orm";
import { z } from "zod";



export const suggestionsRouter = createTRPCRouter({
    getMany: baseProcedure
    .input(
        // required
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
    .query(async ({ input }) => {
        const { videoId, cursor, limit } = input;

        const [existingVideo] = await db
            .select()
            .from(videos)
            .where(eq(videos.id, videoId))

            if(!existingVideo) {
                throw new TRPCError({ code: "NOT_FOUND" });
            };

        const data = await db
            .select()
            .from(videos)
            .where(and(
                existingVideo.categoryId
                ? eq(videos.categoryId, existingVideo.categoryId)
                : undefined,
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