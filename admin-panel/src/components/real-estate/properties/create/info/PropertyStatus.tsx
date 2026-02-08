
import type { UseFormReturn } from "react-hook-form";
import { Switch } from "@/components/elements/Switch";
import { Eye, CheckCircle, Star, FileText } from "lucide-react";
import { Item, ItemContent, ItemTitle, ItemDescription, ItemActions } from "@/components/elements/Item";
import type { PropertyFormValues } from "@/components/real-estate/validations/propertySchema";

interface PropertyStatusProps {
    form?: UseFormReturn<PropertyFormValues>;
    formData?: any;
    handleInputChange?: (field: string, value: any) => void;
    editMode: boolean;
    isFormApproach: boolean;
}

export function PropertyStatus({ form, formData, handleInputChange, editMode, isFormApproach }: PropertyStatusProps) {
    const { watch, setValue } = isFormApproach && form
        ? form
        : { watch: null, setValue: null };

    const handleSwitchChange = (field: "is_public" | "is_active" | "is_featured" | "is_published", checked: boolean) => {
        if (isFormApproach && setValue) {
            setValue(field, checked, { shouldValidate: false });
        } else {
            handleInputChange?.(field, checked);
        }
    };

    return (
        <div className="space-y-4 pt-4 border-t border-br">
            {/* Public Status - Blue */}
            <Item variant="default" size="default" className="py-4 rounded-xl border border-blue-1/30 bg-blue-0/20 hover:border-blue-1/50 transition-colors">
                <div className="ml-4 p-2 bg-blue rounded-lg">
                    <Eye className="w-5 h-5 stroke-blue-2" />
                </div>
                <ItemContent>
                    <ItemTitle className="text-blue-2">نمایش عمومی</ItemTitle>
                    <ItemDescription className="text-xs">
                        اگر غیرفعال باشد ملک در سایت نمایش داده نمی‌شود.
                    </ItemDescription>
                </ItemContent>
                <ItemActions>
                    <Switch
                        checked={isFormApproach ? (watch?.("is_public") ?? true) : (formData?.is_public ?? true)}
                        disabled={!editMode}
                        onCheckedChange={(checked) => handleSwitchChange("is_public", checked)}
                    />
                </ItemActions>
            </Item>

            {/* Active Status - Green */}
            <Item variant="default" size="default" className="py-4 rounded-xl border border-green-1/30 bg-green-0/20 hover:border-green-1/50 transition-colors">
                <div className="ml-4 p-2 bg-green rounded-lg">
                    <CheckCircle className="w-5 h-5 stroke-green-2" />
                </div>
                <ItemContent>
                    <ItemTitle className="text-green-2">وضعیت فعال</ItemTitle>
                    <ItemDescription className="text-xs">
                        با غیرفعال شدن، ملک از لیست مدیریت نیز مخفی می‌شود.
                    </ItemDescription>
                </ItemContent>
                <ItemActions>
                    <Switch
                        checked={isFormApproach ? (watch?.("is_active") ?? true) : (formData?.is_active ?? true)}
                        disabled={!editMode}
                        onCheckedChange={(checked) => handleSwitchChange("is_active", checked)}
                    />
                </ItemActions>
            </Item>

            {/* Featured Status - Orange */}
            <Item variant="default" size="default" className="py-4 rounded-xl border border-orange-1/30 bg-orange-0/20 hover:border-orange-1/50 transition-colors">
                <div className="ml-4 p-2 bg-orange rounded-lg">
                    <Star className="w-5 h-5 stroke-orange-2" />
                </div>
                <ItemContent>
                    <ItemTitle className="text-orange-2">وضعیت ویژه</ItemTitle>
                    <ItemDescription className="text-xs">
                        املاک ویژه در بخش‌های خاص سایت با اولویت نمایش داده می‌شوند.
                    </ItemDescription>
                </ItemContent>
                <ItemActions>
                    <Switch
                        checked={isFormApproach ? (watch?.("is_featured") ?? false) : (formData?.is_featured ?? false)}
                        disabled={!editMode}
                        onCheckedChange={(checked) => handleSwitchChange("is_featured", checked)}
                    />
                </ItemActions>
            </Item>

            {/* Published Status - Purple */}
            <Item variant="default" size="default" className="py-4 rounded-xl border border-purple-1/30 bg-purple-0/20 hover:border-purple-1/50 transition-colors">
                <div className="ml-4 p-2 bg-purple rounded-lg">
                    <FileText className="w-5 h-5 stroke-purple-2" />
                </div>
                <ItemContent>
                    <ItemTitle className="text-purple-2">منتشر شده</ItemTitle>
                    <ItemDescription className="text-xs">
                        ملک منتشر شده برای عموم قابل مشاهده است.
                    </ItemDescription>
                </ItemContent>
                <ItemActions>
                    <Switch
                        checked={isFormApproach ? (watch?.("is_published") ?? false) : (formData?.is_published ?? false)}
                        disabled={!editMode}
                        onCheckedChange={(checked) => handleSwitchChange("is_published", checked)}
                    />
                </ItemActions>
            </Item>
        </div>
    );
}
