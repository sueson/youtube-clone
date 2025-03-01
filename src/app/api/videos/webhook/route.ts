import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import {
    VideoAssetCreatedWebhookEvent,
    VideoAssetErroredWebhookEvent,
    VideoAssetReadyWebhookEvent,
    VideoAssetTrackReadyWebhookEvent,
    VideoAssetDeletedWebhookEvent,
} from "@mux/mux-node/resources/webhooks";
import { mux } from "@/lib/mux";
import { db } from "@/db";
import { videos } from "@/db/schema";


const SIGNING_SECRET = process.env.MUX_WEBHOOK_SECRET!;


type WebhookEvent = 
    | VideoAssetCreatedWebhookEvent
    | VideoAssetReadyWebhookEvent
    | VideoAssetErroredWebhookEvent
    | VideoAssetTrackReadyWebhookEvent
    | VideoAssetDeletedWebhookEvent;


// video upload / update using mux webhook
export const POST = async (request: Request) => {
    if(!SIGNING_SECRET) {
        throw new Error("MUX_WEBHOOK_SECRET is not set");
    };

    const headersPayload = await headers();
    const muxSignature = headersPayload.get("mux-signature");

    if(!muxSignature) {
        return new Response("No signature found", { status: 401 });
    };

    const payload = await request.json();
    const body = JSON.stringify(payload);

    mux.webhooks.verifySignature(
        body,
        {
            "mux-signature": muxSignature
        },
        SIGNING_SECRET,
    );

    switch (payload.type as WebhookEvent["type"]) {
        case "video.asset.created" : {
            const data = payload.data as VideoAssetCreatedWebhookEvent["data"];

            if(!data.upload_id) {
                return new Response("No upload id found", { status: 401 });
            };

            await db
                .update(videos)
                .set({
                    muxAssetId: data.id,
                    muxStatus: data.status
                })
                .where(eq(videos.muxUploadId, data.upload_id));
        break;
        }

        case "video.asset.ready" : {
            const data = payload.data as VideoAssetReadyWebhookEvent["data"];
            const playbackId = data.playback_ids?.[0].id;

            if(!data.upload_id) {
                return new Response("Missing uploadId", { status: 400 });
            }

            if(!playbackId) {
                return new Response("Missing playbackId", { status: 400 });
            }

            // create thumbnail using mux and playbackId
            const thumbnailUrl = `https://image.mux.com/${playbackId}/thumbnail.jpg`;

            // create a gif for the video
            const previewUrl = `https://image.mux.com/${playbackId}/animated.gif`;

            // create video duration
            const duration = data.duration ? Math.round(data.duration * 1000) : 0;   // 1000 for because it uses miliunits

            await db
                .update(videos)
                .set({
                    muxStatus: data.status,  // This time the status will be ready
                    muxPlaybackId: playbackId,
                    muxAssetId: data.id,
                    thumbnailUrl,
                    previewUrl,
                    duration
                })
                .where(eq(videos.muxUploadId, data.upload_id));
        break;
        }

        case "video.asset.errored" : {
            const data = payload.data as VideoAssetErroredWebhookEvent["data"];

            if(!data.upload_id) {
                return new Response("Missing uploadId", { status: 400 });
            }

            await db
                .update(videos)
                .set({
                    muxStatus: data.status,
                })
                .where(eq(videos.muxUploadId, data.upload_id));

        break;
        }

        case "video.asset.deleted" : {
            const data = payload.data as VideoAssetDeletedWebhookEvent["data"];

            if(!data.upload_id) {
                return new Response("Missing uploadId", { status: 400 });
            }

            await db
                .delete(videos)
                .where(eq(videos.muxUploadId, data.upload_id));

        break;
        }

        case "video.asset.track.ready" : {
            const data = payload.data as VideoAssetTrackReadyWebhookEvent["data"] & {
                asset_id: string;
            };

            // Typescript incorrectly says that asset_id not exist
            const assetId = data.asset_id;
            const trackId = data.id;
            const status = data.status;

            if(!assetId) {
                return new Response("Missing assetId", { status: 400 });
            }   

            await db
                .update(videos)
                .set({
                    muxTrackId: trackId,
                    muxTrackStatus: status,
                })
                .where(eq(videos.muxAssetId, assetId));

        break;
        }
    }

    return new Response("Webhook received", { status: 200 });  // Webhook always expect a sucess request at end
};