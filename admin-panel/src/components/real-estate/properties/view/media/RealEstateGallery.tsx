
import { mediaService } from "@/components/media/services";
import type { Property } from "@/types/real_estate/realEstate";
import { MediaGridGallery, type MediaItem } from "@/components/media/view/MediaGridGallery";

interface RealEstateGalleryProps {
    property: Property;
    className?: string;
}

export function RealEstateGallery({ property, className }: RealEstateGalleryProps) {
    const allMedia = property.media || property.property_media || [];

    const galleryItems = allMedia
        .filter((item: any) => {
            const media = item.media_detail || item.media || item;
            return media?.media_type === 'image';
        })
        .map((item: any) => {
            const media = item.media_detail || item.media || item;
            const mediaUrl = media?.file_url || media?.url || null;
            const fullUrl = mediaUrl ? mediaService.getMediaUrlFromObject({ file_url: mediaUrl } as any) : null;

            return {
                id: item.id,
                type: 'image' as const,
                url: fullUrl || '',
                title: media?.title || `تصویر ${item.id}`,
                alt: media?.title || property.title || 'تصویر ملک',
                isMainMedia: item.is_main_image || false,
            };
        })
        .filter((item: any) => item.url !== '');

    const mediaItems: MediaItem[] = [];

    if (property.main_image?.file_url || property.main_image?.url) {
        const mainImageUrl = mediaService.getMediaUrlFromObject(property.main_image as any);
        if (mainImageUrl) {
            mediaItems.push({
                id: `main-${property.main_image.id || 0}`,
                type: 'image' as const,
                url: mainImageUrl,
                title: property.main_image.title || 'عکس شاخص',
                alt: property.main_image.alt_text || property.title || 'عکس شاخص ملک',
                isMainMedia: true,
            });
        }
    }

    galleryItems.forEach(item => {
        if (!item.isMainMedia && !mediaItems.find(mi => mi.url === item.url)) {
            mediaItems.push(item);
        }
    });

    return (
        <MediaGridGallery
            items={mediaItems}
            title={property.title}
            className={className}
        />
    );
}
