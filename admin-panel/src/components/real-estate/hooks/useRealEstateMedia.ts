import { useState, useCallback } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { PropertyMedia } from "@/types/real_estate/realEstateMedia";
import type { Media } from "@/types/shared/media";
import {
    collectModuleMediaIds as collectMediaIds,
    collectModuleMediaCovers as collectMediaCovers,
    collectSegmentedMediaIds
} from "@/components/media/utils/genericMediaUtils";
import type { PropertyFormValues } from "../validations/propertySchema";


interface UseRealEstateMediaProps {
    form: UseFormReturn<PropertyFormValues>;
    initialMedia?: PropertyMedia;
}

export function useRealEstateMedia({ form, initialMedia }: UseRealEstateMediaProps) {
    const [propertyMedia, setPropertyMedia] = useState<PropertyMedia>(initialMedia || {
        featuredImage: null,
        imageGallery: [],
        videoGallery: [],
        audioGallery: [],
        pdfDocuments: []
    });

    const updateMediaFormState = useCallback((newMedia: PropertyMedia) => {
        const allMediaIds = collectMediaIds(newMedia);
        // Avoid losing og_image if it's set manually
        const currentOgImageId = form.getValues("og_image_id");
        if (currentOgImageId && !allMediaIds.includes(currentOgImageId)) {
            allMediaIds.push(currentOgImageId);
        }

        const mediaCovers = collectMediaCovers(newMedia);
        const segmented = collectSegmentedMediaIds(newMedia);

        form.setValue("media_ids", allMediaIds, { shouldValidate: false, shouldDirty: true });
        form.setValue("media_covers", mediaCovers, { shouldValidate: false, shouldDirty: true });

        // Set segmented fields
        form.setValue("image_ids", segmented.image_ids, { shouldValidate: false, shouldDirty: true });
        form.setValue("video_ids", segmented.video_ids, { shouldValidate: false, shouldDirty: true });
        form.setValue("audio_ids", segmented.audio_ids, { shouldValidate: false, shouldDirty: true });
        form.setValue("document_ids", segmented.document_ids, { shouldValidate: false, shouldDirty: true });
    }, [form]);

    const handleFeaturedImageChange = useCallback((media: Media | null) => {
        setPropertyMedia(prev => {
            const newState = { ...prev, featuredImage: media };
            updateMediaFormState(newState);
            return newState;
        });
        form.setValue("main_image_id", media?.id || null, { shouldValidate: false, shouldDirty: true });
    }, [form, updateMediaFormState]);

    const handleGalleryChange = useCallback((media: Media[]) => {
        setPropertyMedia(prev => {
            const newState = { ...prev, imageGallery: media };
            updateMediaFormState(newState);
            return newState;
        });
    }, [updateMediaFormState]);

    const handleVideoGalleryChange = useCallback((media: Media[]) => {
        setPropertyMedia(prev => {
            const newState = { ...prev, videoGallery: media };
            updateMediaFormState(newState);
            return newState;
        });
    }, [updateMediaFormState]);

    const handleAudioGalleryChange = useCallback((media: Media[]) => {
        setPropertyMedia(prev => {
            const newState = { ...prev, audioGallery: media };
            updateMediaFormState(newState);
            return newState;
        });
    }, [updateMediaFormState]);

    const handlePdfDocumentsChange = useCallback((media: Media[]) => {
        setPropertyMedia(prev => {
            const newState = { ...prev, pdfDocuments: media };
            updateMediaFormState(newState);
            return newState;
        });
    }, [updateMediaFormState]);

    return {
        propertyMedia,
        setPropertyMedia,
        handleFeaturedImageChange,
        handleGalleryChange,
        handleVideoGalleryChange,
        handleAudioGalleryChange,
        handlePdfDocumentsChange,
        updateMediaFormState
    };
}
