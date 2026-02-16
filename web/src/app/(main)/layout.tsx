import React from "react";
import { Header } from "@/components/layout/Header/Header";
import Footer from "@/components/layout/Footer/Footer";
import CopyRight from "@/components/layout/Footer/CopyRight";
import { brandingApi } from "@/api/settings/branding";
import { generalSettingsApi } from "@/api/settings/general";
import type { SiteLogo } from "@/types/settings/branding";
import type { PublicGeneralSettings } from "@/types/settings/general";

interface MainLayoutProps {
    children: React.ReactNode;
}

export default async function MainLayout({ children }: MainLayoutProps) {
    // Server-side fetch for shared layout data (logo) to speed up first paint.
    // Header remains a client component only for pathname-based styling.
    let logo: SiteLogo | null = null;
    try {
        logo = await brandingApi.getLogo();
    } catch {
        logo = null;
    }

    let generalSettings: PublicGeneralSettings | null = null;
    try {
        generalSettings = await generalSettingsApi.getPublic();
    } catch {
        generalSettings = null;
    }

    return (
        <div className="flex flex-col min-h-screen bg-bg">
            <Header logo={logo} />
            <main className="flex-1">
                {children}
            </main>
             <Footer />
            <CopyRight
                text={generalSettings?.copyright_text}
                link={generalSettings?.copyright_link}
            />
        </div>
    );
}