import { DEFAULT_LIMIT } from "@/constants";
import { SubscribedView } from "@/modules/home/ui/views/subscribed-view";
import { HydrateClient, trpc } from "@/trpc/server";


// This line forces the page to be rendered dynamically on each request for prefetch() process or else next build throws error.
export const dynamic = "force-dynamic";


const Page = async () => {
    void trpc.videos.getManySubscribed.prefetchInfinite({ limit: DEFAULT_LIMIT })

  return (
    <div>
        {/* // HydrateClient manages and provides pre-fetched server data to its child components for seamless rendering. */}
        <HydrateClient>
            <SubscribedView />
        </HydrateClient>
    </div>
  );
};


export default Page;
