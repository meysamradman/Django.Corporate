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
import { EmptyState } from "@/components/shared/EmptyState";

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

  return (
    <CardWithIcon
      icon={ImageIcon}
      title="رسانه‌ها و گالری"
      iconBgColor="bg-pink-1/10"
      iconColor="text-pink-1"
      cardBorderColor="border-b-pink-1"
      contentClassName={!hasMedia ? "p-0" : "px-5 py-5"}
    >
      {!hasMedia ? (
        <EmptyState
          title="رسانه‌ای یافت نشد"
          description="ویدئو، پادکست یا سندی برای این ملک ثبت نشده است"
          icon={ImageIcon}
          size="md"
          fullBleed={true}
        />
      ) : (
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
                              <ItemTitle className="text-[13px] font-bold truncate max-w-[220px]">
                                {media.title || 'ویدئو ملک'}
                              </ItemTitle>
                              <div className="flex items-center gap-1.5 opacity-40">
                                <span className="text-[11px] font-bold text-font-s uppercase tracking-wider">{extension}</span>
                                <span className="size-1 rounded-full bg-font-s/30" />
                                <span className="text-[11px] font-bold text-font-s">{formatSize(media.file_size)}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button variant="outline" size="sm" className="h-8 px-2.5 text-blue-1 bg-blue-1/5 hover:bg-blue-1/10 rounded-lg text-[11px] font-bold" onClick={() => setActiveVideo(media)}>
                                <Play className="size-3 ml-1 fill-current" />
                                پخش آنلاین
                              </Button>
                              <Button variant="outline" size="icon" className="size-8 text-font-s hover:bg-bg rounded-lg" asChild>
                                <a href={media.file_url} target="_blank" rel="noreferrer">
                                  <Download className="size-3.5" />
                                </a>
                              </Button>
                            </div>
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
                    return (
                      <Item key={item.id} className="p-3 border-br/40 bg-wt hover:border-pink-1/30 transition-smooth group/a-item">
                        <div className="flex items-center gap-4 w-full">
                          <div className="size-12 rounded-2xl bg-pink-1/5 flex items-center justify-center text-pink-1 group-hover/a-item:bg-pink-1/10 transition-colors">
                            <Music className="size-6" />
                          </div>
                          <ItemContent className="p-0 flex-1">
                            <ItemTitle className="text-[13px] font-bold">
                              {media.title || 'پادکست ملک'}
                            </ItemTitle>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[11px] font-bold text-font-s/40">{formatSize(media.file_size)}</span>
                              <Badge variant="outline" className="h-4.5 text-[9px] font-black border-pink-1/20 text-pink-1 px-1.5">AUDIO</Badge>
                            </div>
                          </ItemContent>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-xl border-br hover:border-pink-1 hover:text-pink-1 transition-all" asChild>
                              <a href={media.file_url} target="_blank" rel="noreferrer">
                                <Play className="size-3.5 fill-current" />
                              </a>
                            </Button>
                          </div>
                        </div>
                      </Item>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* DOCUMENTS Section */}
          {documents.length > 0 && (
            <div className="pt-6 border-t border-br/40">
              <div className="flex items-center gap-2 mb-4">
                <div className="size-1.5 rounded-full bg-purple-1" />
                <span className="text-xs font-black text-font-p">مستندات و فایل‌های پیوست</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {documents.map((item: any) => {
                  const media = item.media_detail || item.media || item;
                  return (
                    <Item key={item.id} className="p-3.5 border-br/40 bg-wt hover:border-purple-1/30 transition-smooth group/d-item">
                      <div className="flex items-center gap-4">
                        <div className="size-11 rounded-xl bg-bg flex items-center justify-center border border-br/30 group-hover/d-item:bg-wt transition-colors">
                          {getFileIcon(media.file_url || '')}
                        </div>
                        <ItemContent className="p-0 flex-1 min-w-0">
                          <ItemTitle className="text-[12.5px] font-bold truncate">
                            {media.title || 'سند پیوست'}
                          </ItemTitle>
                          <p className="text-[11px] font-bold text-font-s/40 mt-0.5">{formatSize(media.file_size)}</p>
                        </ItemContent>
                        <Button variant="ghost" size="icon" className="size-8 text-font-s hover:bg-bg hover:text-purple-1 rounded-lg shrink-0" asChild>
                          <a href={media.file_url} target="_blank" rel="noreferrer">
                            <Download className="size-4" />
                          </a>
                        </Button>
                      </div>
                    </Item>
                  );
                })}
              </div>
            </div>
          )}

          {/* Video Player Modal */}
          {activeVideo && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-static-b/80 backdrop-blur-sm animate-in fade-in duration-300">
              <div className="absolute top-6 right-6">
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
      )}
    </CardWithIcon>
  );
}
