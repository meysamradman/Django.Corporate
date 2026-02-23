import type { ReactNode } from "react";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/PageHeader/PageHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/elements/Tabs";
import { Button } from "@/components/elements/Button";
import { Loader2, Save } from "lucide-react";
import { cn } from "@/core/utils/cn";

export interface TabbedPageTab {
    id: string;
    label: string;
    icon?: ReactNode;
    content: ReactNode;
    isVisible?: boolean;
}

export interface TabbedPageLayoutProps {
    title: string;
    description?: string;
    showHeader?: boolean;
    activeTab: string;
    onTabChange: (value: string) => void;
    tabs: TabbedPageTab[];
    onSave: () => void;
    isSaving?: boolean;
    saveLabel?: string;
    extraActions?: ReactNode;
    isLoading?: boolean;
    skeleton?: ReactNode;
}

/**
 * TabbedPageLayout
 * A standardized layout for Create, Edit, and Settings pages.
 * Centralizes Header, Tabs, and the Sticky Action Bar.
 */
export function TabbedPageLayout({
    title,
    description,
    showHeader = true,
    activeTab,
    onTabChange,
    tabs,
    onSave,
    isSaving = false,
    saveLabel = "ذخیره",
    extraActions,
    isLoading = false,
    skeleton,
}: TabbedPageLayoutProps) {
    const visibleTabs = tabs.filter((tab) => tab.isVisible !== false);

    return (
        <div className="space-y-6 pb-28 relative">
            {showHeader ? <PageHeader title={title} description={description} /> : null}

            <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
                <TabsList>
                    {visibleTabs.map((tab) => (
                        <TabsTrigger key={tab.id} value={tab.id}>
                            {tab.icon && tab.icon}
                            {tab.label}
                        </TabsTrigger>
                    ))}
                </TabsList>

                {visibleTabs.map((tab) => (
                    <TabsContent key={tab.id} value={tab.id}>
                        <Suspense fallback={skeleton}>
                            {isLoading ? skeleton : tab.content}
                        </Suspense>
                    </TabsContent>
                ))}
            </Tabs>

            <div className={cn(
                "fixed bottom-0 left-0 right-0 z-50",
                "lg:right-[var(--sidebar-width,20rem)]", // Respect sidebar width if defined
                "border-t border-br bg-card shadow-lg transition-all duration-300",
                "flex items-center justify-end gap-3 py-4 px-8"
            )}>
                {extraActions}
                <Button
                    onClick={onSave}
                    size="lg"
                    disabled={isSaving}
                    className="min-w-[120px]"
                >
                    {isSaving ? (
                        <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            در حال ذخیره...
                        </>
                    ) : (
                        <>
                            <Save className="h-5 w-5" />
                            {saveLabel}
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
