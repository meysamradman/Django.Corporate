import { Video as VideoIcon } from "lucide-react";
import type { Portfolio } from "@/types/portfolio/portfolio";
import { mediaService } from "@/components/media/services";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/elements/Card";
import { VideoPlayer } from "@/components/media/videos/VideoPlayer";
import { cn } from "@/core/utils/cn";

interface PortfolioVideoProps {
    portfolio: Portfolio;
}

export function PortfolioVideo({ portfolio }: PortfolioVideoProps) {
    const allMedia = portfolio.portfolio_media || [];

    const videos = allMedia.filter((item: any) => {
        const media = item.media_detail || item.media;
        return media?.media_type === 'video';
    });

    const formatSize = (bytes: number) => {
        if (!bytes) return 'N/A';
        const mb = bytes / (1024 * 1024);
        return `${mb.toFixed(2)} MB`;
    };

    if (videos.length === 0) return null;

    return (
        <Card className="gap-0 w-full shadow-sm h-full flex flex-col">
            <CardHeader className="border-b">
                <CardTitle>{videos.length > 1 ? "ویدئوهای پروژه" : "ویدئوی معرفی پروژه"}</CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1 flex flex-col justify-center">
            <div className={cn("w-full flex-1 flex flex-col justify-center", videos.length > 1 ? "grid grid-cols-1 sm:grid-cols-2 gap-4 p-4" : "")}>
                {videos.map((item: any) => {
                    const media = item.media_detail || item.media;
                    const coverUrl = mediaService.getMediaCoverUrl(media);

                    return (
                        <VideoPlayer
                            key={item.id}
                            src={mediaService.getMediaUrlFromObject(media)}
                            poster={coverUrl}
                            title={media.title || 'ویدئو پروژه'}
                            size={formatSize(media.file_size)}
                            variant={videos.length === 1 ? "featured" : "default"}
                            className="h-full"
                        />
                    );
                })}
            </div>
            </CardContent>
        </Card>
    );
}
