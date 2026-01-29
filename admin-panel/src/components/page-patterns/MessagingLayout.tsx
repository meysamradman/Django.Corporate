import type { ReactNode } from "react";
import { cn } from "@/core/utils/cn";

export interface MessagingLayoutProps {
    /** Navigation sidebar (Folders, Statuses, etc.) */
    sidebar: ReactNode;
    /** Area for search, filters, and global actions */
    toolbar?: ReactNode;
    /** The main content (List of messages or the Detail view) */
    children: ReactNode;
    /** Place any Dialogs/Modals here so they don't interfere with the layout flow */
    dialogs?: ReactNode;
    /** Optional class for the outer container */
    className?: string;
    /** Optional custom width for the sidebar, defaults to 16rem (w-64) */
    sidebarWidth?: string;
}

/**
 * MessagingLayout
 * A standardized layout for "Mailbox/Master-Detail" style applications.
 * Features a fixed-height container, a persistent sidebar, and a scrollable content area.
 */
export function MessagingLayout({
    sidebar,
    toolbar,
    children,
    dialogs,
    className,
    sidebarWidth = "w-64"
}: MessagingLayoutProps) {
    return (
        <div className={cn(
            "flex h-[calc(100vh-8rem)] bg-card overflow-hidden border shadow-[rgb(0_0_0/2%)_0px_6px_24px_0px,rgb(0_0_0/2%)_0px_0px_0px_1px] rounded-xl",
            className
        )}>
            {/* Sidebar Navigation */}
            <div className={cn(
                sidebarWidth,
                "shrink-0 h-full overflow-hidden bg-card border-l"
            )}>
                {sidebar}
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                {/* Header / Toolbar (Search, Bulk Actions, Refresh) */}
                {toolbar && (
                    <div className="border-b p-4 shrink-0 bg-card/60 backdrop-blur-sm z-10 sticky top-0">
                        {toolbar}
                    </div>
                )}

                {/* Content Area (Ticket/Email List or Detail View) */}
                <div className="flex-1 flex flex-col overflow-hidden transition-all duration-300">
                    {children}
                </div>
            </div>

            {/* Popups, Dialogs, and Modals */}
            {dialogs}
        </div>
    );
}
