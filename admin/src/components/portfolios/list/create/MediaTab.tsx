"use client";

import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { TabsContent } from "@/components/elements/Tabs";
import { Button } from "@/components/elements/Button";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle
} from "@/components/elements/Card";
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
        <TabsContent value="media" className="mt-0 space-y-6">
            <div className="flex flex-col lg:flex-row gap-6">

                {/* Left Column: Galleries */}
                <div className="flex-1 min-w-0 space-y-6">
                    {/* Image Gallery Card */}
                    <Card className="hover:shadow-lg transition-all duration-300 border-b-4 border-b-indigo-500">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3">
                                <div className="p-2.5 bg-indigo-100 rounded-xl shadow-sm">
                                    <ImageIcon className="w-5 h-5 stroke-indigo-600" />
                                </div>
                                <div>گالری تصاویر</div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <PortfolioMediaGallery
                                mediaItems={portfolioMedia?.imageGallery || []}
                                onMediaSelect={(media) => setPortfolioMedia?.({ ...portfolioMedia, imageGallery: media })}
                                mediaType="image"
                                title=""
                                isGallery={true}
                                disabled={!editMode}
                            />
                        </CardContent>
                    </Card>

                    {/* Video Card */}
                    <Card className="hover:shadow-lg transition-all duration-300 border-b-4 border-b-purple-500">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3">
                                <div className="p-2.5 bg-purple-100 rounded-xl shadow-sm">
                                    <Video className="w-5 h-5 stroke-purple-600" />
                                </div>
                                <div>ویدیو</div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <PortfolioMediaGallery
                                mediaItems={portfolioMedia?.videoGallery || []}
                                onMediaSelect={(media) => setPortfolioMedia?.({ ...portfolioMedia, videoGallery: media })}
                                mediaType="video"
                                title=""
                                isGallery={false}
                                maxSelection={1}
                                disabled={!editMode}
                            />
                        </CardContent>
                    </Card>

                    {/* Audio Card */}
                    <Card className="hover:shadow-lg transition-all duration-300 border-b-4 border-b-rose-500">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3">
                                <div className="p-2.5 bg-rose-100 rounded-xl shadow-sm">
                                    <Music className="w-5 h-5 stroke-rose-600" />
                                </div>
                                <div>فایل صوتی</div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <PortfolioMediaGallery
                                mediaItems={portfolioMedia?.audioGallery || []}
                                onMediaSelect={(media) => setPortfolioMedia?.({ ...portfolioMedia, audioGallery: media })}
                                mediaType="audio"
                                title=""
                                isGallery={false}
                                maxSelection={1}
                                disabled={!editMode}
                            />
                        </CardContent>
                    </Card>

                    {/* PDF Card */}
                     <Card className="hover:shadow-lg transition-all duration-300 border-b-4 border-b-gray-500">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3">
                                <div className="p-2.5 bg-gray-100 rounded-xl shadow-sm">
                                    <FileText className="w-5 h-5 stroke-gray-600" />
                                </div>
                                <div>مستندات (PDF)</div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <PortfolioMediaGallery
                                mediaItems={portfolioMedia?.pdfDocuments || []}
                                onMediaSelect={(media) => setPortfolioMedia?.({ ...portfolioMedia, pdfDocuments: media })}
                                mediaType="pdf"
                                title=""
                                isGallery={false}
                                maxSelection={1}
                                disabled={!editMode}
                            />
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Featured Image */}
                <div className="w-full lg:w-[420px] lg:flex-shrink-0">
                    <Card className={`lg:sticky lg:top-20 hover:shadow-lg transition-all duration-300 border-b-4 ${(formState.errors as any)?.featuredImage ? 'border-b-destructive' : 'border-b-blue-500'}`}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3">
                                <div className="p-2.5 bg-blue-50 rounded-xl shadow-sm">
                                    <ImageIcon className="w-5 h-5 stroke-blue-600" />
                                </div>
                                <div>
                                    تصویر شاخص
                                    <span className="text-destructive">*</span>
                                </div>
                            </CardTitle>
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
                                    className={`relative flex flex-col items-center justify-center w-full p-8 border-2 border-dashed rounded-lg cursor-pointer hover:border-blue-500 transition-colors ${!editMode ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <UploadCloud className="w-12 h-12 text-muted-foreground" />
                                    <p className="font-semibold">انتخاب تصویر شاخص</p>
                                    <p className="text-muted-foreground text-center">
                                        برای انتخاب از کتابخانه کلیک کنید
                                    </p>
                                </div>
                            )}
                            
                            {/* نمایش خطا */}
                            {(formState.errors as any)?.featuredImage?.message && (
                                <div className="flex items-start gap-2 text-destructive">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
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