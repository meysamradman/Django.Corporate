import { Item, ItemMedia, ItemActions } from "@/components/elements/Item";
import { Switch } from "@/components/elements/Switch";
import { Eye, CheckCircle, Star } from "lucide-react";

interface BlogSidebarSettingsProps {
    isPublic: boolean;
    isActive: boolean;
    isFeatured: boolean;
    editMode: boolean;
    handleSettingChange: (field: string, value: boolean) => void;
}

export function BlogSidebarSettings({
    isPublic,
    isActive,
    isFeatured,
    editMode,
    handleSettingChange
}: BlogSidebarSettingsProps) {
    return (
        <div className="">
            <div className="grid grid-cols-2 gap-4">
                <Item className="p-2.5 h-16 rounded-xl border-blue-1/20 bg-blue-0/10 flex-row items-center gap-3">
                    <ItemMedia className="p-2 bg-blue/20 rounded-lg shrink-0">
                        <Eye className="w-4 h-4 stroke-blue-2" />
                    </ItemMedia>
                    <span className="flex-1 text-[11px] font-bold text-blue-2 leading-tight text-center">نمایش عمومی</span>
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
                    <span className="flex-1 text-[11px] font-bold text-green-2 leading-tight text-center">وضعیت فعال</span>
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
                    <span className="flex-1 text-[11px] font-bold text-orange-2 leading-tight text-center">وضعیت ویژه</span>
                    <ItemActions>
                        <Switch
                            checked={isFeatured}
                            disabled={!editMode}
                            onCheckedChange={(checked) => handleSettingChange("is_featured", checked)}
                        />
                    </ItemActions>
                </Item>
            </div>
        </div>
    );
}
