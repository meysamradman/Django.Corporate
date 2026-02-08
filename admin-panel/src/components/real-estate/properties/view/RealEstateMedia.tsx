
import {
  FileText,
  Video as VideoIcon,
  Image as ImageIcon
} from "lucide-react";
import type { Property } from "@/types/real_estate/realEstate";
import { mediaService } from "@/components/media/services";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Badge } from "@/components/elements/Badge";
import { EmptyState } from "@/components/shared/EmptyState";
import { AudioPlayer } from "@/components/media/audios/AudioPlayer";
import { VideoPlayer } from "@/components/media/videos/VideoPlayer";
import { DocumentItem } from "@/components/media/documents/DocumentItem";
import { cn } from "@/core/utils/cn";

interface MediaInfoTabProps {
  property: Property;
}

export function RealEstateMedia({ property }: MediaInfoTabProps) {
  const allMedia = property.media || property.property_media || [];

  const videos = allMedia.filter((item: any) => (item.media_detail || item.media || item)?.media_type === 'video');
  const audios = allMedia.filter((item: any) => (item.media_detail || item.media || item)?.media_type === 'audio');
  const documents = allMedia.filter((item: any) => {
    const type = (item.media_detail || item.media || item)?.media_type;
    return type === 'document' || type === 'pdf';
  });

  const formatSize = (bytes: number) => {
    if (!bytes) return 'N/A';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const hasMedia = videos.length > 0 || audios.length > 0 || documents.length > 0;

  return (
    <div className="flex flex-col gap-6">
      {!hasMedia ? (
        <CardWithIcon
          icon={ImageIcon}
          title="رسانه‌ها و مستندات"
          iconBgColor="bg-pink-0/50"
          iconColor="text-pink-1"
          cardBorderColor="border-b-pink-1"
          contentClassName="p-0"
        >
          <EmptyState
            title="رسانه‌ای یافت نشد"
            description="ویدئو، پادکست یا سندی برای این ملک ثبت نشده است"
            icon={ImageIcon}
            size="md"
            fullBleed={true}
          />
        </CardWithIcon>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-stretch">
          {videos.length > 0 && (
            <div className="flex flex-col">
              <CardWithIcon
                icon={VideoIcon}
                title={videos.length > 1 ? "ویدئوهای معرفی ملک" : "ویدئوی معرفی ملک"}
                iconBgColor="bg-blue-0/50"
                iconColor="text-blue-1"
                cardBorderColor="border-b-blue-1"
                className="w-full shadow-sm h-full flex flex-col"
                contentClassName="p-0 flex-1 flex flex-col justify-center"
              >
                <div className={cn("w-full flex-1 flex flex-col justify-center", videos.length > 1 ? "grid grid-cols-1 sm:grid-cols-2 gap-4" : "")}>
                  {videos.map((item: any) => {
                    const media = item.media_detail || item.media || item;
                    const coverUrl = mediaService.getMediaCoverUrl(media);

                    return (
                      <VideoPlayer
                        key={item.id}
                        src={mediaService.getMediaUrlFromObject(media)}
                        poster={coverUrl}
                        title={media.title || 'ویدئو ملک'}
                        size={formatSize(media.file_size)}
                        variant={videos.length === 1 ? "featured" : "default"}
                        className="h-full"
                      />
                    );
                  })}
                </div>
              </CardWithIcon>
            </div>
          )}

          {(documents.length > 0 || audios.length > 0) && (
            <div className="flex flex-col">
              <CardWithIcon
                icon={FileText}
                title="اسناد و پادکست آموزشی"
                iconBgColor="bg-purple-0/50"
                iconColor="text-purple-1"
                cardBorderColor="border-b-purple-1"
                className="w-full shadow-sm h-full flex flex-col"
                contentClassName="p-4 h-full flex flex-col gap-6"
                titleExtra={
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
                }
              >
                {audios.length > 0 && (
                  <div className="flex flex-col gap-4">
                    <label className="text-[10px] font-black text-font-s tracking-widest uppercase opacity-40 mb-1">فایل‌های صوتی</label>
                    <div className="flex flex-col gap-3">
                      {audios.map((item: any) => {
                        const media = item.media_detail || item.media || item;
                        return (
                          <AudioPlayer
                            key={item.id}
                            src={mediaService.getMediaUrlFromObject(media)}
                            title={media.title || 'پادکست ملک'}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}

                {documents.length > 0 && (
                  <div className="flex flex-col gap-3 flex-1">
                    <label className="text-[10px] font-bold text-font-s tracking-widest uppercase opacity-70 mb-1">ضمائم و اسناد</label>
                    <div className="flex flex-col gap-2.5">
                      {documents.map((item: any) => {
                        const media = item.media_detail || item.media || item;
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
                  <p className="text-[9.5px] font-bold text-purple-1/60 leading-relaxed text-center">
                    تمامی اسناد بر روی سرورهای امن ذخیره شده و فقط برای مدیران و کاربران مجاز قابل دسترس هستند.
                  </p>
                </div>
              </CardWithIcon>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
