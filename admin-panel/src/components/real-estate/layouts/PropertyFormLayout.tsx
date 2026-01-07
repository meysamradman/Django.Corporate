import React from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/elements/Tabs";
import { Button } from "@/components/elements/Button";
import {
    FileText, MapPin, Home, Image, Search, FileJson,
    Save, Loader2
} from "lucide-react";

interface PropertyFormLayoutProps {
    activeTab: string;
    onTabChange: (value: string) => void;
    onSubmit: () => void;
    onSaveDraft?: () => void;
    isPending: boolean;
    isSubmitting: boolean;
    isEditMode: boolean;
    tempFloorPlansCount?: number;
    children: React.ReactNode;
}

export const PropertyFormLayout: React.FC<PropertyFormLayoutProps> = ({
    activeTab,
    onTabChange,
    onSubmit,
    onSaveDraft,
    isPending,
    isSubmitting,
    isEditMode,
    tempFloorPlansCount = 0,
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
                    <TabsTrigger value="location">
                        <MapPin className="h-4 w-4" />
                        لوکیشن
                    </TabsTrigger>
                    <TabsTrigger value="details">
                        <Home className="h-4 w-4" />
                        جزییات و قیمت
                    </TabsTrigger>
                    <TabsTrigger value="floorplans">
                        <Home className="h-4 w-4" />
                        پلان‌ها
                        {tempFloorPlansCount > 0 && (
                            <span className="mr-1 text-xs bg-blue-1 text-white px-1.5 py-0.5 rounded">
                                {tempFloorPlansCount}
                            </span>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="media">
                        <Image className="h-4 w-4" />
                        رسانه
                    </TabsTrigger>
                    <TabsTrigger value="seo">
                        <Search className="h-4 w-4" />
                        سئو
                    </TabsTrigger>
                    <TabsTrigger value="extra">
                        <FileJson className="h-4 w-4" />
                        فیلدهای اضافی
                    </TabsTrigger>
                </TabsList>

                {children}
            </Tabs>

            <div className="fixed bottom-0 left-0 right-0 lg:right-[20rem] z-50 border-t border-br bg-card shadow-lg transition-all duration-300 flex items-center justify-end gap-3 py-4 px-8">
                {isEditMode && onSaveDraft && (
                    <Button
                        variant="outline"
                        onClick={onSaveDraft}
                        disabled={isPending || isSubmitting}
                        className="hidden sm:flex"
                    >
                        <Save className="h-5 w-5" />
                        ذخیره پیش‌نویس
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
                            {isEditMode ? "به‌روزرسانی ملک" : "ذخیره ملک"}
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
};
