import { HomeView } from "@/modules/home/ui/views/home-view";
import { HydrateClient, trpc } from "@/trpc/server";


// This line forces the page to be rendered dynamically on each request for prefetch() process or else next build throws error.
export const dynamic = "force-dynamic";


interface PageProps {
    searchParams: Promise<{
        categoryId?: string;
    }>
};

const Page = async ({ searchParams } : PageProps) => {
    const { categoryId } = await searchParams;

    void trpc.categories.getMany.prefetch();

  return (
    <div>
        {/* // HydrateClient manages and provides pre-fetched server data to its child components for seamless rendering. */}
        <HydrateClient>
            <HomeView categoryId={categoryId}/>
        </HydrateClient>
    </div>
  );
};


export default Page;
