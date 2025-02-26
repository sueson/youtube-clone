import { SidebarTrigger } from "@/components/ui/sidebar"
import Image from "next/image"
import Link from "next/link"
import { SearchInput } from "./search-input"


// Navbar component
export const HomeNavbar = () => {
    return (
        <nav className="fixed top-0 left-0 right-0 h-16 bg-white flex items-center px-2 pr-5 z-50">
            <div className="flex items-center gap-4 w-full">
                {/* Menu & Logo */}
                <div className="flex items-center flex-shrink-0">
                    <SidebarTrigger />
                    <Link href="/">
                        <div className="p-4 flex items-center gap-1">
                            <Image 
                                src="/logo.svg"
                                alt="Logo"
                                width={32}
                                height={32}
                            />
                            <p className="text-xl font-semibold tracking-tight">
                                Youtube
                            </p>
                        </div>
                    </Link>
                </div>

                {/* Search bar */}
                <div className="flex-1 flex justify-center mx-auto max-w-[720px]">
                    <SearchInput />
                </div>
            </div>
        </nav>
    )
}