import React from "react";
import { Header } from "@/components/layout/Header/Header";

interface MainLayoutProps {
    children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
    return (
        <div className="flex flex-col min-h-screen bg-bg">
            <Header />
            <main className="flex-1">
                <div className="p-4 sm:p-6 lg:p-8 min-w-0">
                    {children}
                </div>
            </main>
        </div>
    );
}