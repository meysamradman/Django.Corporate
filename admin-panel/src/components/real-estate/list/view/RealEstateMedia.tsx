
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
      className=""
      contentClassName=""
    >
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

          {/* VIDEO ASSETS SECTION */}
          {videos.length > 0 && (
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-start gap-4">
                <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm border border-primary/20">
                  <VideoIcon className="size-6" />
                </div>
                <div className="text-right">
                  <h3 className="text-xl font-black text-font-p">ویدیو و تیزر</h3>
                </div>
              </div>

              <div className="flex flex-col gap-6">
                {videos.map((item: any) => {
                  const media = item.media_detail || item.media || item;
                  const coverUrl = mediaService.getMediaCoverUrl(media);
                  const extension = (media.file_url || '').split('.').pop()?.toUpperCase() || 'MP4';

                  return (
                    <div key={item.id} className="group relative bg-wt border border-br rounded-[2.5rem] overflow-hidden shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.1)] transition-all duration-500">
                      <div className="flex flex-col sm:flex-row items-stretch">
                        {/* Video Preview Side */}
                        <div className="relative w-full sm:w-56 h-48 sm:h-auto overflow-hidden bg-bg">
                          {coverUrl ? (
                            <img src={coverUrl} alt={media.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-primary/5">
                              <VideoIcon className="size-12 text-primary opacity-20" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-static-b/20 group-hover:bg-static-b/10 transition-colors" />
                          <button
                            onClick={() => setActiveVideo(media)}
                            className="absolute inset-0 flex items-center justify-center group/btn"
                          >
                            <div className="size-14 rounded-full bg-wt/20 backdrop-blur-md flex items-center justify-center text-wt border border-wt/30 group-hover/btn:scale-110 group-hover/btn:bg-primary group-hover/btn:border-primary transition-all duration-300">
                              <Play className="size-6 fill-current ml-1" />
                            </div>
                          </button>
                        </div>

                        {/* Content Side */}
                        <div className="flex-1 p-8 flex flex-col justify-center items-start text-right gap-4">
                          <div className="flex flex-col gap-1 w-full">
                            <h4 className="text-base font-black text-font-p line-clamp-1">{media.title || 'ویدئو ملک'}</h4>
                          </div>

                          <div className="flex items-center gap-4 text-[11px] font-bold text-font-s/60 bg-bg p-2 px-4 rounded-full">
                            <span className="text-primary">{extension}</span>
                            <span className="size-1 rounded-full bg-br" />
                            <span>{formatSize(media.file_size)}</span>
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2 rounded-2xl border-br hover:bg-primary hover:text-wt hover:border-primary px-8 font-black text-xs h-11 transition-all"
                            onClick={() => setActiveVideo(media)}
                          >
                            مشاهده و پخش فایل
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* AUDIO ASSETS SECTION */}
          {audios.length > 0 && (
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-start gap-4">
                <div className="size-12 rounded-2xl bg-pink-1/10 flex items-center justify-center text-pink-1 shadow-sm border border-pink-1/20">
                  <Music className="size-6" />
                </div>
                <div className="text-right">
                  <h3 className="text-xl font-black text-font-p">توضیحات صوتی</h3>
                </div>
              </div>

              <div className="flex flex-col gap-6">
                {audios.map((item: any) => {
                  const media = item.media_detail || item.media || item;
                  const extension = (media.file_url || '').split('.').pop()?.toUpperCase() || 'MPEG';

                  return (
                    <div key={item.id} className="bg-wt border border-br rounded-[2.5rem] overflow-hidden shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.1)] transition-all duration-500">
                      <div className="p-8">
                        <div className="flex items-center justify-between mb-8">
                          <div className="text-right">
                            <h4 className="text-base font-black text-font-p">{media.title || 'صوت توضیحات'}</h4>
                            <p className="text-[11px] font-bold text-font-s/40 mt-0.5">{formatSize(media.file_size)}</p>
                          </div>
                          <div className="flex items-center gap-3 bg-bg p-2 pr-4 rounded-2xl border border-br/50">
                            <span className="text-[10px] font-black text-font-s/40 uppercase tracking-tight">{extension}</span>
                            <div className="size-8 rounded-xl bg-pink-1 text-wt flex items-center justify-center shadow-lg shadow-pink-1/20">
                              <Music className="size-4" />
                            </div>
                          </div>
                        </div>

                        <div className="relative group/audio">
                          <div className="absolute inset-x-0 -top-4 bottom-0 bg-linear-to-b from-pink-1/5 to-transparent rounded-4xl opacity-0 group-hover/audio:opacity-100 transition-opacity" />
                          <MediaPlayer
                            media={media}
                            className="bg-transparent h-14 relative z-10"
                            showControls={true}
                            controls={true}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* DOCUMENTS SECTION */}
        {documents.length > 0 && (
          <div className="flex flex-col gap-6 pt-6">
            <div className="flex items-center justify-start gap-4 border-t border-br pt-12">
              <div className="size-12 rounded-2xl bg-amber-1/10 flex items-center justify-center text-amber-1 shadow-sm border border-amber-1/20">
                <FileText className="size-6" />
              </div>
              <div className="text-right">
                <h3 className="text-xl font-black text-font-p">اسناد و مدارک فنی</h3>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {documents.map((item: any) => {
                const media = item.media_detail || item.media || item;
                const fileUrl = media.file_url || media.url || '';
                const fullUrl = mediaService.getMediaUrlFromObject(media);
                const ext = fileUrl.split('.').pop()?.toUpperCase() || 'FILE';

                return (
                  <div key={item.id} className="group bg-wt border border-br rounded-[2.5rem] p-6 hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.1)] hover:border-amber-1/30 transition-all duration-500">
                    <div className="flex items-center gap-6">
                      <div className="size-20 rounded-3xl bg-bg border border-br flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-amber-1/5 group-hover:border-amber-1/20 transition-all duration-500">
                        {getFileIcon(fileUrl)}
                      </div>
                      <div className="flex-1 min-w-0 text-right">
                        <div className="flex items-center justify-end gap-2 mb-1">
                          <span className="text-[9px] font-black text-amber-1 bg-amber-1/10 px-2 py-0.5 rounded-md uppercase tracking-tighter">{ext}</span>
                          <span className="text-[9px] font-black text-font-s/40 uppercase">{formatSize(media.file_size)}</span>
                        </div>
                        <p className="text-[14px] font-black text-font-p truncate leading-tight">{media.title || 'سند ضمیمه'}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-6">
                      <Button variant="outline" className="w-full rounded-2xl border-br hover:bg-amber-1 hover:text-wt hover:border-amber-1 font-black text-[11px] h-11" asChild>
                        <a href={fullUrl} target="_blank" rel="noopener noreferrer"><Download className="size-4 ml-2" /> دریافت فایل</a>
                      </Button>
                      <Button variant="outline" className="w-full rounded-2xl border-br hover:bg-font-p hover:text-wt hover:border-font-p font-black text-[11px] h-11" asChild>
                        <a href={fullUrl} target="_blank" rel="noopener noreferrer"><Eye className="size-4 ml-2" /> مشاهده</a>
                      </Button>
                    </div>
                  </div>
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
                <h2 className="text-lg font-black text-wt leading-none">{activeVideo?.title || 'پخش ویدیو'}</h2>
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
