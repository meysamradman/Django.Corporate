import { ReactNode } from "react";
import { PageHeader } from "@/components/layout/PageHeader/PageHeader";
import { cn } from "@/core/utils/cn";

export interface DetailPageLayoutProps {
    title: string | ReactNode;
    description?: string;
    headerActions?: ReactNode;

    // Layout Structure
    children: ReactNode; // Main Content
    sidebar?: ReactNode;

    // Optional extras
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
                {/* Main Content Area */}
                <div className={cn(
                    "flex-1 min-w-0 space-y-6",
                    contentClassName
                )}>
                    {children}
                </div>

                {/* Sidebar Area */}
                {sidebar && (
                    <aside className="w-full lg:w-[320px] xl:w-[380px] space-y-6 shrink-0">
                        {sidebar}
                    </aside>
                )}
            </div>
        </div>
    );
}
