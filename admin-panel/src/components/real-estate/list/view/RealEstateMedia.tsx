
import { useState } from "react";
import {
  FileText,
  Music,
  Play,
  Video as VideoIcon,
  Download,
  Eye,
  FileCode,
  FileArchive,
  File as FileIcon,
  X,
  FileDigit,
  Image as ImageIcon
} from "lucide-react";
import type { Property } from "@/types/real_estate/realEstate";
import { mediaService } from "@/components/media/services";
import { Button } from "@/components/elements/Button";
import { MediaPlayer } from "@/components/media/base/MediaPlayer";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Item, ItemMedia, ItemContent, ItemTitle, ItemActions } from "@/components/elements/Item";
import { Badge } from "@/components/elements/Badge";

interface MediaInfoTabProps {
  property: Property;
}

export function RealEstateMedia({ property }: MediaInfoTabProps) {
  const [activeVideo, setActiveVideo] = useState<any>(null);

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

  if (!hasMedia) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center bg-bg/50 rounded-3xl border-2 border-dashed border-br">
        <div className="size-16 rounded-full bg-br flex items-center justify-center mb-6">
          <VideoIcon className="size-8 text-font-s/30" />
        </div>
        <h4 className="text-xl font-black text-font-p">رسانه ضمیمه یافت نشد</h4>
        <p className="text-sm font-medium text-font-s opacity-60 mt-2">ویدئو، پادکست یا سندی برای این ملک ثبت نشده است</p>
      </div>
    );
  }

  return (
    <CardWithIcon
      icon={ImageIcon}
      title="رسانه‌ها و گالری"
      iconBgColor="bg-pink-1/10"
      iconColor="text-pink-1"
      cardBorderColor="border-b-pink-1"
    >
      <div className="flex flex-col gap-8">
        {/* Videos & Audio Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* VIDEO ASSETS section */}
          {videos.length > 0 && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-4">
                {videos.map((item: any) => {
                  const media = item.media_detail || item.media || item;
                  const coverUrl = mediaService.getMediaCoverUrl(media);
                  const extension = (media.file_url || '').split('.').pop()?.toUpperCase() || 'MP4';

                  return (
                    <Item key={item.id} className="p-0 border-br/40 overflow-hidden bg-wt hover:border-primary/30 transition-smooth group/v-item">
                      <div className="flex w-full items-stretch min-h-[110px]">
                        <div className="relative w-32 border-l border-br/40 bg-bg shrink-0">
                          {coverUrl ? (
                            <img src={coverUrl} alt={media.title} className="w-full h-full object-cover opacity-90 group-hover/v-item:opacity-100 transition-opacity" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center opacity-20">
                              <VideoIcon className="size-8" />
                            </div>
                          )}
                          <button
                            onClick={() => setActiveVideo(media)}
                            className="absolute inset-0 flex items-center justify-center bg-static-b/20 group-hover/v-item:bg-static-b/10 transition-colors"
                          >
                            <div className="size-10 rounded-full bg-wt/20 backdrop-blur-md flex items-center justify-center text-wt border border-wt/30 scale-90 group-hover/v-item:scale-100 transition-all">
                              <Play className="size-4 fill-current ml-0.5" />
                            </div>
                          </button>
                        </div>
                        <ItemContent className="p-4 justify-between">
                          <div className="space-y-1">
                            <ItemTitle className="text-[13px] font-bold truncate max-w-[220px]">{media.title || 'ویدئو ملک'}</ItemTitle>
                            <div className="flex items-center gap-3">
                              <Badge variant="blue" className="text-[9px] px-1.5 py-0 min-h-0 bg-primary/5 text-primary border-primary/10">{extension}</Badge>
                              <span className="text-[10px] font-bold text-font-s/40">{formatSize(media.file_size)}</span>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 rounded-lg border-br hover:bg-primary hover:text-wt hover:border-primary transition-all text-[10px] px-4 font-bold"
                            onClick={() => setActiveVideo(media)}
                          >
                            مشاهده و پخش
                          </Button>
                        </ItemContent>
                      </div>
                    </Item>
                  );
                })}
              </div>
            </div>
          )}

          {/* AUDIO ASSETS section */}
          {audios.length > 0 && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-4">
                {audios.map((item: any) => {
                  const media = item.media_detail || item.media || item;
                  const extension = (media.file_url || '').split('.').pop()?.toUpperCase() || 'MPEG';

                  return (
                    <Item key={item.id} className="p-4 border-br/40 bg-wt hover:border-pink-1/30 transition-smooth group flex-col items-stretch gap-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-xl bg-pink-1/5 text-pink-1 flex items-center justify-center border border-pink-1/10">
                            <Music className="size-5" />
                          </div>
                          <ItemContent className="gap-1">
                            <ItemTitle className="text-[13px] font-bold">{media.title || 'صوت توضیحات'}</ItemTitle>
                            <div className="flex items-center gap-2">
                              <Badge variant="pink" className="text-[9px] px-1.5 py-0 min-h-0 bg-pink-1/5 text-pink-1 border-pink-1/10 uppercase tracking-tighter">{extension}</Badge>
                              <span className="text-[10px] font-bold text-font-s/40">{formatSize(media.file_size)}</span>
                            </div>
                          </ItemContent>
                        </div>
                      </div>
                      <div className="relative pt-1">
                        <MediaPlayer
                          media={media}
                          className="h-9 relative z-10"
                          showControls={true}
                          controls={true}
                        />
                      </div>
                    </Item>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* DOCUMENTS section */}
        {documents.length > 0 && (
          <div className="flex flex-col gap-4 border-t border-br/30 pt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {documents.map((item: any) => {
                const media = item.media_detail || item.media || item;
                const fileUrl = media.file_url || media.url || '';
                const fullUrl = mediaService.getMediaUrlFromObject(media);
                const ext = fileUrl.split('.').pop()?.toUpperCase() || 'FILE';

                return (
                  <Item key={item.id} className="p-4 border-br/40 bg-wt hover:border-amber-1/30 transition-smooth gap-4 flex-col items-stretch">
                    <div className="flex items-center gap-4">
                      <ItemMedia className="size-12 rounded-xl bg-bg border border-br/40 group-hover:bg-amber-1/5 group-hover:border-amber-1/20 transition-all shrink-0">
                        {getFileIcon(fileUrl)}
                      </ItemMedia>
                      <ItemContent>
                        <ItemTitle className="text-[13px] font-bold truncate max-w-[160px] leading-tight mb-1">{media.title || 'سند ضمیمه'}</ItemTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant="yellow" className="text-[9px] px-1.5 py-0 min-h-0 bg-amber-1/5 text-amber-1 border-amber-1/10">{ext}</Badge>
                          <span className="text-[10px] font-bold text-font-s/40 uppercase">{formatSize(media.file_size)}</span>
                        </div>
                      </ItemContent>
                    </div>
                    <ItemActions className="grid grid-cols-2 gap-2 mt-1">
                      <Button variant="outline" className="h-8 rounded-lg border-br hover:bg-amber-1 hover:text-wt hover:border-amber-1 font-bold text-[10px] px-0" asChild>
                        <a href={fullUrl} target="_blank" rel="noopener noreferrer"><Download className="size-3.5 ml-2" /> دریافت</a>
                      </Button>
                      <Button variant="outline" className="h-8 rounded-lg border-br hover:bg-font-p hover:text-wt hover:border-font-p font-bold text-[10px] px-0" asChild>
                        <a href={fullUrl} target="_blank" rel="noopener noreferrer"><Eye className="size-3.5 ml-2" /> مشاهده</a>
                      </Button>
                    </ItemActions>
                  </Item>
                );
              })}
            </div>
          </div>
        )}

        {/* Lightbox Video Player */}
        {activeVideo && (
          <div className="fixed inset-0 z-100 bg-static-b/95 flex items-center justify-center animate-in fade-in duration-500">
            <div className="absolute top-0 inset-x-0 p-8 flex justify-between items-center z-50">
              <div className="flex flex-col items-start gap-1">
                <h3 className="text-lg font-black text-wt leading-none">{activeVideo?.title || 'پخش ویدیو'}</h3>
              </div>
              <button
                onClick={() => setActiveVideo(null)}
                className="size-14 rounded-full bg-wt/10 backdrop-blur-xl flex items-center justify-center text-wt hover:bg-red-1 transition-all cursor-pointer border border-wt/20"
              >
                <X className="size-6" />
              </button>
            </div>

            <div className="w-full max-w-6xl px-4 animate-in zoom-in-95 duration-500">
              <div className="relative aspect-video bg-static-b rounded-4xl overflow-hidden shadow-2xl border border-wt/10">
                <MediaPlayer media={activeVideo} className="w-full h-full" autoPlay={true} />
              </div>
            </div>
          </div>
        )}
      </div>
    </CardWithIcon>
  );
}
