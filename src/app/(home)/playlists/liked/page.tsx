import { trpc, HydrateClient } from "@/trpc/server";
import { DEFAULT_LIMIT } from "@/constants";
import { HistoryView } from "@/modules/playlists/ui/views/history-view";



const Page = () => {
    void trpc.playlists.getLiked.prefetchInfinite({ limit: DEFAULT_LIMIT });

    return (
        <HydrateClient>
            <HistoryView />
        </HydrateClient>
    )
};

export default Page;