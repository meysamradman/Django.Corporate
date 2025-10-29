"use client";

import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { TabsContent } from "@/components/elements/Tabs";
import { Button } from "@/components/elements/Button";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/elements/Card";
import { PortfolioMediaGallery } from "@/components/portfolios/list/PortfolioMediaGallery";
import { Media } from "@/types/shared/media";
import { Image as ImageIcon, UploadCloud, X, AlertCircle } from "lucide-react";
import { MediaLibraryModal } from "@/components/media/modals/MediaLibraryModal";
import { PortfolioFormValues } from "@/core/validations/portfolioSchema";
import { mediaService } from "@/components/media/services";
import NextImage from "next/image";

interface PortfolioMedia {
    featuredImage: Media | null;
    imageGallery: Media[];
    videoGallery: Media[];
    audioGallery: Media[];
    pdfDocuments: Media[];
}

// Props interface for react-hook-form approach (create page)
interface MediaTabFormProps {
    form: UseFormReturn<PortfolioFormValues>;
    portfolioMedia: PortfolioMedia;
    setPortfolioMedia: (media: PortfolioMedia) => void;
    editMode: boolean;
}

// Props interface for manual state approach (edit page)
interface MediaTabManualProps {
    portfolioMedia: PortfolioMedia;
    setPortfolioMedia: (media: PortfolioMedia) => void;
    editMode: boolean;
    featuredImage?: Media | null;
    onFeaturedImageChange?: (media: Media | null) => void;
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
        onFeaturedImageChange
    } = isFormApproach 
        ? { 
            portfolioMedia: props.portfolioMedia, 
            setPortfolioMedia: props.setPortfolioMedia, 
            editMode: props.editMode,
            featuredImage: undefined,
            onFeaturedImageChange: undefined
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
        <TabsContent value="media" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

                {/* Left Column: Galleries */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Image Gallery Card */}
                    <Card>
                        <CardContent className="p-6">
                            <PortfolioMediaGallery
                                mediaItems={portfolioMedia?.imageGallery || []}
                                onMediaSelect={(media) => setPortfolioMedia?.({ ...portfolioMedia, imageGallery: media })}
                                mediaType="image"
                                title="گالری تصاویر"
                                isGallery={true}
                            />
                        </CardContent>
                    </Card>

                    {/* Video Card */}
                    <Card>
                        <CardContent className="p-6">
                            <PortfolioMediaGallery
                                mediaItems={portfolioMedia?.videoGallery || []}
                                onMediaSelect={(media) => setPortfolioMedia?.({ ...portfolioMedia, videoGallery: media })}
                                mediaType="video"
                                title="ویدیو"
                                isGallery={false}
                                maxSelection={1}
                            />
                        </CardContent>
                    </Card>

                    {/* Audio Card */}
                    <Card>
                        <CardContent className="p-6">
                            <PortfolioMediaGallery
                                mediaItems={portfolioMedia?.audioGallery || []}
                                onMediaSelect={(media) => setPortfolioMedia?.({ ...portfolioMedia, audioGallery: media })}
                                mediaType="audio"
                                title="فایل صوتی"
                                isGallery={false}
                                maxSelection={1}
                            />
                        </CardContent>
                    </Card>

                    {/* PDF Card */}
                     <Card>
                        <CardContent className="p-6">
                            <PortfolioMediaGallery
                                mediaItems={portfolioMedia?.pdfDocuments || []}
                                onMediaSelect={(media) => setPortfolioMedia?.({ ...portfolioMedia, pdfDocuments: media })}
                                mediaType="pdf"
                                title="مستندات (PDF)"
                                isGallery={false}
                                maxSelection={1}
                            />
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Featured Image */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className={`sticky top-24 ${(formState.errors as any)?.featuredImage ? 'border-red-500' : ''}`}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                تصویر شاخص
                                <span className="text-red-500">*</span>
                            </CardTitle>
                            <CardDescription>
                                این تصویر به عنوان کاور اصلی نمونه‌کار استفاده می‌شود.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {currentFeaturedImage ? (
                                <div className="relative w-full aspect-video rounded-lg overflow-hidden group border">
                                    <NextImage
                                        src={mediaService.getMediaUrlFromObject(currentFeaturedImage)}
                                        alt={currentFeaturedImage.alt_text || "تصویر شاخص"}
                                        fill
                                        className="object-cover"
                                        unoptimized
                                    />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            variant="secondary"
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
                                    className={`relative flex flex-col items-center justify-center w-full p-8 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary transition-colors ${!editMode ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <UploadCloud className="w-12 h-12 text-muted-foreground" />
                                    <p className="mt-4 text-lg font-semibold">انتخاب تصویر شاخص</p>
                                    <p className="mt-1 text-sm text-muted-foreground text-center">
                                        برای انتخاب از کتابخانه کلیک کنید
                                    </p>
                                </div>
                            )}
                            
                            {/* نمایش خطا */}
                            {(formState.errors as any)?.featuredImage?.message && (
                                <div className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400 mt-3">
                                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    <span>{String((formState.errors as any).featuredImage.message)}</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

            </div>
            
            <MediaLibraryModal
                isOpen={isMediaModalOpen}
                onClose={() => setIsMediaModalOpen(false)}
                onSelect={handleFeaturedImageSelect}
                selectMultiple={false}
                initialFileType="image"
            />
        </TabsContent>
    );
}