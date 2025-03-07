import { trpc, HydrateClient } from "@/trpc/server";
import { DEFAULT_LIMIT } from "@/constants";
import { HistoryView } from "@/modules/playlists/ui/views/history-views";



const Page = () => {
    void trpc.playlists.getHistory.prefetchInfinite({ limit: DEFAULT_LIMIT });

    return (
        <HydrateClient>
            <HistoryView />
        </HydrateClient>
    )
};

export default Page;