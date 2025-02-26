"use client";

import { 
    SidebarGroup, 
    SidebarGroupContent, 
    SidebarGroupLabel, 
    SidebarMenu, 
    SidebarMenuButton, 
    SidebarMenuItem 
} from "@/components/ui/sidebar";
import { HistoryIcon, ListVideoIcon, ThumbsUpIcon } from "lucide-react";
import Link from "next/link";
import { useAuth, useClerk } from "@clerk/nextjs";


const items = [
    // It only renders for authorized users
    {
        title: "History",
        url: '/playlists/history',
        icon: HistoryIcon,
        auth: true
    },
    // It only renders for authorized users
    {
        title: "Liked videos",
        url: '/playlists/liked',
        icon: ThumbsUpIcon,
        auth: true
    },
    // It only renders for authorized users
    {
        title: "All playlists",
        url: '/playlists',
        icon: ListVideoIcon,
        auth: true
    },
]


// A sidebar content
export const PersonalSection = () => {
    const { isSignedIn } = useAuth();
    const clerk = useClerk();

    return (
        <SidebarGroup>
            <SidebarGroupLabel>
                You
            </SidebarGroupLabel>
            <SidebarGroupContent>
                <SidebarMenu>
                    {items.map((item) => (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                                tooltip={item.title}
                                asChild
                                // Change based on current pathname
                                isActive={false}
                                // if user not signed in and auth is true clerk should open the sign-in modal
                                onClick={(e) => {
                                    if(!isSignedIn && item.auth) {
                                        e.preventDefault();
                                        return clerk.openSignIn();
                                    }
                                }}
                            >
                                <Link href={item.url} className="flex items-center gap-4">
                                    <item.icon />
                                    <span className="text-sm">
                                        {item.title}
                                    </span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    )
}