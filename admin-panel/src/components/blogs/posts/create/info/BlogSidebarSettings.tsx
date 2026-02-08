import { Item, ItemContent, ItemTitle, ItemDescription, ItemActions } from "@/components/elements/Item";
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
        <div className="space-y-4 pt-4 border-t border-br">
            <Item variant="default" size="default" className="py-4 rounded-xl border border-blue-1/30 bg-blue-0/20 hover:border-blue-1/50 transition-colors">
                <div className="ml-4 p-2 bg-blue rounded-lg">
                    <Eye className="w-5 h-5 stroke-blue-2" />
                </div>
                <ItemContent>
                    <ItemTitle className="text-blue-2">نمایش عمومی</ItemTitle>
                    <ItemDescription className="text-xs">
                        اگر غیرفعال باشد بلاگ در سایت نمایش داده نمی‌شود.
                    </ItemDescription>
                </ItemContent>
                <ItemActions>
                    <Switch
                        checked={isPublic}
                        disabled={!editMode}
                        onCheckedChange={(checked) => handleSettingChange("is_public", checked)}
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
                        با غیرفعال شدن، بلاگ از لیست مدیریت نیز مخفی می‌شود.
                    </ItemDescription>
                </ItemContent>
                <ItemActions>
                    <Switch
                        checked={isActive}
                        disabled={!editMode}
                        onCheckedChange={(checked) => handleSettingChange("is_active", checked)}
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
                        بلاگ‌های ویژه در بخش‌های خاص سایت با اولویت نمایش داده می‌شوند.
                    </ItemDescription>
                </ItemContent>
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
