
import { Video as VideoIcon } from "lucide-react";
import type { Property } from "@/types/real_estate/realEstate";
import { mediaService } from "@/components/media/services";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { VideoPlayer } from "@/components/media/videos/VideoPlayer";
import { cn } from "@/core/utils/cn";

interface RealEstateVideoProps {
    property: Property;
}

export function RealEstateVideo({ property }: RealEstateVideoProps) {
    const allMedia = property.media || property.property_media || [];
    const videos = allMedia.filter((item: any) => (item.media_detail || item.media || item)?.media_type === 'video');

    const formatSize = (bytes: number) => {
        if (!bytes) return 'N/A';
        const mb = bytes / (1024 * 1024);
        return `${mb.toFixed(2)} MB`;
    };

    if (videos.length === 0) return null;

    return (
        <div className="flex flex-col">
            <CardWithIcon
                icon={VideoIcon}
                title={videos.length > 1 ? "ویدئوهای معرفی ملک" : "ویدئوی معرفی ملک"}
                iconBgColor="bg-blue-0/50"
                iconColor="text-blue-1"
                cardBorderColor="border-b-blue-1"
                className="w-full shadow-sm h-full flex flex-col"
                contentClassName="p-0 flex-1 flex flex-col justify-center"
            >
                <div className={cn("w-full flex-1 flex flex-col justify-center", videos.length > 1 ? "grid grid-cols-1 sm:grid-cols-2 gap-4" : "")}>
                    {videos.map((item: any) => {
                        const media = item.media_detail || item.media || item;
                        const coverUrl = mediaService.getMediaCoverUrl(media);

                        return (
                            <VideoPlayer
                                key={item.id}
                                src={mediaService.getMediaUrlFromObject(media)}
                                poster={coverUrl}
                                title={media.title || 'ویدئو ملک'}
                                size={formatSize(media.file_size)}
                                variant={videos.length === 1 ? "featured" : "default"}
                                className="h-full"
                            />
                        );
                    })}
                </div>
            </CardWithIcon>
        </div>
    );
}
