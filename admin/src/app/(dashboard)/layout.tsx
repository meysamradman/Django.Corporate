"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {Sidebar} from "@/components/layout/Sidebar/Sidebar";
import {Header} from "@/components/layout/Header/Header";
import {cn} from "@/core/utils/cn";
import {useAdminStore} from "@/components/layout/Sidebar/stores/sidebarStore";
import { RoutePermissionGuard } from "@/core/permissions/components/RoutePermissionGuard";
import { MediaContextProvider } from "@/components/media/MediaContext";
import { PermissionProvider } from "@/core/permissions/context/PermissionContext";
import { FloatingAIChat } from "@/components/ai/chat/FloatingAIChat";
import { AIChatProvider } from "@/components/ai/chat/AIChatContext";

interface MainLayoutProps {
    children: React.ReactNode;
}

export default function MainLayout({children}: MainLayoutProps) {
    const pathname = usePathname();
    const [isMounted, setIsMounted] = useState(false);
    const {
        sidebarOpen,
        contentCollapsed,
        selectedItemHasSubMenu,
        toggleSidebar,
        toggleContent,
        setSidebarOpen
    } = useAdminStore();

    // جلوگیری از hydration mismatch
    useEffect(() => {
        setIsMounted(true);
    }, []);

    // بستن sidebar در موبایل هنگام تغییر route (نه در mount اولیه)
    const prevPathnameRef = React.useRef(pathname);
    useEffect(() => {
        if (isMounted && typeof window !== 'undefined') {
            const isMobile = window.innerWidth < 1024; // lg breakpoint
            const pathnameChanged = prevPathnameRef.current !== pathname;
            
            // فقط اگر pathname واقعاً تغییر کرده باشد (نه در mount اولیه)
            if (pathnameChanged && isMobile && sidebarOpen) {
                setSidebarOpen(false);
            }
            
            prevPathnameRef.current = pathname;
        }
    }, [pathname, setSidebarOpen, sidebarOpen, isMounted]);

    return (
        <PermissionProvider>
            <AIChatProvider>
        <div className="flex h-screen overflow-hidden">
            <Sidebar
                isOpen={sidebarOpen}
                onToggle={toggleSidebar}
                isContentCollapsed={contentCollapsed}
                onContentToggle={toggleContent}
            />
            <div className={cn(
                "flex flex-col flex-1 min-w-0 transition-all duration-300",
                contentCollapsed ? "lg:mr-14" : "lg:mr-80"
            )}>
                <Header
                    onMenuClick={toggleSidebar}
                    isContentCollapsed={contentCollapsed}
                    onContentToggle={toggleContent}
                    hasSubMenu={selectedItemHasSubMenu}
                />
                <main className="flex-1 overflow-y-auto overflow-x-hidden min-w-0">
                    <div className="p-4 sm:p-6 lg:p-8 min-w-0">
                        <MediaContextProvider>
                            <RoutePermissionGuard>
                                {children}
                            </RoutePermissionGuard>
                        </MediaContextProvider>
                    </div>
                </main>
                <FloatingAIChat />
            </div>
        </div>
            </AIChatProvider>
        </PermissionProvider>
    );
}