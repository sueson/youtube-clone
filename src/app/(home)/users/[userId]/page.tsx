import { UserView } from "@/modules/users/ui/views/user-view";
import { HydrateClient, trpc } from "@/trpc/server";


// Because this is a dynamic page not a static page
export const dynamic = "force-dynamic";


interface PageProps {
    params: Promise<{
        userId: string;
    }>
};


const Page = async ({ params }: PageProps) => {
    const { userId } = await params;

    void trpc.users.getOne.prefetch({ id: userId });

    return (
        <HydrateClient>
            <UserView userId={userId}/>
        </HydrateClient>
    )
};

export default Page;