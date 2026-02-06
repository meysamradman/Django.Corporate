import { useState } from "react";
import { Button } from "@/components/elements/Button";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import type { Media } from "@/types/shared/media";
import { FormFieldInput, FormFieldTextarea } from "@/components/shared/FormField";
import { MediaLibraryModal } from "@/components/media/modals/MediaLibraryModal";
import { mediaService } from "@/components/media/services";
import { UploadCloud, X, Search, Image as ImageIcon, Globe } from "lucide-react";

interface SEOTabProps {
    formData: any;
    handleInputChange: (field: string, value: any) => void;
    editMode: boolean;
    propertyId?: number | string;
}

export default function RealEstateSEO(props: SEOTabProps) {
    const { formData, handleInputChange, editMode, propertyId } = props;
    const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
    
    const ogImageValue = formData?.og_image;
    const ogImageUrl = ogImageValue ? mediaService.getMediaUrlFromObject(ogImageValue) : "";

    const handleOgImageSelect = (media: Media | Media[] | null) => {
        const selected = Array.isArray(media) ? media[0] || null : media;
        handleInputChange("og_image", selected);
        setIsMediaModalOpen(false);
    };

    const handleRemoveOgImage = () => {
        handleInputChange("og_image", null);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1 min-w-0 space-y-6">
                    <CardWithIcon
                        icon={Search}
                        title="بهینه‌سازی موتور جستجو"
                        iconBgColor="bg-green"
                        iconColor="stroke-green-2"
                        borderColor="border-b-green-1"
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

                    <CardWithIcon
                        icon={Globe}
                        title="پیش‌نمایش Open Graph"
                        iconBgColor="bg-blue"
                        iconColor="stroke-blue-2"
                        borderColor="border-b-blue-1"
                    >
                        <div className="flex flex-col lg:flex-row gap-6">
                            <div className="lg:w-[35%] lg:max-w-[320px]">
                                <FormFieldInput
                                    label="عنوان Open Graph"
                                    id="og_title"
                                    placeholder="عنوان برای اشتراک‌گذاری در شبکه‌های اجتماعی"
                                    maxLength={70}
                                    disabled={!editMode}
                                    value={formData?.og_title || ""}
                                    onChange={(e) => handleInputChange("og_title", e.target.value)}
                                />
                            </div>
                            
                            <div className="lg:flex-1 lg:min-w-0">
                                <FormFieldTextarea
                                    label="توضیحات Open Graph"
                                    id="og_description"
                                    placeholder="توضیحات برای اشتراک‌گذاری در شبکه‌های اجتماعی"
                                    rows={5}
                                    maxLength={160}
                                    disabled={!editMode}
                                    value={formData?.og_description || ""}
                                    onChange={(e) => handleInputChange("og_description", e.target.value)}
                                />
                            </div>
                        </div>
                    </CardWithIcon>
                </div>

                <div className="w-full lg:w-[420px] lg:flex-shrink-0">
                    <CardWithIcon
                        icon={ImageIcon}
                        title="تصویر Open Graph"
                        iconBgColor="bg-blue"
                        iconColor="stroke-blue-2"
                        borderColor="border-b-blue-1"
                        className="lg:sticky lg:top-20"
                    >
                        {ogImageValue && ogImageUrl ? (
                            <div className="relative w-full aspect-video rounded-lg overflow-hidden group border">
                                <img
                                    src={ogImageUrl}
                                    alt={ogImageValue.alt_text || "تصویر Open Graph"}
                                    className="object-cover w-full h-full"
                                />
                                <div className="absolute inset-0 bg-static-b/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setIsMediaModalOpen(true)}
                                        className="mx-1"
                                        disabled={!editMode}
                                    >
                                        تغییر تصویر
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={handleRemoveOgImage}
                                        className="mx-1"
                                        disabled={!editMode}
                                    >
                                        <X className="w-4 h-4" />
                                        حذف
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div
                                onClick={() => editMode && setIsMediaModalOpen(true)}
                                className={`relative flex flex-col items-center justify-center w-full p-8 border-2 border-dashed rounded-lg cursor-pointer hover:border-blue-1 transition-colors ${!editMode ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <UploadCloud className="w-12 h-12 text-font-s" />
                                <p className="font-semibold">انتخاب تصویر Open Graph</p>
                                <p className="text-font-s text-center">
                                    برای انتخاب از کتابخانه کلیک کنید
                                </p>
                            </div>
                        )}
                    </CardWithIcon>
                </div>
            </div>

            <MediaLibraryModal
                isOpen={isMediaModalOpen}
                onClose={() => setIsMediaModalOpen(false)}
                onSelect={handleOgImageSelect}
                selectMultiple={false}
                initialFileType="image"
                context="media_library"
                contextId={propertyId}
            />
        </div>
    );
}

