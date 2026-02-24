import { Card, CardContent, CardHeader, CardTitle } from "@/components/elements/Card";
import type { Blog } from "@/types/blog/blog";
import { Badge } from "@/components/elements/Badge";
import { FolderOpen, Image as ImageIcon, Video as VideoIcon, Music, FileText } from "lucide-react";

interface BlogMediaSummaryProps {
    blog: Blog;
}

export function BlogMediaSummary({ blog }: BlogMediaSummaryProps) {
    const allMedia = blog.blog_media || [];
    const imagesCount = allMedia.filter(
        (item: any) => (item.media_detail || item.media)?.media_type === "image"
    ).length;
    const videosCount = allMedia.filter(
        (item: any) => (item.media_detail || item.media)?.media_type === "video"
    ).length;
    const audiosCount = allMedia.filter(
        (item: any) => (item.media_detail || item.media)?.media_type === "audio"
    ).length;
    const documentsCount = allMedia.filter(
        (item: any) => {
            const m = item.media_detail || item.media;
            return m?.media_type === "document" || m?.media_type === "pdf";
        }
    ).length;

    return (
        <Card className="gap-0">
            <CardHeader className="border-b">
                <CardTitle className="flex items-center justify-between">
                    <span>خلاصه رسانه‌ها</span>
                    <Badge variant="blue">{allMedia.length} فایل</Badge>
                </CardTitle>
            </CardHeader>
            <CardContent>
            <div className="grid grid-cols-2 gap-3 h-full content-start">
                <div className="flex items-center justify-between p-3 bg-bg/40 rounded-xl border border-br/30 group">
                    <div className="flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-blue-1 opacity-70" />
                        <span className="text-xs font-bold text-font-s">تصویر</span>
                    </div>
                    <span className="font-bold text-font-p">{imagesCount}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-bg/40 rounded-xl border border-br/30 group">
                    <div className="flex items-center gap-2">
                        <VideoIcon className="w-4 h-4 text-purple-1 opacity-70" />
                        <span className="text-xs font-bold text-font-s">ویدیو</span>
                    </div>
                    <span className="font-bold text-font-p">{videosCount}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-bg/40 rounded-xl border border-br/30 group">
                    <div className="flex items-center gap-2">
                        <Music className="w-4 h-4 text-pink-1 opacity-70" />
                        <span className="text-xs font-bold text-font-s">صدا</span>
                    </div>
                    <span className="font-bold text-font-p">{audiosCount}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-bg/40 rounded-xl border border-br/30 group">
                    <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-1 opacity-70" />
                        <span className="text-xs font-bold text-font-s">سند</span>
                    </div>
                    <span className="font-bold text-font-p">{documentsCount}</span>
                </div>
            </div>
            </CardContent>
        </Card>
    );
}
