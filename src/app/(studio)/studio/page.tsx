import { DEFAULT_LIMIT } from "@/constants";
import { StudioView } from "@/modules/studio/ui/view/studio-view";
import { HydrateClient, trpc } from "@/trpc/server";



const Page = async () => {
    // get many used to load many data so prefetchInfinite would be used
    void trpc.studio.getMany.prefetchInfinite({
        limit: DEFAULT_LIMIT,  // if limit is 5 also the use suspense infinite query limit should be 5
    });

    return (
        <HydrateClient>
            <StudioView />
        </HydrateClient>
    )
};

export default Page;