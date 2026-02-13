import type { ReactNode } from "react";
import { PageHeader } from "@/components/layout/PageHeader/PageHeader";
import { cn } from "@/core/utils/cn";

export interface DetailPageLayoutProps {
    title: string | ReactNode;
    description?: string;
    headerActions?: ReactNode;

    children: ReactNode; // Main Content
    sidebar?: ReactNode;

    className?: string;
    contentClassName?: string;
    containerClassName?: string;
}

/**
 * DetailPageLayout
 * A standardized layout for Detail/View pages.
 * Features a PageHeader, a Main Content area, and an optional Sidebar.
 */
export function DetailPageLayout({
    title,
    description,
    headerActions,
    children,
    sidebar,
    className,
    contentClassName,
    containerClassName,
}: DetailPageLayoutProps) {
    return (
        <div className={cn("space-y-6", className)}>
            <PageHeader title={title} description={description}>
                {headerActions}
            </PageHeader>

            <div className={cn(
                "flex flex-col lg:flex-row gap-6",
                containerClassName
            )}>
                <div className={cn(
                    "flex-1 min-w-0 space-y-6",
                    contentClassName
                )}>
                    {children}
                </div>

                {sidebar && (
                    <aside className="w-full lg:w-[320px] xl:w-[380px] space-y-6 shrink-0">
                        {sidebar}
                    </aside>
                )}
            </div>
        </div>
    );
}
