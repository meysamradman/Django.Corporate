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

interface MediaTabProps {
    form: UseFormReturn<PortfolioFormValues>;
    portfolioMedia: PortfolioMedia;
    setPortfolioMedia: (media: PortfolioMedia) => void;
    editMode: boolean;
}

export default function MediaTab({ form, portfolioMedia, setPortfolioMedia, editMode }: MediaTabProps) {
    const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
    const { formState: { errors }, setValue, watch } = form;
    const featuredImage = watch("featuredImage");

    const handleFeaturedImageSelect = (media: Media | Media[] | null) => {
        const selected = Array.isArray(media) ? media[0] || null : media;
        
        // Set در form برای validation
        setValue("featuredImage", selected, { shouldValidate: true });
        
        // Set در portfolioMedia برای نمایش (backward compatibility)
        setPortfolioMedia({
            ...portfolioMedia,
            featuredImage: selected
        });
        
        setIsMediaModalOpen(false);
    };

    const handleRemoveFeaturedImage = () => {
        setValue("featuredImage", null, { shouldValidate: true });
        setPortfolioMedia({
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
                                mediaItems={portfolioMedia.imageGallery}
                                onMediaSelect={(media) => setPortfolioMedia({ ...portfolioMedia, imageGallery: media })}
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
                                mediaItems={portfolioMedia.videoGallery}
                                onMediaSelect={(media) => setPortfolioMedia({ ...portfolioMedia, videoGallery: media })}
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
                                mediaItems={portfolioMedia.audioGallery}
                                onMediaSelect={(media) => setPortfolioMedia({ ...portfolioMedia, audioGallery: media })}
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
                                mediaItems={portfolioMedia.pdfDocuments}
                                onMediaSelect={(media) => setPortfolioMedia({ ...portfolioMedia, pdfDocuments: media })}
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
                    <Card className={`sticky top-24 ${errors.featuredImage ? 'border-red-500' : ''}`}>
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
                            {portfolioMedia.featuredImage ? (
                                <div className="relative w-full aspect-video rounded-lg overflow-hidden group border">
                                    <NextImage
                                        src={mediaService.getMediaUrlFromObject(portfolioMedia.featuredImage)}
                                        alt={portfolioMedia.featuredImage.alt_text || "تصویر شاخص"}
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
                                        >
                                            تغییر تصویر
                                        </Button>

                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={handleRemoveFeaturedImage}
                                            className="mx-1"
                                        >
                                            <X className="w-4 h-4" />
                                            حذف
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div
                                    onClick={() => setIsMediaModalOpen(true)}
                                    className="relative flex flex-col items-center justify-center w-full p-8 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary transition-colors"
                                >
                                    <UploadCloud className="w-12 h-12 text-muted-foreground" />
                                    <p className="mt-4 text-lg font-semibold">انتخاب تصویر شاخص</p>
                                    <p className="mt-1 text-sm text-muted-foreground text-center">
                                        برای انتخاب از کتابخانه کلیک کنید
                                    </p>
                                </div>
                            )}
                            
                            {/* نمایش خطا */}
                            {errors.featuredImage?.message && (
                                <div className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400 mt-3">
                                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    <span>{String(errors.featuredImage.message)}</span>
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