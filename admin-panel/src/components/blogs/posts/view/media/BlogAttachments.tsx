import { Card, CardContent, CardHeader, CardTitle } from "@/components/elements/Card";
import type { Blog } from "@/types/blog/blog";
import { mediaService } from "@/components/media/services";
import { Badge } from "@/components/elements/Badge";
import { AudioPlayer } from "@/components/media/audios/AudioPlayer";
import { DocumentItem } from "@/components/media/documents/DocumentItem";

interface BlogAttachmentsProps {
    blog: Blog;
}

export function BlogAttachments({ blog }: BlogAttachmentsProps) {
    const allMedia = blog.blog_media || [];

    const audios = allMedia.filter((item: any) => {
        const media = item.media_detail || item.media;
        return media?.media_type === 'audio';
    });

    const documents = allMedia.filter((item: any) => {
        const media = item.media_detail || item.media;
        return media?.media_type === 'document' || media?.media_type === 'pdf';
    });

    if (audios.length === 0 && documents.length === 0) return null;

    return (
        <Card className="gap-0 w-full shadow-sm h-full flex flex-col">
            <CardHeader className="border-b">
                <CardTitle className="flex items-center justify-between">
                    <span>اسناد و پادکست آموزشی</span>
                    <div className="flex gap-2">
                        {documents.length > 0 && (
                            <Badge variant="purple">
                                {documents.length.toLocaleString('fa-IR')} سند
                            </Badge>
                        )}
                        {audios.length > 0 && (
                            <Badge variant="blue">
                                {audios.length.toLocaleString('fa-IR')} صوت
                            </Badge>
                        )}
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6 h-full flex flex-col gap-8">
                {audios.length > 0 && (
                <div className="flex flex-col gap-4">
                    <label className="text-[10px] font-black text-font-s tracking-widest uppercase opacity-40 mb-1">فایل‌های صوتی (پادکست)</label>
                    <div className="flex flex-col gap-3">
                        {audios.map((item: any) => {
                            const media = item.media_detail || item.media;
                            return (
                                <AudioPlayer
                                    key={item.id}
                                    src={mediaService.getMediaUrlFromObject(media)}
                                    title={media.title || 'پادکست وبلاگ'}
                                />
                            );
                        })}
                    </div>
                </div>
                )}

                {documents.length > 0 && (
                    <div className="flex flex-col gap-4 flex-1">
                        <label className="text-[10px] font-black text-font-s tracking-widest uppercase opacity-40 mb-1">ضمائم و اسناد قابل دریافت</label>
                        <div className="flex flex-col gap-3">
                            {documents.map((item: any) => {
                                const media = item.media_detail || item.media;
                                return (
                                    <DocumentItem
                                        key={item.id}
                                        title={media.title || 'سند پیوست'}
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
                    <p className="text-[10px] font-bold text-purple-1/60 leading-relaxed text-center italic">
                        تمامی اسناد بر روی سرورهای امن ذخیره شده و فقط برای مدیران و کاربران مجاز قابل دسترس هستند.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
