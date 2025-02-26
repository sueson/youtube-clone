import { HomeLayout } from "../../modules/home/ui/layouts/home-layout";

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