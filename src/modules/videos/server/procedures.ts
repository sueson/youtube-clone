import { db } from "@/db";
import { videos } from "@/db/schema";
import { mux } from "@/lib/mux";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";



export const videosRouter = createTRPCRouter({
    create: protectedProcedure.mutation(async ({ ctx }) => {
        const { id: userId } = ctx.user;

        const uploadVideo = await mux.video.uploads.create({
            new_asset_settings: {
                passthrough: userId,  // using userId for getting to know which video belongs to which user
                playback_policy: ["public"]
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