/**
 * رنگ‌های استاندارد نوع مدیا:
 * - تصویر: blue
 * - ویدیو: purple
 * - صدا: pink
 * - سند: gray
 */
"use client";

import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { TabsContent } from "@/components/elements/Tabs";
import { Button } from "@/components/elements/Button";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { PortfolioMediaGallery } from "@/components/portfolios/list/PortfolioMediaGallery";
import { Media } from "@/types/shared/media";
import { Image as ImageIcon, UploadCloud, X, AlertCircle, Video, Music, FileText } from "lucide-react";
import { MediaLibraryModal } from "@/components/media/modals/MediaLibraryModal";
import { PortfolioFormValues } from "@/core/validations/portfolioSchema";
import { mediaService } from "@/components/media/services";
import NextImage from "next/image";
import { PortfolioMedia } from "@/types/portfolio/portfolioMedia";

// Props interface for react-hook-form approach (create page)
interface MediaTabFormProps {
    form: UseFormReturn<PortfolioFormValues>;
    portfolioMedia: PortfolioMedia;
    setPortfolioMedia: (media: PortfolioMedia) => void;
    editMode: boolean;
    portfolioId?: number | string; // Portfolio ID for context-aware permissions
}

// Props interface for manual state approach (edit page)
interface MediaTabManualProps {
    portfolioMedia: PortfolioMedia;
    setPortfolioMedia: (media: PortfolioMedia) => void;
    editMode: boolean;
    featuredImage?: Media | null;
    onFeaturedImageChange?: (media: Media | null) => void;
    portfolioId?: number | string; // Portfolio ID for context-aware permissions
}

// Union type for both approaches
type MediaTabProps = MediaTabFormProps | MediaTabManualProps;

