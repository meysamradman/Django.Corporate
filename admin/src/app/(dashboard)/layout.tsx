"use client";

import React from "react";
import {Sidebar} from "@/components/layout/Sidebar/Sidebar";
import {Header} from "@/components/layout/Header/Header";
import {cn} from "@/core/utils/cn";
import {useAdminStore} from "@/components/layout/Sidebar/stores/sidebarStore";
import { RoutePermissionGuard } from "@/core/permissions/components/RoutePermissionGuard";
import { MediaContextProvider } from "@/core/media/MediaContext";
import { PermissionProvider } from "@/core/permissions/context/PermissionContext";
import { FloatingAIChat } from "@/components/ai/chat/FloatingAIChat";

interface MainLayoutProps {
    children: React.ReactNode;
}

export default function MainLayout({children}: MainLayoutProps) {
    const {
        sidebarOpen,
        contentCollapsed,
        selectedItemHasSubMenu,
        toggleSidebar,
        toggleContent
    } = useAdminStore();

    return (
        <div className="flex grow">
            <Sidebar
                isOpen={sidebarOpen}
                onToggle={toggleSidebar}
                isContentCollapsed={contentCollapsed}
                onContentToggle={toggleContent}
            />
            <div className={cn(
                "flex flex-col grow transition-all duration-300",
                contentCollapsed ? "lg:mr-14" : "lg:mr-80"
            )}>
                <Header
                    onMenuClick={toggleSidebar}
                    isContentCollapsed={contentCollapsed}
                    onContentToggle={toggleContent}
                    hasSubMenu={selectedItemHasSubMenu}
                />
                <main className="flex flex-1 m-8">
                    <div
                        className={cn(
                            "grow transition-[max-width] duration-300 ease-in-out",
                            contentCollapsed
                                ? "max-w-full"
                                : ""
                        )}
                    >
                        <PermissionProvider>
                            <MediaContextProvider>
                                <RoutePermissionGuard>
                                    {children}
                                </RoutePermissionGuard>
                            </MediaContextProvider>
                        </PermissionProvider>
                    </div>
                </main>
                {/* Floating AI Chat Widget */}
                <FloatingAIChat />
            </div>
        </div>
    );
}