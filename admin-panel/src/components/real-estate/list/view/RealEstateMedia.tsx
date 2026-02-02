
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
        <div className="flex flex-col items-center justify-center py-16 text-font-s/40 border-2 border-dashed border-br rounded-3xl bg-bg/20">
          <div className="p-4 rounded-full bg-bg mb-3">
            {type === "audio" && <Music className="w-8 h-8 opacity-20" />}
            {type === "document" && <FileText className="w-8 h-8 opacity-20" />}
          </div>
          <p className="text-sm font-black italic">
            {type === "audio" && "فایل صوتی برای این ملک آپلود نشده است"}
            {type === "document" && "سندی برای این ملک آپلود نشده است"}
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {mediaArray.map((item: any) => {
          const media = item.media_detail || item.media || item;
          const mediaUrl = media?.cover_image_url || media?.cover_image?.file_url || media?.file_url || media?.url || null;
          const fullUrl = mediaUrl ? mediaService.getMediaUrlFromObject({ file_url: mediaUrl } as any) : null;

          return (
            <div
              key={item.id}
              className="group relative bg-bg/40 border border-br rounded-2xl overflow-hidden hover:border-blue-1/40 hover:bg-card transition-all duration-500 shadow-xs hover:shadow-xl"
            >
              <div className="aspect-square relative flex items-center justify-center overflow-hidden">
                {fullUrl ? (
                  <MediaImage
                    media={{ file_url: fullUrl } as any}
                    alt={media?.title || `${type} ${item.id}`}
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    fill
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-linear-to-br from-bg to-br/40">
                    <div className="p-4 rounded-full bg-card shadow-sm mb-2 group-hover:scale-110 transition-transform duration-500">
                      {type === "audio" && <Music className="w-8 h-8 text-pink-1" />}
                      {type === "document" && <FileText className="w-8 h-8 text-orange-1" />}
                    </div>
                  </div>
                )}

                <div className="absolute inset-x-0 bottom-0 p-5 bg-linear-to-t from-static-b/90 via-static-b/40 to-transparent translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500">
                  <p className="text-[11px] font-black text-static-w line-clamp-2 text-center leading-relaxed">
                    {media?.title || `رسانه ${item.id}`}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const allMedia = property.media || property.property_media || [];
  const audios = allMedia.filter((item: any) => (item.media_detail || item.media || item)?.media_type === 'audio');
  const documents = allMedia.filter((item: any) => {
    const type = (item.media_detail || item.media || item)?.media_type;
    return type === 'document' || type === 'pdf';
  });

  return (
    <div className="space-y-10">
      <CardWithIcon
        icon={Music}
        title="فایل‌های صوتی"
        iconBgColor="bg-pink-1/10"
        iconColor="text-pink-1"
        borderColor="border-pink-1/20"
        titleExtra={<span className="text-[10px] font-black text-font-s bg-bg px-3 py-1.5 rounded-xl border border-br uppercase tracking-tighter">{audios.length} Files</span>}
        className="shadow-sm border-t-0 border-x-0 border-b-2 rounded-2xl"
        contentClassName="pt-6"
      >
        {renderMediaGrid(audios, "audio")}
      </CardWithIcon>

      <CardWithIcon
        icon={FileText}
        title="اسناد و مدارک"
        iconBgColor="bg-orange-1/10"
        iconColor="text-orange-1"
        borderColor="border-orange-1/20"
        titleExtra={<span className="text-[10px] font-black text-font-s bg-bg px-3 py-1.5 rounded-xl border border-br uppercase tracking-tighter">{documents.length} Files</span>}
        className="shadow-sm border-t-0 border-x-0 border-b-2 rounded-2xl"
        contentClassName="pt-6"
      >
        {renderMediaGrid(documents, "document")}
      </CardWithIcon>
    </div>
  );
}

