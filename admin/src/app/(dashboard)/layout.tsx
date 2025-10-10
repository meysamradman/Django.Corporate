"use client";

import React from "react";
import {Sidebar} from "@/components/layout/Sidebar/Sidebar";
import {Header} from "@/components/layout/Header/Header";
import {cn} from "@/core/utils/cn";
import {useAdminStore} from "@/components/layout/Sidebar/stores/sidebarStore";

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
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}