import { type LucideIcon, Info } from "lucide-react";
import { cn } from "@/core/utils/cn";
import {
    Empty,
    EmptyHeader,
    EmptyTitle,
    EmptyDescription,
    EmptyContent,
    EmptyMedia,
} from "@/components/elements/Empty";

interface EmptyStateProps {
    title: string;
    description?: string;
    icon?: LucideIcon;
    size?: "sm" | "md" | "lg";
    className?: string;
    action?: React.ReactNode;
    fullBleed?: boolean;
    fullHeight?: boolean;
}

export function EmptyState({
    title,
    description,
    icon: Icon = Info,
    size = "md",
    className,
    action,
    fullBleed = false,
    fullHeight = false,
}: EmptyStateProps) {
    const sizeClasses = {
        sm: "py-8 md:py-10",
        md: "py-12 md:py-16",
        lg: "py-20 md:py-32",
    };

    return (
        <Empty
            className={cn(
                "relative overflow-hidden transition-all duration-700",
                !fullHeight && sizeClasses[size],
                fullHeight && "h-full flex items-center justify-center",
                fullBleed ? "rounded-none border-none p-0 w-full" : "bg-bg/10 rounded-2xl",
                className
            )}
        >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-primary/5 blur-[80px] rounded-full pointer-events-none" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-1/5 blur-[60px] rounded-full pointer-events-none" />

            <EmptyContent className="relative z-10">
                <EmptyHeader>
                    <EmptyMedia
                        variant="icon"
                        className={cn(
                            "mb-4 transition-all duration-500 scale-100 group-hover:scale-110",
                            "bg-wt border border-br/60 shadow-2xl shadow-primary/5 animate-in zoom-in-50 duration-700",
                            size === "sm" ? "size-12" : size === "md" ? "size-16" : "size-20"
                        )}
                    >
                        <Icon
                            className={cn(
                                "text-font-s/40 animate-pulse",
                                size === "sm" ? "size-6" : size === "md" ? "size-8" : "size-10"
                            )}
                        />
                    </EmptyMedia>
                    <EmptyTitle className={cn(
                        "font-black text-font-p tracking-tight",
                        size === "sm" ? "text-base" : "text-xl"
                    )}>
                        {title}
                    </EmptyTitle>
                    {description && (
                        <EmptyDescription className="text-font-s/50 font-medium italic">
                            {description}
                        </EmptyDescription>
                    )}
                </EmptyHeader>
                {action && (
                    <div className="mt-4 animate-in fade-in slide-in-from-bottom-2 duration-1000">
                        {action}
                    </div>
                )}
            </EmptyContent>
        </Empty>
    );
}
