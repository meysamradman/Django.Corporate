
import { Item, ItemMedia, ItemActions } from "@/components/elements/Item";
import { Switch } from "@/components/elements/Switch";
import { Eye, CheckCircle, Star } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import type { BlogFormValues } from "@/components/blogs/validations/blogSchema";

interface BlogStatusProps {
    form?: UseFormReturn<BlogFormValues>;
    formData?: any;
    handleInputChange?: (field: string, value: any) => void;
    editMode: boolean;
    isFormApproach: boolean;
}

export function BlogStatus({ form, formData, handleInputChange, editMode, isFormApproach }: BlogStatusProps) {
    const { watch, setValue } = isFormApproach && form
        ? form
        : { watch: null, setValue: null };

    const isPublic = isFormApproach ? watch?.("is_public") : formData?.is_public;
    const isActive = isFormApproach ? watch?.("is_active") : formData?.is_active;
    const isFeatured = isFormApproach ? watch?.("is_featured") : formData?.is_featured;

    const handleSettingChange = (field: string, value: boolean) => {
        if (isFormApproach && setValue) {
            setValue(field as any, value);
        } else {
            handleInputChange?.(field, value);
        }
    };

    return (
        <div className="space-y-4">
            <Item className="p-2.5 h-16 rounded-xl border-blue-1/20 bg-blue-0/10 flex-row items-center gap-3">
                <ItemMedia className="p-2 bg-blue/20 rounded-lg shrink-0">
                    <Eye className="w-4 h-4 stroke-blue-2" />
                </ItemMedia>
                <div className="flex-1 flex flex-col">
                    <span className="text-[11px] font-bold text-blue-2 leading-tight">نمایش عمومی</span>
                </div>
                <ItemActions>
                    <Switch
                        checked={isPublic}
                        disabled={!editMode}
                        onCheckedChange={(checked) => handleSettingChange("is_public", checked)}
                    />
                </ItemActions>
            </Item>

            <Item className="p-2.5 h-16 rounded-xl border-green-1/20 bg-green-0/10 flex-row items-center gap-3">
                <ItemMedia className="p-2 bg-green/20 rounded-lg shrink-0">
                    <CheckCircle className="w-4 h-4 stroke-green-2" />
                </ItemMedia>
                <div className="flex-1 flex flex-col">
                    <span className="text-[11px] font-bold text-green-2 leading-tight">وضعیت فعال</span>
                </div>
                <ItemActions>
                    <Switch
                        checked={isActive}
                        disabled={!editMode}
                        onCheckedChange={(checked) => handleSettingChange("is_active", checked)}
                    />
                </ItemActions>
            </Item>

            <Item className="p-2.5 h-16 rounded-xl border-orange-1/20 bg-orange-0/10 flex-row items-center gap-3">
                <ItemMedia className="p-2 bg-orange/20 rounded-lg shrink-0">
                    <Star className="w-4 h-4 stroke-orange-2" />
                </ItemMedia>
                <div className="flex-1 flex flex-col">
                    <span className="text-[11px] font-bold text-orange-2 leading-tight">وضعیت ویژه</span>
                </div>
                <ItemActions>
                    <Switch
                        checked={isFeatured}
                        disabled={!editMode}
                        onCheckedChange={(checked) => handleSettingChange("is_featured", checked)}
                    />
                </ItemActions>
            </Item>
        </div>
    );
}
