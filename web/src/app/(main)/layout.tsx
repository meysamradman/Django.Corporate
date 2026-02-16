import React from "react";
import { Header } from "@/components/layout/Header/Header";
import Footer from "@/components/layout/Footer/Footer";
import CopyRight from "@/components/layout/Footer/CopyRight";
import { brandingApi } from "@/api/settings/branding";
import { generalSettingsApi } from "@/api/settings/general";
import { footerApi } from "@/api/settings/footer";
import type { SiteLogo } from "@/types/settings/branding";
import type { PublicGeneralSettings } from "@/types/settings/general";
import type { FooterAboutItem, FooterSectionItem } from "@/types/settings/footer";

interface MainLayoutProps {
    children: React.ReactNode;
}

export default async function MainLayout({ children }: MainLayoutProps) {
    // Server-side fetch for shared layout data (SSR-first website).
    // Keep layout resilient: any endpoint failure falls back to null.
    let logo: SiteLogo | null = null;
    let generalSettings: PublicGeneralSettings | null = null;
    let footerAbout: FooterAboutItem | null = null;
    let footerSections: FooterSectionItem[] = [];

    const results = await Promise.allSettled([
        brandingApi.getLogo(),
        generalSettingsApi.getPublic(),
        footerApi.getAbout(),
        footerApi.getPublic(),
    ]);

    if (results[0].status === 'fulfilled') logo = results[0].value;
    if (results[1].status === 'fulfilled') generalSettings = results[1].value;
    if (results[2].status === 'fulfilled') footerAbout = results[2].value;
    if (results[3].status === 'fulfilled') footerSections = results[3].value;

    return (
        <div className="flex flex-col min-h-screen bg-bg">
            <Header logo={logo} />
            <main className="flex-1">
                {children}
            </main>
            <Footer generalSettings={generalSettings} about={footerAbout} sections={footerSections} />
            <CopyRight
                text={generalSettings?.copyright_text}
                link={generalSettings?.copyright_link}
            />
        </div>
    );
}