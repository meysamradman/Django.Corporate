
import { mediaService } from "@/components/media/services";
import type { Portfolio } from "@/types/portfolio/portfolio";
import { MediaGridGallery, type MediaItem } from "@/components/media/view/MediaGridGallery";

interface PortfolioGalleryProps {
    portfolio: Portfolio;
    className?: string;
}

export function PortfolioGallery({ portfolio, className }: PortfolioGalleryProps) {
    const allMedia = portfolio.portfolio_media || [];

    const galleryItems = allMedia
        .filter((item: any) => {
            const media = item.media_detail || item.media || item;
            return media?.media_type === 'image';
        })
        .map((item: any) => {
            const media = item.media_detail || item.media || item;
            const mediaUrl = media?.file_url || media?.url || null;
            const fullUrl = mediaUrl ? mediaService.getMediaUrlFromObject({ file_url: mediaUrl } as any) : null;
            const coverUrl = media?.cover_image?.file_url ? mediaService.getMediaUrlFromObject({ file_url: media.cover_image.file_url } as any) : null;

            return {
                id: item.id,
                type: (media?.media_type || 'image') as 'image' | 'video',
                url: fullUrl || '',
                coverUrl: coverUrl || fullUrl || '',
                title: media?.title || `${media?.media_type === 'video' ? 'ویدئو' : 'تصویر'} ${item.id}`,
                alt: media?.title || portfolio.title || 'رسانه نمونه‌کار',
                isMainMedia: item.is_main || item.is_main_image || false,
            };
        })
        .filter((item: any) => item.url !== '');

    const mediaItems: MediaItem[] = [];

    if (portfolio.main_image?.file_url) {
        const mainImageUrl = mediaService.getMediaUrlFromObject(portfolio.main_image as any);
        if (mainImageUrl) {
            mediaItems.push({
                id: `main-${portfolio.main_image.id || 0}`,
                type: 'image' as const,
                url: mainImageUrl,
                coverUrl: mainImageUrl,
                title: portfolio.main_image.title || 'عکس شاخص',
                alt: portfolio.main_image.alt_text || portfolio.title || 'عکس شاخص نمونه‌کار',
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
            title={portfolio.title}
            className={className}
        />
    );
}
