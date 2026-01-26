import { TabsContent } from "@/components/elements/Tabs";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import type { Property } from "@/types/real_estate/realEstate";
import { MediaImage } from "@/components/media/base/MediaImage";
import { mediaService } from "@/components/media/services";
import { FileText, Music } from "lucide-react";

interface MediaInfoTabProps {
  property: Property;
}

export function RealEstateMedia({ property }: MediaInfoTabProps) {
  const renderMediaGrid = (mediaArray: any[], type: string) => {
    if (!mediaArray || mediaArray.length === 0) {
      return (
        <div className="text-center py-8 text-font-s">
          {type === "audio" && "فایل صوتی آپلود نشده است"}
          {type === "document" && "سندی آپلود نشده است"}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {mediaArray.map((item: any) => {
          const media = item.media_detail || item.media || item;
          
          const mediaUrl = media?.cover_image_url || media?.cover_image?.file_url || media?.file_url || media?.url || null;
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
                  {type === "audio" && <Music className="w-8 h-8 text-font-s" />}
                  {type === "document" && <FileText className="w-8 h-8 text-font-s" />}
                </div>
              )}
              <div className="absolute inset-0 bg-linear-to-t from-static-b/80 via-static-b/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-3">
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

  const allMedia = property.media || property.property_media || [];
  
  // فایل‌های صوتی
  const audios = allMedia.filter((item: any) => {
    const media = item.media_detail || item.media || item;
    return media?.media_type === 'audio';
  });
  
  // اسناد (PDF)
  const documents = allMedia.filter((item: any) => {
    const media = item.media_detail || item.media || item;
    return media?.media_type === 'document' || media?.media_type === 'pdf';
  });

  return (
    <TabsContent value="media" className="mt-0 space-y-6">
      <div className="grid grid-cols-1 gap-6">
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
          iconBgColor="bg-orange"
          iconColor="stroke-orange-2"
          borderColor="border-b-orange-1"
          titleExtra={<span className="text-font-s">{documents.length} مورد</span>}
        >
          {renderMediaGrid(documents, "document")}
        </CardWithIcon>
      </div>
    </TabsContent>
  );
}

