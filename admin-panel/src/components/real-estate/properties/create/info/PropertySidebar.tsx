
import { useState, useEffect } from "react";
import type { UseFormReturn } from "react-hook-form";
import { Switch } from "@/components/elements/Switch";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { FolderOpen, Tag, Settings, FileText, Eye, CheckCircle, Star } from "lucide-react";
import { Item, ItemContent, ItemTitle, ItemDescription, ItemActions } from "@/components/elements/Item";
import { realEstateApi } from "@/api/real-estate";
import { MultiSelector } from "@/components/shared/MultiSelector";
import type { PropertyLabel } from "@/types/real_estate/label/realEstateLabel";
import type { PropertyFeature } from "@/types/real_estate/feature/realEstateFeature";
import type { PropertyTag } from "@/types/real_estate/tags/realEstateTag";
import type { PropertyFormValues } from "@/components/real-estate/validations/propertySchema";

interface PropertySidebarProps {
    form?: UseFormReturn<PropertyFormValues>;
    formData?: any;
    handleInputChange?: (field: string, value: any) => void;
    editMode: boolean;
    isFormApproach: boolean;
    selectedLabels: PropertyLabel[];
    selectedTags: PropertyTag[];
    selectedFeatures: PropertyFeature[];
    onLabelToggle?: (label: PropertyLabel) => void;
    onLabelRemove?: (labelId: number) => void;
    onTagToggle?: (tag: PropertyTag) => void;
    onTagRemove?: (tagId: number) => void;
    onFeatureToggle?: (feature: PropertyFeature) => void;
    onFeatureRemove?: (featureId: number) => void;
}

export function PropertySidebar({
    form,
    formData,
    handleInputChange,
    editMode,
    isFormApproach,
    selectedLabels,
    selectedTags,
    selectedFeatures,
    onLabelToggle,
    onLabelRemove,
    onTagToggle,
    onTagRemove,
    onFeatureToggle,
    onFeatureRemove
}: PropertySidebarProps) {
    const { watch, setValue } = isFormApproach && form
        ? form
        : { watch: null, setValue: null };

    const [labels, setLabels] = useState<PropertyLabel[]>([]);
    const [tags, setTags] = useState<PropertyTag[]>([]);
    const [features, setFeatures] = useState<PropertyFeature[]>([]);

    const [loadingLabels, setLoadingLabels] = useState(true);
    const [loadingTags, setLoadingTags] = useState(true);
    const [loadingFeatures, setLoadingFeatures] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const labelsResponse = await realEstateApi.getLabels({ page: 1, size: 100, is_active: true });
                setLabels(labelsResponse.data || []);
            } finally {
                setLoadingLabels(false);
            }

            try {
                const tagsResponse = await realEstateApi.getTags({ page: 1, size: 100, is_active: true, is_public: true });
                setTags(tagsResponse.data || []);
            } finally {
                setLoadingTags(false);
            }

            try {
                const featuresResponse = await realEstateApi.getFeatures({ page: 1, size: 100, is_active: true });
                setFeatures(featuresResponse.data || []);
            } finally {
                setLoadingFeatures(false);
            }
        };

        fetchData();
    }, []);

    return (
        <CardWithIcon
            icon={Settings}
            title="تنظیمات"
            iconBgColor="bg-blue"
            iconColor="stroke-blue-2"
            borderColor="border-b-blue-1"
            className="lg:sticky lg:top-20"
        >
            <div className="space-y-8">

                <MultiSelector
                    label="برچسب‌ها"
                    icon={<FolderOpen className="w-4 h-4 stroke-purple-2" />}
                    items={labels}
                    selectedItems={selectedLabels}
                    onToggle={(item) => onLabelToggle?.(item)}
                    onRemove={(id) => onLabelRemove?.(Number(id))}
                    loading={loadingLabels}
                    disabled={!editMode}
                    placeholder="برچسب‌ها را انتخاب کنید"
                    colorTheme="purple"
                />

                <MultiSelector
                    label="تگ‌ها"
                    icon={<Tag className="w-4 h-4 stroke-indigo-2" />}
                    items={tags}
                    selectedItems={selectedTags}
                    onToggle={(item) => onTagToggle?.(item)}
                    onRemove={(id) => onTagRemove?.(Number(id))}
                    loading={loadingTags}
                    disabled={!editMode}
                    placeholder="تگ‌ها را انتخاب کنید"
                    colorTheme="indigo"
                />

                <MultiSelector
                    label="ویژگی‌ها"
                    icon={<Settings className="w-4 h-4 stroke-teal-2" />}
                    items={features}
                    selectedItems={selectedFeatures}
                    onToggle={(item) => onFeatureToggle?.(item)}
                    onRemove={(id) => onFeatureRemove?.(Number(id))}
                    loading={loadingFeatures}
                    disabled={!editMode}
                    placeholder="ویژگی‌ها را انتخاب کنید"
                    colorTheme="teal"
                />

                <div className="space-y-4 pt-4 border-t border-br">
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
                                    onCheckedChange={(checked) => {
                                        if (isFormApproach && setValue) {
                                            setValue("is_public", checked, { shouldValidate: false });
                                        } else {
                                            handleInputChange?.("is_public", checked);
                                        }
                                    }}
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
                                    onCheckedChange={(checked) => {
                                        if (isFormApproach && setValue) {
                                            setValue("is_active", checked, { shouldValidate: false });
                                        } else {
                                            handleInputChange?.("is_active", checked);
                                        }
                                    }}
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
                                    onCheckedChange={(checked) => {
                                        if (isFormApproach && setValue) {
                                            setValue("is_featured", checked, { shouldValidate: false });
                                        } else {
                                            handleInputChange?.("is_featured", checked);
                                        }
                                    }}
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
                                    onCheckedChange={(checked) => {
                                        if (isFormApproach && setValue) {
                                            setValue("is_published", checked, { shouldValidate: false });
                                        } else {
                                            handleInputChange?.("is_published", checked);
                                        }
                                    }}
                                />
                            </ItemActions>
                        </Item>
                    </div>
                </div>
            </div>
        </CardWithIcon>
    );
}
