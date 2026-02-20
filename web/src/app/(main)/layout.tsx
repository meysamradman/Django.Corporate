import React, { Suspense } from "react";
import { Header } from "@/components/layout/Header/Header";
import Footer from "@/components/layout/Footer/Footer";
import CopyRight from "@/components/layout/Footer/CopyRight";
import { brandingApi } from "@/api/settings/branding";
import { generalSettingsApi } from "@/api/settings/general";
import { footerApi } from "@/api/settings/footer";
import { chatbotApi } from "@/api/chatbot/route";
import { realEstateApi } from "@/api/real-estate/route";
import { ChatbotWidget } from "@/components/chatbot/ChatbotWidget";
import type { SiteLogo } from "@/types/settings/branding";
import type { PublicGeneralSettings } from "@/types/settings/general";
import type { FooterAboutItem, FooterSectionItem } from "@/types/settings/footer";
import type { PublicChatbotSettings } from "@/types/chatbot/chatbot";

interface MainLayoutProps {
    children: React.ReactNode;
}

function HeaderFallback() {
    return <div className="h-16 md:h-20" />;
}

async function HeaderSlot() {
    let logo: SiteLogo | null = null;
    let typeOptions: Array<{ value: string; label: string; slug?: string }> = [];

    try {
        const [logoResponse, typesResponse] = await Promise.all([
            brandingApi.getLogo(),
            realEstateApi.getTypes({ page: 1, size: 50 }).catch(() => null),
        ]);

        logo = logoResponse;
        typeOptions = (typesResponse?.data ?? []).map((item) => ({
            value: String(item.id),
            label: item.name,
            slug: item.slug,
        }));
    } catch {
        logo = null;
    }

    return <Header logo={logo} typeOptions={typeOptions} />;
}

function FooterFallback() {
    return <div className="h-20" />;
}

async function FooterSlot() {
    let generalSettings: PublicGeneralSettings | null = null;
    let footerAbout: FooterAboutItem | null = null;
    let footerSections: FooterSectionItem[] = [];
    let chatbotSettings: PublicChatbotSettings | null = null;

    const results = await Promise.allSettled([
        generalSettingsApi.getPublic(),
        footerApi.getAbout(),
        footerApi.getPublic(),
        chatbotApi.getSettings(),
    ]);

    if (results[0].status === 'fulfilled') generalSettings = results[0].value;
    if (results[1].status === 'fulfilled') footerAbout = results[1].value;
    if (results[2].status === 'fulfilled') footerSections = results[2].value;
    if (results[3].status === 'fulfilled') chatbotSettings = results[3].value;

    return (
        <>
            <ChatbotWidget initialSettings={chatbotSettings} />
            <Footer generalSettings={generalSettings} about={footerAbout} sections={footerSections} />
            <Suspense fallback={<div className="bg-cprt h-20" />}>
                <CopyRight
                    text={generalSettings?.copyright_text}
                    link={generalSettings?.copyright_link}
                />
            </Suspense>
        </>
    );
}

export default function MainLayout({ children }: MainLayoutProps) {
    return (
        <div className="flex flex-col min-h-screen bg-bg">
            <Suspense fallback={<HeaderFallback />}>
                <HeaderSlot />
            </Suspense>

            <main className="flex-1">{children}</main>

            <Suspense fallback={<FooterFallback />}>
                <FooterSlot />
            </Suspense>
        </div>
    );
}