import { DEFAULT_LIMIT } from "@/constants";
import { TrendingView } from "@/modules/home/ui/views/trending-view";
import { HydrateClient, trpc } from "@/trpc/server";


// This line forces the page to be rendered dynamically on each request for prefetch() process or else next build throws error.
export const dynamic = "force-dynamic";


const Page = async () => {
    void trpc.videos.getManyTrending.prefetchInfinite({ limit: DEFAULT_LIMIT })

  return (
    <div>
        {/* // HydrateClient manages and provides pre-fetched server data to its child components for seamless rendering. */}
        <HydrateClient>
            <TrendingView />
        </HydrateClient>
    </div>
  );
};


export default Page;
