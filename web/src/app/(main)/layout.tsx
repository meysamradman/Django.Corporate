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
import type { HeaderMenuStatusOption } from "@/components/layout/Header/Menu";

interface MainLayoutProps {
    children: React.ReactNode;
}

function HeaderFallback() {
    return <div className="h-16 md:h-20" />;
}

async function HeaderSlot() {
    let logo: SiteLogo | null = null;
    let statusOptions: HeaderMenuStatusOption[] = [];

    const toDealSegment = (value: string): string => {
        const normalized = value.trim().toLowerCase().replace(/[_\s]+/g, '-');
        if (normalized === 'presale') return 'pre-sale';
        return normalized;
    };

    try {
        const [logoResult, statusesResult] = await Promise.allSettled([
            brandingApi.getLogo(),
            realEstateApi.getListingTypes(),
        ]);

        if (logoResult.status === 'fulfilled') {
            logo = logoResult.value;
        }

        const listingTypes = statusesResult.status === 'fulfilled' ? statusesResult.value : [];
        const usageTypeMap = new Map<string, string>();

        (listingTypes ?? []).forEach((item) => {
            const rawUsageType = (item.value || '').trim();
            const rawLabel = (item.label || '').trim();
            const normalizedUsageType = toDealSegment(rawUsageType);

            if (!rawUsageType || !normalizedUsageType || usageTypeMap.has(normalizedUsageType)) {
                return;
            }

            usageTypeMap.set(normalizedUsageType, rawLabel || rawUsageType);
        });

        const normalizedStatuses = Array.from(usageTypeMap.entries()).map(([value, label]) => ({
            value,
            label,
        }));

        if (normalizedStatuses.length > 0) {
            statusOptions = normalizedStatuses;
        }
    } catch {
        // keep safe defaults
    }

    return <Header logo={logo} statusOptions={statusOptions} />;
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