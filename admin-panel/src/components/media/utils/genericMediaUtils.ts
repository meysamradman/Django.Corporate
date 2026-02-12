import type { Media } from "@/types/shared/media";

const createEmptyModuleMedia = (): GenericModuleMedia => ({
    featuredImage: null,
    imageGallery: [],
    videoGallery: [],
    audioGallery: [],
    pdfDocuments: []
});

const resolveMediaItem = (item: any): any => item.media || item.media_detail || item;

const resolveMediaType = (item: any, mediaItem: any): string => (
    item.media_type
    || item.file_type
    || mediaItem.media_type
    || mediaItem.file_type
    || mediaItem.type
    || mediaItem.kind
    || 'image'
);

const isFeaturedMediaItem = (item: any): boolean => Boolean(
    item.is_featured || item.featured || item.is_main_image || item.is_main
);

const extractMediaIdArray = (items: Media[] | undefined): number[] =>
    (items || []).map(m => m.id).filter(Boolean) as number[];

const extractCoverId = (item: Media): number | null | undefined => {
    if (!item.id || !item.cover_image) return undefined;
    return typeof item.cover_image === 'object' ? item.cover_image.id : item.cover_image;
};

/**
 * Generic structure for media galleries across different modules.
 */
export interface GenericModuleMedia {
    featuredImage: Media | null;
    imageGallery: Media[];
    videoGallery: Media[];
    audioGallery: Media[];
    pdfDocuments: Media[];
}

/**
 * Parses a flat list of media items from the backend into a structured media object.
 */
export function parseModuleMedia(media: any[]): GenericModuleMedia {
    const result: GenericModuleMedia = createEmptyModuleMedia();

    if (!Array.isArray(media)) return result;

    media.forEach((item: any, index: number) => {
        const mediaItem = resolveMediaItem(item);
        const type = resolveMediaType(item, mediaItem);

        console.log(`🔍 [parseModuleMedia][Item ${index}]`, {
            id: item.id,
            mediaItemId: mediaItem.id,
            detectedType: type,
            item,
            mediaItem
        });

        if (isFeaturedMediaItem(item)) {
            result.featuredImage = mediaItem;
        }

        switch (type) {
            case 'image':
                result.imageGallery.push(mediaItem);
                break;
            case 'video':
                result.videoGallery.push(mediaItem);
                break;
            case 'audio':
                result.audioGallery.push(mediaItem);
                break;
            case 'pdf':
            case 'document':
                result.pdfDocuments.push(mediaItem);
                break;
            default:
                console.warn(`⚠️ [parseModuleMedia] Unknown type "${type}" for item ${item.id}, defaulting to imageGallery`);
                result.imageGallery.push(mediaItem);
        }
    });

    console.log("📦 [parseModuleMedia] Final Result:", result);
    return result;
}

/**
 * Collects all media IDs from a structured module media object.
 */
export function collectModuleMediaIds(moduleMedia: GenericModuleMedia): number[] {
    const ids = new Set<number>();

    console.log('📊 [collectModuleMediaIds] Input:', {
        featuredImage: moduleMedia.featuredImage?.id,
        imageGallery: moduleMedia.imageGallery?.map(m => m.id),
        videoGallery: moduleMedia.videoGallery?.map(m => m.id),
        audioGallery: moduleMedia.audioGallery?.map(m => m.id),
        pdfDocuments: moduleMedia.pdfDocuments?.map(m => m.id)
    });

    if (moduleMedia.featuredImage?.id) ids.add(moduleMedia.featuredImage.id);

    moduleMedia.imageGallery?.forEach(m => m.id && ids.add(m.id));
    moduleMedia.videoGallery?.forEach(m => m.id && ids.add(m.id));
    moduleMedia.audioGallery?.forEach(m => m.id && ids.add(m.id));
    moduleMedia.pdfDocuments?.forEach(m => m.id && ids.add(m.id));

    const result = Array.from(ids);
    console.log('✅ [collectModuleMediaIds] Output:', result);
    return result;
}

/**
 * Collects media IDs segmented by type to avoid ID collisions between different media tables on the backend.
 */
export function collectSegmentedMediaIds(moduleMedia: GenericModuleMedia) {
    const imageIds = new Set<number>();
    if (moduleMedia.featuredImage?.id) imageIds.add(moduleMedia.featuredImage.id);
    moduleMedia.imageGallery?.forEach(m => m.id && imageIds.add(m.id));

    return {
        image_ids: Array.from(imageIds),
        video_ids: extractMediaIdArray(moduleMedia.videoGallery),
        audio_ids: extractMediaIdArray(moduleMedia.audioGallery),
        document_ids: extractMediaIdArray(moduleMedia.pdfDocuments),
    };
}

/**
 * Collects media covers segmented by type to avoid ID collisions.
 */
export function collectSegmentedMediaCovers(moduleMedia: GenericModuleMedia) {
    const segmentedCovers = {
        image_covers: {} as Record<number, number | null>,
        video_covers: {} as Record<number, number | null>,
        audio_covers: {} as Record<number, number | null>,
        document_covers: {} as Record<number, number | null>,
    };

    const process = (items: Media[] | undefined, target: Record<number, number | null>) => {
        items?.forEach(item => {
            const coverId = extractCoverId(item);
            if (item.id && coverId !== undefined) {
                target[item.id] = coverId;
            }
        });
    };

    process(moduleMedia.imageGallery, segmentedCovers.image_covers);
    process(moduleMedia.videoGallery, segmentedCovers.video_covers);
    process(moduleMedia.audioGallery, segmentedCovers.audio_covers);
    process(moduleMedia.pdfDocuments, segmentedCovers.document_covers);

    return segmentedCovers;
}

/**
 * Collects cover images for media items (Flat version - legacy).
 */
export function collectModuleMediaCovers(moduleMedia: GenericModuleMedia): Record<number, number | null> {
    const covers: Record<number, number | null> = {};

    const processItem = (item: Media) => {
        const coverId = extractCoverId(item);
        if (item.id && coverId !== undefined) {
            covers[item.id] = coverId;
        }
    };

    moduleMedia.imageGallery?.forEach(processItem);
    moduleMedia.videoGallery?.forEach(processItem);
    moduleMedia.audioGallery?.forEach(processItem);
    moduleMedia.pdfDocuments?.forEach(processItem);

    return covers;
}

/**
 * Calculates total media count for limit enforcement.
 */
export function getModuleMediaCount(moduleMedia: GenericModuleMedia): number {
    let count = moduleMedia.featuredImage ? 1 : 0;
    count += (moduleMedia.imageGallery?.length || 0);
    count += (moduleMedia.videoGallery?.length || 0);
    count += (moduleMedia.audioGallery?.length || 0);
    count += (moduleMedia.pdfDocuments?.length || 0);
    return count;
}
