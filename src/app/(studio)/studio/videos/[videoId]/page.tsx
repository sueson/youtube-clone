import { VideoView } from "@/modules/studio/ui/views/video-view";
import { HydrateClient, trpc } from "@/trpc/server";


// This line forces the page to be rendered dynamically on each request for prefetch() process or else next build throws error.
export const dynamic = "force-dynamic";


interface PageProps {
    params: Promise<{ videoId: string }>;
}


const Page = async ({ params } : PageProps) => {
    const { videoId } = await params;

    void trpc.studio.getOne.prefetch({ id: videoId });
    void trpc.categories.getMany.prefetch();

    return (
        <HydrateClient>
            <VideoView videoId={videoId}/>
        </HydrateClient>
    )
};

export default Page;