import { useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import { TabsContent } from "@/components/elements/Tabs";
import type { Media } from "@/types/shared/media";
import type { PortfolioFormValues } from "@/components/portfolios/validations/portfolioSchema";
import type { PortfolioMedia as IPortfolioMedia } from "@/types/portfolio/portfolioMedia";
import { getModuleMediaCount } from "@/components/media/utils/genericMediaUtils";
import { PortfolioMediaImages } from "./media/PortfolioMediaImages";
import { PortfolioMediaOther } from "./media/PortfolioMediaOther";
import { PortfolioMediaFeatured } from "./media/PortfolioMediaFeatured";

interface MediaTabFormProps {
    form: UseFormReturn<PortfolioFormValues>;
    portfolioMedia: IPortfolioMedia;
    setPortfolioMedia: (media: IPortfolioMedia | ((prev: IPortfolioMedia) => IPortfolioMedia)) => void;
    editMode: boolean;
    portfolioId?: number | string;
}

interface MediaTabManualProps {
    portfolioMedia: IPortfolioMedia;
    setPortfolioMedia: (media: IPortfolioMedia | ((prev: IPortfolioMedia) => IPortfolioMedia)) => void;
    editMode: boolean;
    featuredImage?: Media | null;
    onFeaturedImageChange?: (media: Media | null) => void;
    portfolioId?: number | string;
}

type MediaTabProps = MediaTabFormProps | MediaTabManualProps;

export default function PortfolioMedia(props: MediaTabProps) {
    const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);

    const isFormApproach = 'form' in props;

    const formState = isFormApproach ? props.form.formState : { errors: {} };
    const setValue = isFormApproach ? props.form.setValue : null;
    const watch = isFormApproach ? props.form.watch : null;

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

    const formFeaturedImage = isFormApproach ? watch?.("featuredImage") : undefined;
    const currentFeaturedImage = isFormApproach ? formFeaturedImage : manualFeaturedImage || portfolioMedia?.featuredImage;

    const handleFeaturedImageSelect = (media: Media | Media[] | null) => {
        const selected = Array.isArray(media) ? media[0] || null : media;

        if (isFormApproach) {
            setValue?.("featuredImage", selected, { shouldValidate: true });
        } else {
            onFeaturedImageChange?.(selected);
        }

        setPortfolioMedia?.(prev => ({
            ...prev,
            featuredImage: selected
        }));

        setIsMediaModalOpen(false);
    };

    const handleRemoveFeaturedImage = () => {
        if (isFormApproach) {
            setValue?.("featuredImage", null, { shouldValidate: true });
        } else {
            onFeaturedImageChange?.(null);
        }

        setPortfolioMedia?.(prev => ({
            ...prev,
            featuredImage: null
        }));
    };

    const totalMediaCount = getModuleMediaCount(portfolioMedia);

    return (
        <TabsContent value="media" className="mt-0 space-y-6">
            <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1 min-w-0 space-y-6">
                    <PortfolioMediaImages
                        imageGallery={portfolioMedia?.imageGallery || []}
                        onMediaSelect={(media) => setPortfolioMedia?.(prev => ({ ...prev, imageGallery: media }))}
                        editMode={editMode}
                        portfolioId={portfolioId}
                        totalMediaCount={totalMediaCount}
                    />

                    <PortfolioMediaOther
                        videoGallery={portfolioMedia?.videoGallery || []}
                        audioGallery={portfolioMedia?.audioGallery || []}
                        pdfDocuments={portfolioMedia?.pdfDocuments || []}
                        onVideoSelect={(media) => setPortfolioMedia?.(prev => ({ ...prev, videoGallery: media }))}
                        onAudioSelect={(media) => setPortfolioMedia?.(prev => ({ ...prev, audioGallery: media }))}
                        onPdfSelect={(media) => setPortfolioMedia?.(prev => ({ ...prev, pdfDocuments: media }))}
                        editMode={editMode}
                        portfolioId={portfolioId}
                        totalMediaCount={totalMediaCount}
                    />
                </div>

                <div className="w-full lg:w-80 xl:w-96 lg:shrink-0">
                    <PortfolioMediaFeatured
                        currentFeaturedImage={currentFeaturedImage || null}
                        editMode={editMode}
                        isMediaModalOpen={isMediaModalOpen}
                        setIsMediaModalOpen={setIsMediaModalOpen}
                        handleFeaturedImageSelect={handleFeaturedImageSelect}
                        handleRemoveFeaturedImage={handleRemoveFeaturedImage}
                        hasError={!!(formState.errors as any)?.featuredImage}
                        errorMessage={(formState.errors as any)?.featuredImage?.message}
                        portfolioId={portfolioId}
                    />
                </div>
            </div>
        </TabsContent>
    );
}