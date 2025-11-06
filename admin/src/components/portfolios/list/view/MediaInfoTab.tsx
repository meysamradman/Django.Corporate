"use client";

import { TabsContent } from "@/components/elements/Tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/elements/Card";
import { Portfolio } from "@/types/portfolio/portfolio";
import { MediaImage } from "@/components/media/base/MediaImage";
import { mediaService } from "@/components/media/services";
import { Image, Video, Music, FileText } from "lucide-react";

interface MediaInfoTabProps {
  portfolio: Portfolio;
}

export function MediaInfoTab({ portfolio }: MediaInfoTabProps) {
  const renderMediaGrid = (mediaArray: any[], type: string) => {
    if (!mediaArray || mediaArray.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          {type === "image" && "تصویری آپلود نشده است"}
          {type === "video" && "ویدیویی آپلود نشده است"}
          {type === "audio" && "فایل صوتی آپلود نشده است"}
          {type === "document" && "سندی آپلود نشده است"}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {mediaArray.map((item: any) => {
          const media = item.media_detail || item.media;
          
          // For images, use file_url directly
          // For videos, audios, and documents, prioritize cover_image_url, then fallback to file_url
          let mediaUrl: string | null = null;
          if (type === "image") {
            mediaUrl = media?.file_url || null;
          } else {
            // For video, audio, and document: prioritize cover_image_url
            mediaUrl = media?.cover_image_url || media?.file_url || null;
          }
          
          const fullUrl = mediaUrl ? mediaService.getMediaUrlFromObject({ file_url: mediaUrl } as any) : null;

          return (
            <div
              key={item.id}
              className="relative aspect-square border rounded-lg overflow-hidden group cursor-pointer hover:border-primary transition-all shadow-sm hover:shadow-md"
            >
              {fullUrl ? (
                <MediaImage
                  media={{ file_url: fullUrl } as any}
                  alt={media?.title || `${type} ${item.id}`}
                  className="object-cover transition-transform group-hover:scale-110"
                  fill
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted">
                  {type === "image" && <Image className="w-8 h-8 text-muted-foreground" />}
                  {type === "video" && <Video className="w-8 h-8 text-muted-foreground" />}
                  {type === "audio" && <Music className="w-8 h-8 text-muted-foreground" />}
                  {type === "document" && <FileText className="w-8 h-8 text-muted-foreground" />}
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-3">
                <p className="text-white text-center line-clamp-2">
                  {media?.title || `رسانه ${item.id}`}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const allMedia = portfolio.portfolio_media || [];
  
  const images = allMedia.filter((item: any) => {
    const media = item.media_detail || item.media;
    return media?.media_type === 'image';
  });
  
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

  return (
    <TabsContent value="media" className="mt-0 space-y-6">
      <div className="grid grid-cols-1 gap-6">
        <Card className="hover:shadow-lg transition-all duration-300 border-b-4 border-b-indigo-500">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-100 rounded-xl shadow-sm">
                  <Image className="w-5 h-5 stroke-indigo-600" />
                </div>
                <span>تصاویر</span>
              </div>
              <span className="text-muted-foreground">
                {images.length} مورد
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>{renderMediaGrid(images, "image")}</CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300 border-b-4 border-b-purple-500">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-purple-100 rounded-xl shadow-sm">
                  <Video className="w-5 h-5 stroke-purple-600" />
                </div>
                <span>ویدیوها</span>
              </div>
              <span className="text-muted-foreground">
                {videos.length} مورد
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>{renderMediaGrid(videos, "video")}</CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300 border-b-4 border-b-rose-500">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-100 rounded-xl shadow-sm">
                  <Music className="w-5 h-5 stroke-rose-600" />
                </div>
                <span>فایل‌های صوتی</span>
              </div>
              <span className="text-muted-foreground">
                {audios.length} مورد
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>{renderMediaGrid(audios, "audio")}</CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300 border-b-4 border-b-gray-500">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gray-100 rounded-xl shadow-sm">
                  <FileText className="w-5 h-5 stroke-gray-600" />
                </div>
                <span>اسناد</span>
              </div>
              <span className="text-muted-foreground">
                {documents.length} مورد
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>{renderMediaGrid(documents, "document")}</CardContent>
        </Card>
      </div>
    </TabsContent>
  );
}
