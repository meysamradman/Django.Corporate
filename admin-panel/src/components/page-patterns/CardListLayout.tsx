import type { ReactNode } from "react";
import { PageHeader } from "@/components/layout/PageHeader/PageHeader";
import { Loader } from "@/components/elements/Loader";
import { cn } from "@/core/utils/cn";

export interface CardListLayoutProps {
    title: string;
    description?: string;
    headerActions?: ReactNode;

    // Filters area
    filters?: ReactNode;
    stats?: string | ReactNode;

    // Main content
    isLoading?: boolean;
    isEmpty?: boolean;
    emptyMessage?: string;
    children: ReactNode; // The grid or table

    // Footer
    pagination?: ReactNode;

    className?: string;
    contentClassName?: string;
}

/**
 * CardListLayout
 * A standardized layout for List pages (Admins, Agencies, Users, etc.)
 * Centralizes Header, Filter Bar, Content Grid, and Pagination.
 */
export function CardListLayout({
    title,
    description,
    headerActions,
    filters,
    stats,
    isLoading = false,
    isEmpty = false,
    emptyMessage = "موردی یافت نشد",
    children,
    pagination,
    className,
    contentClassName,
}: CardListLayoutProps) {
    return (
        <div className={cn("space-y-6", className)}>
            <PageHeader title={title} description={description}>
                {headerActions}
            </PageHeader>

            {/* Filters & Stats Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-2">
                <div className="flex items-center gap-3 flex-wrap flex-1 justify-start">
                    {filters}
                </div>

                {stats && (
                    <div className="text-sm font-medium text-font-p whitespace-nowrap">
                        {stats}
                    </div>
                )}
            </div>

            {/* Content Area */}
            <div className={cn("min-h-[400px] relative", contentClassName)}>
                {isLoading ? (
                    <div className="flex items-center justify-center py-24">
                        <Loader />
                    </div>
                ) : isEmpty ? (
                    <div className="text-center py-24 bg-card rounded-xl border border-dashed border-br">
                        <p className="text-font-s">{emptyMessage}</p>
                    </div>
                ) : (
                    <>
                        {children}
                        {pagination && (
                            <div className="mt-8">
                                {pagination}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