export default function MediaTab(props: MediaTabProps) {
    const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
    
    // Check which approach is being used
    const isFormApproach = 'form' in props;
    
    // Get form state based on approach
    const formState = isFormApproach ? props.form.formState : { errors: {} };
    const setValue = isFormApproach ? props.form.setValue : null;
    const watch = isFormApproach ? props.form.watch : null;
    
    // For manual approach, use props directly
    const {
        portfolioMedia,
        setPortfolioMedia,
        editMode,
        featuredImage: manualFeaturedImage,
        onFeaturedImageChange,
        portfolioId
    } = isFormApproach 
        ? { 
            portfolioMedia: props.portfolioMedia, 
            setPortfolioMedia: props.setPortfolioMedia, 
            editMode: props.editMode,
            featuredImage: undefined,
            onFeaturedImageChange: undefined,
            portfolioId: props.portfolioId
        } 
        : props;
    
    // Watch featured image for form approach
    const formFeaturedImage = isFormApproach ? watch?.("featuredImage") : undefined;
    const currentFeaturedImage = isFormApproach ? formFeaturedImage : manualFeaturedImage || portfolioMedia?.featuredImage;

    const handleFeaturedImageSelect = (media: Media | Media[] | null) => {
        const selected = Array.isArray(media) ? media[0] || null : media;
        
        if (isFormApproach) {
            // Set در form برای validation
            setValue?.("featuredImage", selected, { shouldValidate: true });
        } else {
            // Call the manual change handler if provided
            onFeaturedImageChange?.(selected);
        }
        
        // Set در portfolioMedia برای نمایش (backward compatibility)
        setPortfolioMedia?.({
            ...portfolioMedia,
            featuredImage: selected
        });
        
        setIsMediaModalOpen(false);
    };

    const handleRemoveFeaturedImage = () => {
        if (isFormApproach) {
            setValue?.("featuredImage", null, { shouldValidate: true });
        } else {
            onFeaturedImageChange?.(null);
        }
        
        setPortfolioMedia?.({
            ...portfolioMedia,
            featuredImage: null
        });
    };

    return (
        <TabsContent value="media" className="mt-0 space-y-6">
            <div className="flex flex-col lg:flex-row gap-6">

                {/* Left Column: Galleries */}
                <div className="flex-1 min-w-0 space-y-6">
                    {/* Image Gallery Card */}
                    <CardWithIcon
                        icon={ImageIcon}
                        title="گالری تصاویر"
                        iconBgColor="bg-blue"
                        iconColor="stroke-blue-2"
                        borderColor="border-b-blue-1"
                    >
                            <PortfolioMediaGallery
                                mediaItems={portfolioMedia?.imageGallery || []}
                                onMediaSelect={(media) => setPortfolioMedia?.({ ...portfolioMedia, imageGallery: media })}
                                mediaType="image"
                                title=""
                                isGallery={true}
                                disabled={!editMode}
                                contextId={portfolioId}
                            />
                    </CardWithIcon>

                    {/* Video Card */}
                    <CardWithIcon
                        icon={Video}
                        title="ویدیو"
                        iconBgColor="bg-purple"
                        iconColor="stroke-purple-2"
                        borderColor="border-b-purple-1"
                    >
                            <PortfolioMediaGallery
                                mediaItems={portfolioMedia?.videoGallery || []}
                                onMediaSelect={(media) => setPortfolioMedia?.({ ...portfolioMedia, videoGallery: media })}
                                mediaType="video"
                                title=""
                                isGallery={false}
                                maxSelection={1}
                                disabled={!editMode}
                                contextId={portfolioId}
                            />
                    </CardWithIcon>

                    {/* Audio Card */}
                    <CardWithIcon
                        icon={Music}
                        title="فایل صوتی"
                        iconBgColor="bg-pink"
                        iconColor="stroke-pink-2"
                        borderColor="border-b-pink-1"
                    >
                            <PortfolioMediaGallery
                                mediaItems={portfolioMedia?.audioGallery || []}
                                onMediaSelect={(media) => setPortfolioMedia?.({ ...portfolioMedia, audioGallery: media })}
                                mediaType="audio"
                                title=""
                                isGallery={false}
                                maxSelection={1}
                                disabled={!editMode}
                                contextId={portfolioId}
                            />
                    </CardWithIcon>

                    {/* PDF Card */}
                    <CardWithIcon
                        icon={FileText}
                        title="مستندات (PDF)"
                        iconBgColor="bg-gray"
                        iconColor="stroke-gray-2"
                        borderColor="border-b-gray-1"
                    >
                            <PortfolioMediaGallery
                                mediaItems={portfolioMedia?.pdfDocuments || []}
                                onMediaSelect={(media) => setPortfolioMedia?.({ ...portfolioMedia, pdfDocuments: media })}
                                mediaType="pdf"
                                title=""
                                isGallery={false}
                                maxSelection={1}
                                disabled={!editMode}
                                contextId={portfolioId}
                            />
                    </CardWithIcon>
                </div>

                {/* Right Column: Featured Image */}
                <div className="w-full lg:w-[420px] lg:flex-shrink-0">
                    <CardWithIcon
                        icon={ImageIcon}
                        title={
                            <>
                                تصویر شاخص
                                <span className="text-red-2">*</span>
                            </>
                        }
                        iconBgColor="bg-blue"
                        iconColor="stroke-blue-2"
                        borderColor={(formState.errors as any)?.featuredImage ? 'border-b-red-1' : 'border-b-blue-1'}
                        className="lg:sticky lg:top-20"
                    >
                            {currentFeaturedImage ? (
                                <div className="relative w-full aspect-video rounded-lg overflow-hidden group border">
                                    <NextImage
                                        src={mediaService.getMediaUrlFromObject(currentFeaturedImage)}
                                        alt={currentFeaturedImage.alt_text || "تصویر شاخص"}
                                        fill
                                        className="object-cover"
                                        unoptimized
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
                                            onClick={handleRemoveFeaturedImage}
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
                                    <p className="font-semibold">انتخاب تصویر شاخص</p>
                                    <p className="text-font-s text-center">
                                        برای انتخاب از کتابخانه کلیک کنید
                                    </p>
                                </div>
                            )}
                            
                            {/* نمایش خطا */}
                            {(formState.errors as any)?.featuredImage?.message && (
                                <div className="flex items-start gap-2 text-red-2">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                    <span>{String((formState.errors as any).featuredImage.message)}</span>
                                </div>
                            )}
                    </CardWithIcon>
                </div>

            </div>
            
            <MediaLibraryModal
                isOpen={isMediaModalOpen}
                onClose={() => setIsMediaModalOpen(false)}
                onSelect={handleFeaturedImageSelect}
                selectMultiple={false}
                initialFileType="image"
                context="portfolio"
                contextId={portfolioId}
            />
        </TabsContent>
    );
}