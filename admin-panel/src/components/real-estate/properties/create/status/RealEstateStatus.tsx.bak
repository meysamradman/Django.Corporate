import type { UseFormReturn } from "react-hook-form";
import { Switch } from "@/components/elements/Switch";
import { Item, ItemHeader, ItemMedia, ItemActions, ItemFooter } from "@/components/elements/Item";
import { Eye, CheckCircle, Star, FileText } from "lucide-react";
import type { PropertyFormValues } from "@/components/real-estate/validations/propertySchema";

interface RealEstateStatusProps {
    form?: UseFormReturn<PropertyFormValues>;
    formData?: any;
    handleInputChange?: (field: string, value: any) => void;
    editMode: boolean;
    isFormApproach: boolean;
}

export function RealEstateStatus({ form, formData, handleInputChange, editMode, isFormApproach }: RealEstateStatusProps) {
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
        <div className="">
            <div className="grid grid-cols-1 gap-4">
                <Item className="p-2.5 h-16 rounded-xl border-blue-1/20 bg-blue-0/10 flex-row items-center gap-3">
                    <ItemMedia className="p-2 bg-blue/20 rounded-lg shrink-0">
                        <Eye className="w-4 h-4 stroke-blue-2" />
                    </ItemMedia>
                    <span className="flex-1 text-[11px] font-bold text-blue-2 leading-tight text-center">نمایش عمومی</span>
                    <ItemActions>
                        <Switch
                            checked={isFormApproach ? (watch?.("is_public") ?? true) : (formData?.is_public ?? true)}
                            disabled={!editMode}
                            onCheckedChange={(checked) => handleSwitchChange("is_public", checked)}
                        />
                    </ItemActions>
                </Item>

                <Item className="p-2.5 h-16 rounded-xl border-green-1/20 bg-green-0/10 flex-row items-center gap-3">
                    <ItemMedia className="p-2 bg-green/20 rounded-lg shrink-0">
                        <CheckCircle className="w-4 h-4 stroke-green-2" />
                    </ItemMedia>
                    <span className="flex-1 text-[11px] font-bold text-green-2 leading-tight text-center">وضعیت فعال</span>
                    <ItemActions>
                        <Switch
                            checked={isFormApproach ? (watch?.("is_active") ?? true) : (formData?.is_active ?? true)}
                            disabled={!editMode}
                            onCheckedChange={(checked) => handleSwitchChange("is_active", checked)}
                        />
                    </ItemActions>
                </Item>

                <Item className="p-2.5 h-16 rounded-xl border-orange-1/20 bg-orange-0/10 flex-row items-center gap-3">
                    <ItemMedia className="p-2 bg-orange/20 rounded-lg shrink-0">
                        <Star className="w-4 h-4 stroke-orange-2" />
                    </ItemMedia>
                    <span className="flex-1 text-[11px] font-bold text-orange-2 leading-tight text-center">وضعیت ویژه</span>
                    <ItemActions>
                        <Switch
                            checked={isFormApproach ? (watch?.("is_featured") ?? false) : (formData?.is_featured ?? false)}
                            disabled={!editMode}
                            onCheckedChange={(checked) => handleSwitchChange("is_featured", checked)}
                        />
                    </ItemActions>
                </Item>

                <Item className="p-2.5 h-16 rounded-xl border-purple-1/20 bg-purple-0/10 flex-row items-center gap-3">
                    <ItemMedia className="p-2 bg-purple/20 rounded-lg shrink-0">
                        <FileText className="w-4 h-4 stroke-purple-2" />
                    </ItemMedia>
                    <span className="flex-1 text-[11px] font-bold text-purple-2 leading-tight text-center">منتشر شده</span>
                    <ItemActions>
                        <Switch
                            checked={isFormApproach ? (watch?.("is_published") ?? false) : (formData?.is_published ?? false)}
                            disabled={!editMode}
                            onCheckedChange={(checked) => handleSwitchChange("is_published", checked)}
                        />
                    </ItemActions>
                </Item>
            </div>
        </div>
    );
}
