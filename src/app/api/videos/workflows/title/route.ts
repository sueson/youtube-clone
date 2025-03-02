import { db } from "@/db";
import { videos } from "@/db/schema";
import { serve } from "@upstash/workflow/nextjs";
import { and, eq } from "drizzle-orm";


interface InputType {
    userId: string;
    videoId: string;
};

// Generate thumbnail and background jobs
export const { POST } = serve(
    async (context) => {
        const input = context.requestPayload as InputType;
        const { videoId, userId } = input;

        const video = await context.run("get-video", async () => {
            const [existingVideo] = await db
                .select()
                .from(videos)
                .where(and(
                    eq(videos.id, videoId),
                    eq(videos.userId, userId)
                ));
            
                if(!existingVideo) {
                    throw new Error("Not found");
                };

            return existingVideo;
        });

        await context.run("update-video", async () => {
            await db
                .update(videos)
                .set({
                    title: "Updated background job"
                })
                .where(and(
                    eq(videos.id, video.id),
                    eq(videos.userId, video.userId)
                ))
        });
    }
);