
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
  X
} from "lucide-react";
import type { Property } from "@/types/real_estate/realEstate";
import { mediaService } from "@/components/media/services";
import { Badge } from "@/components/elements/Badge";
import { Button } from "@/components/elements/Button";
import { MediaPlayer } from "@/components/media/base/MediaPlayer";

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
    if (ext === 'pdf') return <FileText className="w-5 h-5 text-red-1" />;
    if (ext === 'doc' || ext === 'docx') return <FileCode className="w-5 h-5 text-blue-1" />;
    if (ext === 'zip' || ext === 'rar') return <FileArchive className="w-5 h-5 text-amber-1" />;
    return <FileIcon className="w-5 h-5 text-font-s" />;
  };

  return (
    <div className="space-y-12">
      {/* Videos Section */}
      {videos.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-br pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-1/10 text-red-1">
                <VideoIcon className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-black text-font-p tracking-tight">ویدئوهای ملک</h3>
            </div>
            <Badge variant="red" className="rounded-full">{videos.length} مورد</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {videos.map((item: any) => {
              const media = item.media_detail || item.media || item;
              const coverUrl = media?.cover_image?.file_url
                ? mediaService.getMediaUrlFromObject({ file_url: media.cover_image.file_url } as any)
                : null;

              return (
                <div
                  key={item.id}
                  className="relative group aspect-4/3 rounded-2xl overflow-hidden border border-br shadow-sm bg-muted/5 hover:shadow-2xl transition-all duration-500 cursor-pointer"
                  onClick={() => setActiveVideo(media)}
                >
                  {coverUrl ? (
                    <img
                      src={coverUrl}
                      alt={media.title}
                      className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center opacity-20">
                      <VideoIcon className="w-12 h-12" />
                    </div>
                  )}

                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="size-16 rounded-full bg-wt/20 backdrop-blur-md flex items-center justify-center border border-wt/30 group-hover:scale-110 group-hover:bg-red-1 group-hover:border-red-1 transition-all">
                      <Play className="w-6 h-6 text-wt fill-current ml-1" />
                    </div>
                  </div>

                  <div className="absolute bottom-0 inset-x-0 p-6 bg-linear-to-t from-static-b/90 via-static-b/20 to-transparent">
                    <p className="text-sm font-black text-wt">{media.title || 'بدون عنوان'}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Audio Section */}
      {audios.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-br pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-pink-1/10 text-pink-1">
                <Music className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-black text-font-p tracking-tight">فایل‌های صوتی</h3>
            </div>
            <Badge variant="pink" className="rounded-full">{audios.length} مورد</Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {audios.map((item: any) => {
              const media = item.media_detail || item.media || item;
              return (
                <div key={item.id} className="p-4 rounded-2xl bg-bg/40 border border-br/60 flex flex-col gap-4 group hover:bg-card transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-full bg-pink-1/5 flex items-center justify-center text-pink-1">
                        <Music className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-black text-font-p line-clamp-1">{media.title || 'صدا'}</span>
                    </div>
                  </div>
                  <MediaPlayer media={media} className="bg-transparent h-10" showControls={true} controls={true} />
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Documents Section */}
      {documents.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-br pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-1/10 text-amber-1">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-black text-font-p tracking-tight">اسناد و مدارک فنی</h3>
            </div>
            <Badge variant="orange" className="rounded-full">{documents.length} فایل</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {documents.map((item: any) => {
              const media = item.media_detail || item.media || item;
              const fileUrl = media.file_url || media.url || '';
              const fullUrl = mediaService.getMediaUrlFromObject(media);

              return (
                <div key={item.id} className="group flex items-center gap-4 p-4 rounded-2xl bg-bg/30 border border-br/50 hover:bg-card hover:border-amber-1/30 transition-all">
                  <div className="size-12 rounded-xl bg-wt border border-br flex items-center justify-center shadow-xs">
                    {getFileIcon(fileUrl)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-font-p truncate">{media.title || 'سند ضمیمه'}</p>
                    <p className="text-[10px] font-bold text-font-s opacity-60 uppercase mt-0.5 dir-ltr">
                      {fileUrl.split('.').pop()?.toUpperCase()} Document
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-9 rounded-full opacity-0 group-hover:opacity-100 transition-opacity border-none bg-transparent hover:bg-bg"
                      asChild
                    >
                      <a href={fullUrl} target="_blank" rel="noopener noreferrer">
                        <Download className="w-4 h-4" />
                      </a>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-2 text-[10px] font-black border-br hover:bg-bg"
                      asChild
                    >
                      <a href={fullUrl} target="_blank" rel="noopener noreferrer">
                        <Eye className="w-3.5 h-3.5" />
                        مشاهده
                      </a>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* No Media Found */}
      {videos.length === 0 && audios.length === 0 && documents.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-bg/20 rounded-3xl border-2 border-dashed border-br">
          <div className="p-6 rounded-full bg-bg mb-4">
            <VideoIcon className="w-10 h-10 text-font-s opacity-20" />
          </div>
          <h4 className="text-lg font-black text-font-p">رسانه مکمل یافت نشد</h4>
          <p className="text-xs font-bold text-font-s opacity-60 mt-2">ویدئو، صوت با سندی برای این ملک ثبت نشده است</p>
        </div>
      )}

      {/* Video Lightbox Player */}
      {activeVideo && (
        <div className="fixed inset-0 z-100 bg-static-b/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300">
          <button
            onClick={() => setActiveVideo(null)}
            className="absolute top-6 right-6 p-3 rounded-full bg-wt/10 hover:bg-wt/20 text-wt transition-all z-50 cursor-pointer"
          >
            <X className="w-8 h-8" />
          </button>

          <div className="w-full max-w-6xl aspect-video rounded-3xl overflow-hidden shadow-2xl ring-1 ring-wt/20">
            <MediaPlayer media={activeVideo} className="w-full h-full" autoPlay={true} />
          </div>

          <div className="absolute bottom-10 inset-x-0 text-center">
            <h2 className="text-2xl font-black text-wt">{activeVideo.title}</h2>
          </div>
        </div>
      )}
    </div>
  );
}
