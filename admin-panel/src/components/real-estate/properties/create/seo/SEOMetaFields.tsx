import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { FormFieldInput, FormFieldTextarea } from "@/components/shared/FormField";
import { Search } from "lucide-react";

interface SEOMetaFieldsProps {
    formData: any;
    handleInputChange: (field: string, value: any) => void;
    editMode: boolean;
}

export function SEOMetaFields({ formData, handleInputChange, editMode }: SEOMetaFieldsProps) {
    return (
        <CardWithIcon
            icon={Search}
            title="بهینه‌سازی موتور جستجو"
            iconBgColor="bg-emerald"
            iconColor="stroke-emerald-2"
            cardBorderColor="border-b-emerald-1"
        >
            <div className="space-y-6">
                <div className="flex flex-col lg:flex-row gap-6">
                    <div className="lg:w-[35%] lg:max-w-[320px]">
                        <FormFieldInput
                            label="عنوان متا (Meta Title)"
                            id="meta_title"
                            placeholder="عنوان صفحه برای موتورهای جستجو"
                            maxLength={70}
                            disabled={!editMode}
                            description="حداکثر 70 کاراکتر توصیه می‌شود"
                            value={formData?.meta_title || ""}
                            onChange={(e) => handleInputChange("meta_title", e.target.value)}
                        />
                    </div>

                    <div className="lg:flex-1 lg:min-w-0">
                        <FormFieldTextarea
                            label="توضیحات متا (Meta Description)"
                            id="meta_description"
                            placeholder="توضیحات صفحه برای موتورهای جستجو"
                            rows={5}
                            maxLength={160}
                            disabled={!editMode}
                            description="بین 120 تا 160 کاراکتر توصیه می‌شود"
                            value={formData?.meta_description || ""}
                            onChange={(e) => handleInputChange("meta_description", e.target.value)}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <FormFieldInput
                        label="آدرس کانونیکال (Canonical URL)"
                        id="canonical_url"
                        placeholder="https://example.com/property/item"
                        type="url"
                        disabled={!editMode}
                        value={formData?.canonical_url || ""}
                        onChange={(e) => handleInputChange("canonical_url", e.target.value)}
                    />

                    <FormFieldInput
                        label="دستورالعمل ربات‌های جستجو (Robots Meta)"
                        id="robots_meta"
                        placeholder="index,follow"
                        disabled={!editMode}
                        value={formData?.robots_meta || ""}
                        onChange={(e) => handleInputChange("robots_meta", e.target.value)}
                    />
                </div>
            </div>
        </CardWithIcon>
    );
}
