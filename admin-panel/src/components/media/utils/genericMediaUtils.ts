import type { Media } from "@/types/shared/media";

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
    const result: GenericModuleMedia = {
        featuredImage: null,
        imageGallery: [],
        videoGallery: [],
        audioGallery: [],
        pdfDocuments: []
    };

    if (!Array.isArray(media)) return result;

    media.forEach((item: any) => {
        const type = item.media_type || item.file_type || 'image';
        const mediaItem = item.media || item;

        if (item.is_featured || item.featured) {
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
                result.imageGallery.push(mediaItem);
        }
    });

    return result;
}

/**
 * Collects all media IDs from a structured module media object.
 */
export function collectModuleMediaIds(moduleMedia: GenericModuleMedia): number[] {
    const ids = new Set<number>();

    if (moduleMedia.featuredImage?.id) ids.add(moduleMedia.featuredImage.id);

    moduleMedia.imageGallery?.forEach(m => m.id && ids.add(m.id));
    moduleMedia.videoGallery?.forEach(m => m.id && ids.add(m.id));
    moduleMedia.audioGallery?.forEach(m => m.id && ids.add(m.id));
    moduleMedia.pdfDocuments?.forEach(m => m.id && ids.add(m.id));

    return Array.from(ids);
}

/**
 * Collects cover images for media items.
 */
export function collectModuleMediaCovers(moduleMedia: GenericModuleMedia): Record<number, number | null> {
    const covers: Record<number, number | null> = {};

    const processItem = (item: Media) => {
        if (item.id && item.cover_image) {
            covers[item.id] = typeof item.cover_image === 'object' ? item.cover_image.id : item.cover_image;
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
