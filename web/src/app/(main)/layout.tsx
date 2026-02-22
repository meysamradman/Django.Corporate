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
import type { HeaderMenuStatusOption, HeaderMenuTypeOption } from "@/components/layout/Header/Menu";
import type { ProvinceCompact } from "@/types/shared/location";

interface MainLayoutProps {
    children: React.ReactNode;
}

function HeaderFallback() {
    return <div className="h-16 md:h-20" />;
}

async function HeaderSlot() {
    let logo: SiteLogo | null = null;
    let statusOptions: HeaderMenuStatusOption[] = [];
    let typeOptions: HeaderMenuTypeOption[] = [];
    let provinceOptions: ProvinceCompact[] = [];

    try {
        const [logoResult, statusesResult, typesResult, provincesResult] = await Promise.allSettled([
            brandingApi.getLogo(),
            realEstateApi.getListingTypes({ page: 1, size: 200 }),
            realEstateApi.getTypes({ page: 1, size: 300 }),
            realEstateApi.getProvinces({ page: 1, size: 200, min_property_count: 1, ordering: "-property_count" }),
        ]);

        if (logoResult.status === 'fulfilled') {
            logo = logoResult.value;
        }

        const states = statusesResult.status === 'fulfilled' ? (statusesResult.value?.data ?? []) : [];
        const usageTypeMap = new Map<string, HeaderMenuStatusOption>();

        states.forEach((item) => {
            const usageType = (item.usage_type || '').trim().toLowerCase();
            const slug = (item.slug || '').trim();
            const label = ((item.name || item.title || item.slug || '') as string).trim();

            if (!usageType || !slug || !label || usageTypeMap.has(usageType)) {
                return;
            }

            usageTypeMap.set(usageType, {
                value: slug,
                label,
            });
        });

        const normalizedStatuses = Array.from(usageTypeMap.values());

        if (normalizedStatuses.length > 0) {
            statusOptions = normalizedStatuses;
        }

        const types = typesResult.status === 'fulfilled' ? (typesResult.value?.data ?? []) : [];
        const normalizedTypes = types
            .map((item) => ({
                value: String(item.slug || '').trim(),
                label: String(item.name || item.title || item.slug || '').trim(),
            }))
            .filter((item) => item.value && item.label)
            .slice(0, 20);

        if (normalizedTypes.length > 0) {
            typeOptions = normalizedTypes;
        }

        const provinces = provincesResult.status === "fulfilled" ? (provincesResult.value?.data ?? []) : [];
        if (provinces.length > 0) {
            provinceOptions = provinces;
        }
    } catch {
        // keep safe defaults
    }

    return <Header logo={logo} statusOptions={statusOptions} typeOptions={typeOptions} provinceOptions={provinceOptions} />;
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