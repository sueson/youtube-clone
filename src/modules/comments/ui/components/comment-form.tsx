import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { UserAvatar } from "@/components/user-avatar";
import { useUser, useClerk } from "@clerk/nextjs";
import { z } from "zod";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { trpc } from "@/trpc/client";
import { commentInsertSchema } from "@/db/schema";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormMessage
} from "@/components/ui/form";



interface CommentFormProps {
    videoId: string;
    parentId?: string;
    onSuccess?: () => void;
    onCancel?: () => void;
    variant?: "comment" | "reply";
};

// Define the schema without userId
const commentSchemaWithoutUserId = commentInsertSchema.omit({ userId: true });

export const CommentForm = ({ 
    videoId,
    parentId, 
    onSuccess,
    onCancel,
    variant = "comment",
} : CommentFormProps) => {
    const { user } = useUser();
    const clerk = useClerk();
    const utils = trpc.useUtils();

    const create = trpc.comments.create.useMutation({
        onSuccess: () => {
            utils.comments.getMany.invalidate({ videoId });
            utils.comments.getMany.invalidate({ videoId, parentId });
            form.reset();
            toast.success("Comment added");
            onSuccess?.();
        },
        onError: (error) => {
            toast.error("Something went wrong");

            if(error.data?.code === "UNAUTHORIZED") {
                clerk.openSignIn();
            }
        }
    });

    const form = useForm<z.infer<typeof commentSchemaWithoutUserId>>({
        resolver: zodResolver(commentSchemaWithoutUserId),
        defaultValues: {
            parentId,
            videoId,
            value: "",
        },
    });

    const handleSubmit = (values: z.infer<typeof commentSchemaWithoutUserId>) => {
        create.mutate(values);
    }

    const handleCancel = () => {
        form.reset();
        onCancel?.();
    };

    return (
        <Form {...form}>
            <form 
                onSubmit={form.handleSubmit(handleSubmit)}
                className="flex gap-4 group"
            >
                <UserAvatar 
                    size="lg"
                    imageUrl={user?.imageUrl || "/user-placeholder.svg"}
                    name={user?.username || "User"}
                />
                <div className="flex-1">
                    <FormField 
                        name="value"
                        control={form.control}
                        render={({ field }) => (
                            <FormItem>
                                <FormControl>
                                    <Textarea 
                                        {...field}
                                        placeholder={
                                            variant === "reply"
                                            ? "Reply to this comment..."
                                            : "Add a comment..."
                                        }
                                        className="resize-none bg-transparent overflow-hidden min-h-0"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="flex justify-end gap-2 mt-2">
                        {
                            onCancel && (
                                <Button
                                    variant="ghost"
                                    type="button"
                                    onClick={handleCancel}
                                >
                                    Cancel
                                </Button>
                            )
                        }
                        <Button
                            disabled={create.isPending}
                            type="submit"
                            size="sm"
                        >
                            {
                                variant === "reply" ? "Reply" : "Comment"
                            }
                        </Button>
                    </div>
                </div>
            </form>
        </Form>
    )
}