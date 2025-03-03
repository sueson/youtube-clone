import { cn } from "@/lib/utils";
import { Button, ButtonProps } from "@/components/ui/button";


interface SubscriptionButtonProps {
    onClick: ButtonProps["onClick"];
    disabled: boolean;
    isSubscriped: boolean;
    className?: string;
    size?: ButtonProps["size"];
};


export const SubscriptionButton = ({
    onClick,
    disabled,
    isSubscriped,
    className,
    size
} : SubscriptionButtonProps) => {
    return (
        <Button
            size={size}
            variant={isSubscriped ? "secondary" : "default"}
            className={cn("rounded-full", className)}
            onClick={onClick}
            disabled={disabled}
        >
            {
                isSubscriped ? "Unsubscribe" : "Subscribe"
            }
        </Button>
    )
};