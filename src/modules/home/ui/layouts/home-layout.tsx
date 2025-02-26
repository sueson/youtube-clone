import { SidebarProvider } from "@/components/ui/sidebar";
import { HomeNavbar } from "../components/home-navbar";

interface HomeLayoutProps {
    children: React.ReactNode;
};


export const HomeLayout = ({children}: HomeLayoutProps) => {
    return (
        <SidebarProvider>
            <div className="">
                <HomeNavbar />
                <div>
                    {children}
                </div>
            </div>
        </SidebarProvider>
    )
};