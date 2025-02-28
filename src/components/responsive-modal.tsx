import { useIsMobile } from "@/hooks/use-mobile";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";


interface ReponsiveModalProps {
    children: React.ReactNode;
    open: boolean;
    title: string;
    onOpenChange: (open: boolean) => void;
};


// Responsive modal for upload video (mobile and desktop)
export const ResponsiveModal = ({
    children,
    open,
    title,
    onOpenChange
} : ReponsiveModalProps) => {
    const isMobile = useIsMobile();  // shadcn hook

    if(isMobile) {
        return (
            <Drawer open={open} onOpenChange={onOpenChange}>
                <DrawerContent>
                    <DrawerHeader>
                        <DrawerTitle>
                            {title}
                        </DrawerTitle>
                    </DrawerHeader>
                    {children}
                </DrawerContent>
            </Drawer>
        )
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {title}
                    </DialogTitle>
                </DialogHeader>
                {children}
            </DialogContent>
        </Dialog>
    );
};