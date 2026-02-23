
import { useState, lazy, Suspense } from "react";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Button } from "@/components/elements/Button";
import { FormFieldInput, FormFieldTextarea } from "@/components/shared/FormField";
import { mediaService } from "@/components/media/services";
import { UploadCloud, X, Image as ImageIcon, Globe } from "lucide-react";
import type { Media } from "@/types/shared/media";

const MediaLibraryModal = lazy(() => import("@/components/media/modals/MediaLibraryModal").then(mod => ({ default: mod.MediaLibraryModal })));

interface RealEstateSEOSocialPreviewProps {
    formData: any;
    handleInputChange: (field: string, value: any) => void;
    editMode: boolean;
    propertyId?: number | string;
}

export function RealEstateSEOSocialPreview({ formData, handleInputChange, editMode, propertyId }: RealEstateSEOSocialPreviewProps) {
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
        <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 min-w-0 space-y-6">
                <CardWithIcon
                    icon={Globe}
                    title="پیش‌نمایش Open Graph"
                    iconBgColor="bg-emerald"
                    iconColor="stroke-emerald-2"
                    cardBorderColor="border-b-emerald-1"
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

            <div className="w-full lg:w-[420px] lg:shrink-0">
                <CardWithIcon
                    icon={ImageIcon}
                    title="تصویر Open Graph"
                    iconBgColor="bg-emerald"
                    iconColor="stroke-emerald-2"
                    cardBorderColor="border-b-emerald-1"
                    className="lg:sticky lg:top-20"
                >
                    {ogImageValue && ogImageUrl ? (
                        <div className="relative w-full aspect-video rounded-lg overflow-hidden group border">
                            <img
                                src={ogImageUrl}
                                alt={ogImageValue.alt_text || "تصویر Open Graph"}
                                className="object-cover w-full h-full"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsMediaModalOpen(true)}
                                    className="bg-wt/10 border-wt/20 text-static-w hover:bg-wt/25 backdrop-blur-md h-9 px-4 text-[11px] font-bold"
                                    disabled={!editMode}
                                >
                                    تغییر تصویر
                                </Button>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={handleRemoveOgImage}
                                    className="h-9 w-9 p-0"
                                    disabled={!editMode}
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div
                            onClick={() => editMode && setIsMediaModalOpen(true)}
                            className={`relative flex flex-col items-center justify-center w-full p-8 border-2 border-dashed rounded-lg cursor-pointer hover:border-blue-1 transition-colors ${!editMode ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <UploadCloud className="w-12 h-12 text-font-s opacity-20" />
                            <p className="font-semibold text-sm">انتخاب تصویر Open Graph</p>
                        </div>
                    )}
                </CardWithIcon>
            </div>

            <Suspense fallback={null}>
                <MediaLibraryModal
                    isOpen={isMediaModalOpen}
                    onClose={() => setIsMediaModalOpen(false)}
                    onSelect={handleOgImageSelect}
                    selectMultiple={false}
                    initialFileType="image"
                    context="media_library"
                    contextId={propertyId}
                />
            </Suspense>
        </div>
    );
}
