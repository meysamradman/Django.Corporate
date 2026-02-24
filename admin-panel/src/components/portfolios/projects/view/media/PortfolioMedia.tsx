
import {
    FileText
} from "lucide-react";
import type { Portfolio } from "@/types/portfolio/portfolio";
import { mediaService } from "@/components/media/services";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/elements/Card";
import { Badge } from "@/components/elements/Badge";
import { AudioPlayer } from "@/components/media/audios/AudioPlayer";
import { VideoPlayer } from "@/components/media/videos/VideoPlayer";
import { DocumentItem } from "@/components/media/documents/DocumentItem";
import { cn } from "@/core/utils/cn";

interface PortfolioMediaProps {
    portfolio: Portfolio;
}

export function PortfolioMedia({ portfolio }: PortfolioMediaProps) {
    const allMedia = portfolio.portfolio_media || [];

    const videos = allMedia.filter((item: any) => {
        const media = item.media_detail || item.media;
        return media?.media_type === 'video';
    });

    const audios = allMedia.filter((item: any) => {
        const media = item.media_detail || item.media;
        return media?.media_type === 'audio';
    });

    const documents = allMedia.filter((item: any) => {
        const media = item.media_detail || item.media;
        return media?.media_type === 'document' || media?.media_type === 'pdf';
    });

    const formatSize = (bytes: number) => {
        if (!bytes) return 'N/A';
        const mb = bytes / (1024 * 1024);
        return `${mb.toFixed(2)} MB`;
    };

    const hasMedia = videos.length > 0 || audios.length > 0 || documents.length > 0;

    if (!hasMedia) return null;

    return (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-stretch">
            {videos.length > 0 && (
                <div className="flex flex-col">
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
                </div>
            )}

            {(documents.length > 0 || audios.length > 0) && (
                <div className="flex flex-col">
                    <Card className="gap-0 w-full shadow-sm h-full flex flex-col">
                        <CardHeader className="border-b">
                            <CardTitle className="flex items-center justify-between">
                                <span>اسناد و پادکست آموزشی</span>
                                <div className="flex gap-2">
                                    {documents.length > 0 && (
                                        <Badge variant="purple" className="h-5 px-2 text-[10px] font-black bg-purple-1/10 text-purple-1 border-purple-1/20">
                                            {documents.length.toLocaleString('fa-IR')} سند
                                        </Badge>
                                    )}
                                    {audios.length > 0 && (
                                        <Badge variant="blue" className="h-5 px-2 text-[10px] font-black bg-blue-1/10 text-blue-1 border-blue-1/20">
                                            {audios.length.toLocaleString('fa-IR')} صوت
                                        </Badge>
                                    )}
                                </div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 h-full flex flex-col gap-6">
                            {audios.length > 0 && (
                            <div className="flex flex-col gap-4">
                                <label className="text-[10px] font-black text-font-s tracking-widest mb-1">فایل‌های صوتی</label>
                                <div className="flex flex-col gap-3">
                                    {audios.map((item: any) => {
                                        const media = item.media_detail || item.media;
                                        return (
                                            <AudioPlayer
                                                key={item.id}
                                                src={mediaService.getMediaUrlFromObject(media)}
                                                title={media.title || 'پادکست/توضیحات صوتی'}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                            )}

                            {documents.length > 0 && (
                                <div className="flex flex-col gap-3 flex-1">
                                    <label className="text-[10px] font-bold text-font-s tracking-widest mb-1">ضمائم و اسناد فنی</label>
                                    <div className="flex flex-col gap-2.5">
                                        {documents.map((item: any) => {
                                            const media = item.media_detail || item.media;
                                            return (
                                                <DocumentItem
                                                    key={item.id}
                                                    title={media.title || 'سند پروژه'}
                                                    fileUrl={media.file_url}
                                                    fileSize={media.file_size}
                                                    downloadUrl={mediaService.getMediaUrlFromObject(media)}
                                                />
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            <div className="mt-auto p-4 rounded-xl bg-purple-0/20 border border-purple-1/10 border-dashed">
                                <p className="text-[9.5px] font-bold text-purple-1/60 leading-relaxed text-center">
                                    تمامی اسناد بر روی سرورهای امن ذخیره شده و فقط برای مدیران و کاربران مجاز قابل دسترس هستند.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
