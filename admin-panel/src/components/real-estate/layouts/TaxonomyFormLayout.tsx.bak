import React from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/elements/Tabs";
import { Button } from "@/components/elements/Button";
import { Loader2, Save } from "lucide-react";

export interface TaxonomyTab {
    value: string;
    label: string;
    icon: React.ElementType;
}

interface TaxonomyFormLayoutProps {
    activeTab: string;
    onTabChange: (value: string) => void;
    onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
    isPending: boolean;
    isSubmitting: boolean;
    isEditMode: boolean;
    tabs: TaxonomyTab[];
    itemLabel: string;
    formId: string;
    children: React.ReactNode;
}

export const TaxonomyFormLayout: React.FC<TaxonomyFormLayoutProps> = ({
    activeTab,
    onTabChange,
    onSubmit,
    isPending,
    isSubmitting,
    isEditMode,
    tabs,
    itemLabel,
    formId,
    children
}) => {
    return (
        <div className="space-y-6 pb-28 relative">
            <form id={formId} onSubmit={onSubmit} noValidate>
                <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
                    <TabsList>
                        {tabs.map((tab) => (
                            <TabsTrigger key={tab.value} value={tab.value}>
                                <tab.icon className="h-4 w-4" />
                                {tab.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                    {children}
                </Tabs>
            </form>

            <div className="fixed bottom-0 left-0 right-0 lg:right-[20rem] z-50 border-t border-br bg-card shadow-lg transition-all duration-300 flex items-center justify-end gap-3 py-4 px-8">
                <Button
                    type="submit"
                    form={formId}
                    size="lg"
                    disabled={isPending || isSubmitting}
                >
                    {isPending || isSubmitting ? (
                        <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            {isEditMode ? "در حال به‌روزرسانی..." : "در حال ایجاد..."}
                        </>
                    ) : (
                        <>
                            <Save className="h-5 w-5" />
                            {isEditMode ? `به‌روزرسانی ${itemLabel}` : `ایجاد ${itemLabel}`}
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
};
