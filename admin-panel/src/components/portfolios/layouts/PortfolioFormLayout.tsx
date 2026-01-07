import React from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/elements/Tabs";
import { Button } from "@/components/elements/Button";
import {
    FileText, Image, Search,
    Save, Loader2, Settings
} from "lucide-react";

interface PortfolioFormLayoutProps {
    activeTab: string;
    onTabChange: (value: string) => void;
    onSubmit: () => void;
    onSaveDraft?: () => void;
    isPending: boolean;
    isSubmitting: boolean;
    isEditMode: boolean;
    children: React.ReactNode;
}

export const PortfolioFormLayout: React.FC<PortfolioFormLayoutProps> = ({
    activeTab,
    onTabChange,
    onSubmit,
    onSaveDraft,
    isPending,
    isSubmitting,
    isEditMode,
    children
}) => {
    return (
        <div className="space-y-6 pb-28 relative">
            <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
                <TabsList>
                    <TabsTrigger value="account">
                        <FileText className="h-4 w-4" />
                        اطلاعات پایه
                    </TabsTrigger>
                    <TabsTrigger value="media">
                        <Image className="h-4 w-4" />
                        مدیا
                    </TabsTrigger>
                    <TabsTrigger value="seo">
                        <Search className="h-4 w-4" />
                        سئو
                    </TabsTrigger>
                    <TabsTrigger value="extra">
                        <Settings className="h-4 w-4" />
                        ویژگی‌ها و گزینه‌ها
                    </TabsTrigger>
                </TabsList>

                {children}
            </Tabs>

            <div className="fixed bottom-0 left-0 right-0 lg:right-[20rem] z-50 border-t border-br bg-card shadow-lg transition-all duration-300 flex items-center justify-end gap-3 py-4 px-8">
                {onSaveDraft && (
                    <Button
                        variant="outline"
                        onClick={onSaveDraft}
                        disabled={isPending || isSubmitting}
                        size="lg"
                    >
                        {isPending || isSubmitting ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                در حال ذخیره...
                            </>
                        ) : (
                            <>
                                <Save className="h-5 w-5" />
                                ذخیره پیش‌نویس
                            </>
                        )}
                    </Button>
                )}
                <Button
                    onClick={onSubmit}
                    size="lg"
                    disabled={isPending || isSubmitting}
                >
                    {isPending || isSubmitting ? (
                        <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            در حال ذخیره...
                        </>
                    ) : (
                        <>
                            <Save className="h-5 w-5" />
                            {isEditMode ? "به‌روزرسانی نمونه‌کار" : "انتشار نمونه‌کار"}
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
};
