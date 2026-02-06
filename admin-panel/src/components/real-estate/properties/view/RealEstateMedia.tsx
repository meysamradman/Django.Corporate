
import {
  FileText,
  Video as VideoIcon,
  Download,
  FileCode,
  FileArchive,
  File as FileIcon,
  FileDigit,
  Image as ImageIcon
} from "lucide-react";
import type { Property } from "@/types/real_estate/realEstate";
import { mediaService } from "@/components/media/services";
import { Button } from "@/components/elements/Button";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Item, ItemContent, ItemTitle } from "@/components/elements/Item";
import { Badge } from "@/components/elements/Badge";
import { EmptyState } from "@/components/shared/EmptyState";
import { AudioPlayer } from "@/components/media/base/AudioPlayer";
import { VideoPlayer } from "@/components/media/base/VideoPlayer";

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

  const getFileIcon = (fileUrl: string) => {
    const ext = fileUrl.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return <FileText className="size-5 text-red-1" />;
    if (ext === 'doc' || ext === 'docx') return <FileCode className="size-5 text-blue-1" />;
    if (ext === 'zip' || ext === 'rar') return <FileArchive className="size-5 text-orange-1" />;
    if (ext === 'xls' || ext === 'xlsx') return <FileDigit className="size-5 text-emerald-1" />;
    return <FileIcon className="size-5 text-font-s/40" />;
  };

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
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 items-stretch">
          {/* Media Assets (Videos & Audio) - 3/5 width on large screens */}
          {(videos.length > 0 || audios.length > 0) && (
            <div className="xl:col-span-3 flex">
              <CardWithIcon
                icon={VideoIcon}
                title="ویدئو و پادکست آموزشی"
                iconBgColor="bg-blue-0/50"
                iconColor="text-blue-1"
                cardBorderColor="border-b-blue-1"
                className="w-full shadow-sm"
                contentClassName="p-5"
              >
                <div className="flex flex-col gap-6">
                  {/* VIDEO ASSETS */}
                  {videos.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {videos.map((item: any) => {
                        const media = item.media_detail || item.media || item;
                        const coverUrl = mediaService.getMediaCoverUrl(media);

                        return (
                          <div key={item.id} className="flex flex-col gap-2">
                            <VideoPlayer
                              key={item.id}
                              src={mediaService.getMediaUrlFromObject(media)}
                              poster={coverUrl}
                              title={media.title || 'ویدئو ملک'}
                              size={formatSize(media.file_size)}
                            />
                            <div className="flex justify-between items-start px-1">
                              <span className="text-xs font-bold text-font-p line-clamp-1">{media.title || 'ویدئو ملک'}</span>
                              <span className="text-[10px] text-font-s font-mono">{formatSize(media.file_size)}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* AUDIO ASSETS */}
                  {audios.length > 0 && (
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
                  )}
                </div>
              </CardWithIcon>
            </div>
          )}

          {/* DOCUMENTS Section - 2/5 width on large screens */}
          {documents.length > 0 && (
            <div className="xl:col-span-2 flex">
              <CardWithIcon
                icon={FileText}
                title="اسناد و ضمائم ملک"
                iconBgColor="bg-purple-0/50"
                iconColor="text-purple-1"
                cardBorderColor="border-b-purple-1"
                className="w-full shadow-sm"
                contentClassName="p-5 h-full flex flex-col"
                titleExtra={<Badge variant="purple" className="font-mono">{documents.length}</Badge>}
              >
                <div className="flex flex-col gap-3 flex-1">
                  {documents.map((item: any) => {
                    const media = item.media_detail || item.media || item;
                    return (
                      <Item key={item.id} className="p-3.5 border-br/40 bg-bg/40 hover:bg-wt hover:border-purple-1/30 transition-smooth group/d-item flex-nowrap">
                        <div className="size-12 rounded-xl bg-wt flex items-center justify-center border border-br/30 group-hover/d-item:scale-110 transition-transform shadow-xs">
                          {getFileIcon(media.file_url || '')}
                        </div>
                        <ItemContent className="p-0 flex-1 min-w-0 mr-4">
                          <ItemTitle className="text-[12.5px] font-black text-font-p truncate">
                            {media.title || 'سند پیوست'}
                          </ItemTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-bold text-font-s/60">{formatSize(media.file_size)}</span>
                            <div className="size-1 rounded-full bg-purple-1/20" />
                            <span className="text-[10px] font-bold text-purple-1/70 uppercase">{(media.file_url || '').split('.').pop()}</span>
                          </div>
                        </ItemContent>
                        <Button variant="outline" size="icon" className="size-9 text-font-s hover:bg-purple-0/40 hover:text-purple-1 rounded-xl shrink-0 transition-colors" asChild>
                          <a href={mediaService.getMediaUrlFromObject(media)} target="_blank" rel="noreferrer">
                            <Download className="size-4.5" />
                          </a>
                        </Button>
                      </Item>
                    );
                  })}

                  <div className="mt-4 p-4 rounded-2xl bg-purple-0/20 border border-purple-1/10 border-dashed">
                    <p className="text-[10px] font-bold text-purple-1/60 leading-relaxed text-center">
                      تمامی اسناد بر روی سرورهای امن ذخیره شده و فقط برای مدیران و کاربران مجاز قابل دسترس هستند.
                    </p>
                  </div>
                </div>
              </CardWithIcon>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
