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
        <div className="text-center py-8 text-muted-foreground italic">
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
          const mediaUrl = media?.file_url || media?.cover_image_url;
          const fullUrl = mediaUrl ? mediaService.getMediaUrlFromObject({ file_url: mediaUrl } as any) : null;

          return (
            <div
              key={item.id}
              className="relative aspect-square border rounded-lg overflow-hidden group"
            >
              {fullUrl ? (
                <MediaImage
                  media={{ file_url: fullUrl } as any}
                  alt={media?.title || `${type} ${item.id}`}
                  className="object-cover"
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
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <p className="text-white text-sm text-center px-2">
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
    return media?.media_type === 'document';
  });

  return (
    <TabsContent value="media" className="mt-6 space-y-6">
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="w-5 h-5" />
              تصاویر ({images.length})
            </CardTitle>
          </CardHeader>
          <CardContent>{renderMediaGrid(images, "image")}</CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="w-5 h-5" />
              ویدیوها ({videos.length})
            </CardTitle>
          </CardHeader>
          <CardContent>{renderMediaGrid(videos, "video")}</CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Music className="w-5 h-5" />
              فایل‌های صوتی ({audios.length})
            </CardTitle>
          </CardHeader>
          <CardContent>{renderMediaGrid(audios, "audio")}</CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              اسناد ({documents.length})
            </CardTitle>
          </CardHeader>
          <CardContent>{renderMediaGrid(documents, "document")}</CardContent>
        </Card>
      </div>
    </TabsContent>
  );
}
