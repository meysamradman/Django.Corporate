import { TabsContent } from "@/components/elements/Tabs";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import type { Portfolio } from "@/types/portfolio/portfolio";
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
        <div className="text-center py-8 text-font-s">
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
          
          let mediaUrl: string | null = null;
          if (type === "image") {
            mediaUrl = media?.file_url || null;
          } else {
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
                <div className="w-full h-full flex items-center justify-center bg-bg">
                  {type === "image" && <Image className="w-8 h-8 text-font-s" />}
                  {type === "video" && <Video className="w-8 h-8 text-font-s" />}
                  {type === "audio" && <Music className="w-8 h-8 text-font-s" />}
                  {type === "document" && <FileText className="w-8 h-8 text-font-s" />}
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-static-b/80 via-static-b/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-3">
                <p className="text-static-w text-center line-clamp-2">
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
        <CardWithIcon
          icon={Image}
          title="تصاویر"
          iconBgColor="bg-blue"
          iconColor="stroke-blue-2"
          borderColor="border-b-blue-1"
          titleExtra={<span className="text-font-s">{images.length} مورد</span>}
        >
          {renderMediaGrid(images, "image")}
        </CardWithIcon>

        <CardWithIcon
          icon={Video}
          title="ویدیوها"
          iconBgColor="bg-purple"
          iconColor="stroke-purple-2"
          borderColor="border-b-purple-1"
          titleExtra={<span className="text-font-s">{videos.length} مورد</span>}
        >
          {renderMediaGrid(videos, "video")}
        </CardWithIcon>

        <CardWithIcon
          icon={Music}
          title="فایل‌های صوتی"
          iconBgColor="bg-pink"
          iconColor="stroke-pink-2"
          borderColor="border-b-pink-1"
          titleExtra={<span className="text-font-s">{audios.length} مورد</span>}
        >
          {renderMediaGrid(audios, "audio")}
        </CardWithIcon>

        <CardWithIcon
          icon={FileText}
          title="اسناد"
          iconBgColor="bg-gray"
          iconColor="stroke-gray-2"
          borderColor="border-b-gray-1"
          titleExtra={<span className="text-font-s">{documents.length} مورد</span>}
        >
          {renderMediaGrid(documents, "document")}
        </CardWithIcon>
      </div>
    </TabsContent>
  );
}
