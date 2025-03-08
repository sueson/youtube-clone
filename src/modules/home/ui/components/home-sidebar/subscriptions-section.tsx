"use client";

import { 
    SidebarGroup, 
    SidebarGroupContent, 
    SidebarGroupLabel, 
    SidebarMenu, 
    SidebarMenuButton, 
    SidebarMenuItem 
} from "@/components/ui/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { trpc } from "@/trpc/client";
import { DEFAULT_LIMIT } from "@/constants";
import { UserAvatar } from "@/components/user-avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ListIcon } from "lucide-react";


export const LoadingSkeleton = () => {
    return (
        <>
            {[1, 2, 3, 4, 5].map((i) => (
                <SidebarMenuItem key={i}>
                    <SidebarMenuButton disabled>
                        <Skeleton className="size-6 rounded-full shrink-0"/>
                        <Skeleton className="h-4 w-full"/>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            ))}
        </>
    )
};


// A sidebar content
export const SubscriptionsSection = () => {
    const pathname = usePathname();
    const { data, isLoading } = trpc.subscriptions.getMany.useInfiniteQuery({
        limit: DEFAULT_LIMIT,
    }, {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
    });

    return (
        <SidebarGroup>
            <SidebarGroupLabel>
                Subscribers
            </SidebarGroupLabel>
            <SidebarGroupContent>
                <SidebarMenu>
                    {isLoading && <LoadingSkeleton />}
                    {!isLoading && data?.pages.flatMap((page) => page.items).map((subscription) => (
                        <SidebarMenuItem key={`${subscription.creatorId}-${subscription.viewerId}`}>
                            <SidebarMenuButton
                                tooltip={subscription.user.name}
                                asChild
                                // Change active bar based on current pathname
                                isActive={pathname === `/users/${subscription.user.id}`}
                            >
                                <Link href={`/users/${subscription.user.id}`} className="flex items-center gap-4">
                                    <UserAvatar 
                                        size="xs"
                                        imageUrl={subscription.user.imageUrl}
                                        name={subscription.user.name}
                                    />
                                    <span className="text-sm">
                                        {subscription.user.name}
                                    </span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                    {!isLoading && (
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                asChild
                                isActive={pathname === "/subscriptions"}
                            >
                                <Link href="/subscriptions" className="flex items-center gap-4">
                                    <ListIcon className="size-4"/>
                                    <span className="text-sm">All subscribers</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    )}
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    )
};