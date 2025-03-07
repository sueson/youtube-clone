import { trpc, HydrateClient } from "@/trpc/server";
import { DEFAULT_LIMIT } from "@/constants";
import { LikedView } from "@/modules/playlists/ui/views/liked-view";



const Page = () => {
    void trpc.playlists.getLiked.prefetchInfinite({ limit: DEFAULT_LIMIT });

    return (
        <HydrateClient>
            <LikedView />
        </HydrateClient>
    )
};

export default Page;