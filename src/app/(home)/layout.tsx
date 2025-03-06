import { HomeLayout } from "../../modules/home/ui/layouts/home-layout";


// Because this is a dynamic page not a static page
export const dynamic = "force-dynamic";

interface LayoutProps {
    children: React.ReactNode;
};


const Layout = ({children}: LayoutProps) => {
    return (
        // Navbar wrapper
        <HomeLayout>
            {children}
        </HomeLayout>
    )
}

export default Layout;