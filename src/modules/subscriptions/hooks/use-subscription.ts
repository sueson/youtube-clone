import { toast } from "sonner";
import { useClerk } from "@clerk/nextjs";
import { trpc } from "@/trpc/client";



interface useSubscriptionProps {
    userId: string;
    isSubscribed: boolean;
    fromVideoId?: string;
};


export const useSubscription = ({
    userId,
    isSubscribed,
    fromVideoId
} : useSubscriptionProps) => {
    const clerk = useClerk();
    const utils = trpc.useUtils();

    const subscribe = trpc.subscriptions.create.useMutation({
        onSuccess: () => {
            toast.success("Subscribed");
            utils.videos.getManySubscribed.invalidate();  // used to update without refresh
            utils.users.getOne.invalidate({ id: userId });

            // refetch the no of subscribers
            if(fromVideoId) {
                utils.videos.getOne.invalidate({ id: fromVideoId })
            }
        },
        onError: (error) => {
            toast.error("something went wrong");

            if(error.data?.code === "UNAUTHORIZED") {
                clerk.openSignIn();
            }
        }
    });

    const unSubscribe = trpc.subscriptions.remove.useMutation({
        onSuccess: () => {
            toast.success("unSubscribed");
            utils.videos.getManySubscribed.invalidate();  // used to update without refresh
            utils.users.getOne.invalidate({ id: userId });

            // refetch the no of subscribers
            if(fromVideoId) {
                utils.videos.getOne.invalidate({ id: fromVideoId })
            }
        },
        onError: (error) => {
            toast.error("something went wrong");

            if(error.data?.code === "UNAUTHORIZED") {
                clerk.openSignIn();
            }
        }
    });

    const isPending = subscribe.isPending || unSubscribe.isPending;

    const onClick = () => {
        if(isSubscribed) {
            unSubscribe.mutate({ userId });
        } else {
            subscribe.mutate({ userId });
        };
    };


    return {
        isPending,
        onClick
    }
}