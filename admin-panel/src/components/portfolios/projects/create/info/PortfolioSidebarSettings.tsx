import type { UseFormReturn } from "react-hook-form";
import { Switch } from "@/components/elements/Switch";
import { Item, ItemContent, ItemTitle, ItemDescription, ItemActions } from "@/components/elements/Item";
import { Eye, CheckCircle, Star, FileText } from "lucide-react";
import type { PortfolioFormValues } from "@/components/portfolios/validations/portfolioSchema";

interface PortfolioSidebarSettingsProps {
    form?: UseFormReturn<PortfolioFormValues>;
    formData?: any;
    handleInputChange?: (field: string, value: any) => void;
    editMode: boolean;
    isFormApproach: boolean;
}

export function PortfolioSidebarSettings({
    form,
    formData,
    handleInputChange,
    editMode,
    isFormApproach
}: PortfolioSidebarSettingsProps) {
    const { watch, setValue } = isFormApproach && form
        ? form
        : { watch: null, setValue: null };

    return (
        <div className="space-y-4 pt-4 border-t border-br">
            <Item variant="default" size="default" className="py-4 rounded-xl border border-blue-1/30 bg-blue-0/20 hover:border-blue-1/50 transition-colors">
                <div className="ml-4 p-2 bg-blue rounded-lg">
                    <Eye className="w-5 h-5 stroke-blue-2" />
                </div>
                <ItemContent>
                    <ItemTitle className="text-blue-2">نمایش عمومی</ItemTitle>
                    <ItemDescription className="text-xs">
                        اگر غیرفعال باشد نمونه‌کار در سایت نمایش داده نمی‌شود.
                    </ItemDescription>
                </ItemContent>
                <ItemActions>
                    <Switch
                        checked={isFormApproach ? (watch?.("is_public" as any) ?? true) as boolean : (formData?.is_public ?? true)}
                        disabled={!editMode}
                        onCheckedChange={(checked) => {
                            if (isFormApproach && setValue) {
                                setValue("is_public" as any, checked);
                            } else {
                                handleInputChange?.("is_public", checked);
                            }
                        }}
                    />
                </ItemActions>
            </Item>

            <Item variant="default" size="default" className="py-4 rounded-xl border border-green-1/30 bg-green-0/20 hover:border-green-1/50 transition-colors">
                <div className="ml-4 p-2 bg-green rounded-lg">
                    <CheckCircle className="w-5 h-5 stroke-green-2" />
                </div>
                <ItemContent>
                    <ItemTitle className="text-green-2">وضعیت فعال</ItemTitle>
                    <ItemDescription className="text-xs">
                        با غیرفعال شدن، نمونه‌کار از لیست مدیریت نیز مخفی می‌شود.
                    </ItemDescription>
                </ItemContent>
                <ItemActions>
                    <Switch
                        checked={isFormApproach ? (watch?.("is_active" as any) ?? true) as boolean : (formData?.is_active ?? true)}
                        disabled={!editMode}
                        onCheckedChange={(checked) => {
                            if (isFormApproach && setValue) {
                                setValue("is_active" as any, checked);
                            } else {
                                handleInputChange?.("is_active", checked);
                            }
                        }}
                    />
                </ItemActions>
            </Item>

            <Item variant="default" size="default" className="py-4 rounded-xl border border-orange-1/30 bg-orange-0/20 hover:border-orange-1/50 transition-colors">
                <div className="ml-4 p-2 bg-orange rounded-lg">
                    <Star className="w-5 h-5 stroke-orange-2" />
                </div>
                <ItemContent>
                    <ItemTitle className="text-orange-2">وضعیت ویژه</ItemTitle>
                    <ItemDescription className="text-xs">
                        نمونه‌کارهای ویژه در بخش‌های خاص سایت با اولویت نمایش داده می‌شوند.
                    </ItemDescription>
                </ItemContent>
                <ItemActions>
                    <Switch
                        checked={isFormApproach ? (watch?.("is_featured" as any) ?? false) as boolean : (formData?.is_featured ?? false)}
                        disabled={!editMode}
                        onCheckedChange={(checked) => {
                            if (isFormApproach && setValue) {
                                setValue("is_featured" as any, checked);
                            } else {
                                handleInputChange?.("is_featured", checked);
                            }
                        }}
                    />
                </ItemActions>
            </Item>

            <Item variant="default" size="default" className="py-4 rounded-xl border border-purple-1/30 bg-purple-0/20 hover:border-purple-1/50 transition-colors">
                <div className="ml-4 p-2 bg-purple rounded-lg">
                    <FileText className="w-5 h-5 stroke-purple-2" />
                </div>
                <ItemContent>
                    <ItemTitle className="text-purple-2">منتشر شده</ItemTitle>
                    <ItemDescription className="text-xs">
                        نمونه‌کار منتشر شده برای عموم قابل مشاهده است.
                    </ItemDescription>
                </ItemContent>
                <ItemActions>
                    <Switch
                        checked={isFormApproach ? (watch?.("status" as any) === "published") as boolean : (formData?.status === "published")}
                        disabled={!editMode}
                        onCheckedChange={(checked) => {
                            if (isFormApproach && setValue) {
                                setValue("status" as any, checked ? "published" : "draft");
                            } else {
                                handleInputChange?.("status", checked ? "published" : "draft");
                            }
                        }}
                    />
                </ItemActions>
            </Item>
        </div>
    );
}
