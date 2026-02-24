
import type { Property } from "@/types/real_estate/realEstate";
import { Badge } from "@/components/elements/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/elements/Card";
import { ImageIcon, Video, Music, FileText } from "lucide-react";

interface PropertyMediaSummaryProps {
    property: Property;
}

export function RealEstateMediaSummary({ property }: PropertyMediaSummaryProps) {
    const allMedia = property.media || property.property_media || [];

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
            const media = item.media_detail || item.media;
            return media?.media_type === "document" || media?.media_type === "pdf";
        }
    ).length;

    return (
        <Card className="gap-0 shadow-sm">
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span>خلاصه رسانه‌ها</span>
                    <Badge variant="blue">{property.media_count || 0} فایل</Badge>
                </CardTitle>
            </CardHeader>
            <CardContent>
            <div className="grid grid-cols-2 gap-3 h-full content-start">
                <div className="flex items-center justify-between p-3 bg-bg rounded-xl border border-br/50 group">
                    <div className="flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-blue-1 opacity-70" />
                        <span className="text-xs font-bold text-font-s">تصویر</span>
                    </div>
                    <span className="font-bold text-font-p">{imagesCount}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-bg rounded-xl border border-br/50 group">
                    <div className="flex items-center gap-2">
                        <Video className="w-4 h-4 text-purple-1 opacity-70" />
                        <span className="text-xs font-bold text-font-s">ویدیو</span>
                    </div>
                    <span className="font-bold text-font-p">{videosCount}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-bg rounded-xl border border-br/50 group">
                    <div className="flex items-center gap-2">
                        <Music className="w-4 h-4 text-pink-1 opacity-70" />
                        <span className="text-xs font-bold text-font-s">صدا</span>
                    </div>
                    <span className="font-bold text-font-p">{audiosCount}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-bg rounded-xl border border-br/50 group">
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
