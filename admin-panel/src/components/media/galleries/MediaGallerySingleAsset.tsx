import type { Media } from '@/types/shared/media';
import { Button } from '@/components/elements/Button';
import { mediaService } from '@/components/media/services';
import {
    FileText as PDFIcon,
    Plus,
    X,
    Play,
    Music,
    Image as ImageIcon,
} from 'lucide-react';

interface MediaGallerySingleAssetProps {
    mediaType: 'video' | 'audio' | 'document';
    title: string;
    mainMedia: Media;
    coverMedia: Media | null;
    disabled: boolean;
    onOpenLibrary: () => void;
    onRemoveMain: () => void;
    onOpenCoverLibrary: () => void;
    onRemoveCover: () => void;
}

function renderTypeIcon(mediaType: 'video' | 'audio' | 'document') {
    if (mediaType === 'video') return <Play className="w-5 h-5" />;
    if (mediaType === 'audio') return <Music className="w-5 h-5" />;
    return <PDFIcon className="w-5 h-5" />;
}

export function MediaGallerySingleAsset({
    mediaType,
    title,
    mainMedia,
    coverMedia,
    disabled,
    onOpenLibrary,
    onRemoveMain,
    onOpenCoverLibrary,
    onRemoveCover,
}: MediaGallerySingleAssetProps) {
    const mediaUrl = mediaService.getMediaUrlFromObject(mainMedia);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
                <h3 className="text-font-m font-bold flex items-center gap-2 text-font-p">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${mediaType === 'video' ? 'bg-purple-0' : mediaType === 'audio' ? 'bg-pink-0' : 'bg-orange-0'
                        }`}>
                        {renderTypeIcon(mediaType)}
                    </div>
                    {title}
                </h3>
                <div className="flex items-center gap-2">
                    {!disabled && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onOpenLibrary}
                            className="h-8 px-3 gap-2 border-br hover:bg-muted/5 transition-colors"
                            disabled={disabled}
                        >
                            <Plus className="w-3.5 h-3.5" />
                            تغییر {mediaType === 'video' ? 'ویدیو' : mediaType === 'audio' ? 'صوت' : 'مستند'}
                        </Button>
                    )}
                    {!disabled && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onRemoveMain}
                            className="text-red-1 border-red-1/20 hover:bg-red-0 hover:border-red-1/40 h-8 px-3 gap-2"
                        >
                            <X className="w-3.5 h-3.5" />
                            حذف فایل
                        </Button>
                    )}
                </div>
            </div>

            <div className="relative group overflow-hidden border border-br rounded-2xl bg-wt shadow-sm hover:shadow-md transition-all duration-300">
                <div className="flex flex-col md:flex-row min-h-40">
                    <div className={`w-full md:w-32 flex flex-col items-center justify-center gap-2 p-6 border-b md:border-b-0 md:border-l border-br ${mediaType === 'video' ? 'bg-purple-0/30' : mediaType === 'audio' ? 'bg-pink-0/30' : 'bg-orange-0/30'
                        }`}>
                        <div className={`w-12 h-12 rounded-2xl shadow-sm flex items-center justify-center ${mediaType === 'video' ? 'bg-purple-1 text-static-w' : mediaType === 'audio' ? 'bg-pink-1 text-static-w' : 'bg-orange-2 text-static-w'
                            }`}>
                            {mediaType === 'video' && <Play className="w-6 h-6 fill-static-w" />}
                            {mediaType === 'audio' && <Music className="w-6 h-6" />}
                            {mediaType === 'document' && <PDFIcon className="w-6 h-6" />}
                        </div>
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-font-s opacity-60">
                            {mediaType === 'video' ? 'Video asset' : mediaType === 'audio' ? 'Audio asset' : 'Document'}
                        </span>
                    </div>

                    <div className="flex-1 p-5 flex flex-col justify-center min-w-0">
                        <h4 className="text-font-m font-bold text-font-p truncate mb-1">
                            {mainMedia.title || mainMedia.original_file_name}
                        </h4>
                        <div className="flex items-center gap-3 text-font-s/60 text-[11px] font-medium mb-4">
                            <span>{(mainMedia.file_size || 0) / 1024 / 1024 > 0 ? `${((mainMedia.file_size || 0) / 1024 / 1024).toFixed(2)} MB` : 'Size Unknown'}</span>
                            <span className="w-1 h-1 rounded-full bg-br" />
                            <span>{mainMedia.mime_type?.split('/').pop()?.toUpperCase() || 'FILE'}</span>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(mediaUrl, '_blank')}
                                className="h-8 px-3 text-[11px] border-br hover:bg-muted/5 mt-auto"
                            >
                                مشاهده فایل
                            </Button>
                        </div>
                    </div>

                    <div className="w-full md:w-60 p-4 bg-muted/5 border-t md:border-t-0 md:border-r border-br flex flex-col items-center justify-center">
                        <label className="text-[10px] font-bold text-font-s/50 uppercase mb-3 self-start mr-1">
                            {mediaType === 'video' ? 'تصویر پیش‌نمایش (Poster)' : 'تصویر کاور'}
                        </label>

                        <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-br bg-wt group/cover shadow-inner isolate">
                            {coverMedia ? (
                                <>
                                    <img
                                        src={mediaService.getMediaUrlFromObject(coverMedia)}
                                        alt="Cover"
                                        className="w-full h-full object-cover"
                                    />
                                    {!disabled && (
                                        <div className="absolute inset-0 z-20 bg-black/40 opacity-0 group-hover/cover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    if (!disabled) {
                                                        onOpenCoverLibrary();
                                                    }
                                                }}
                                                className="bg-wt/10 border-wt/20 text-static-w hover:bg-wt/20 backdrop-blur-md h-8 text-[11px]"
                                            >
                                                تغییر کاور
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    onRemoveCover();
                                                }}
                                                className="h-8 w-8 p-0"
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (!disabled) {
                                            onOpenCoverLibrary();
                                        }
                                    }}
                                    className={`relative z-10 w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-muted/5 transition-colors ${!disabled ? '' : 'pointer-events-none'}`}
                                >
                                    <ImageIcon className="w-6 h-6 text-font-s/30 mb-2" />
                                    <span className="text-[10px] font-bold text-font-s/40">انتخاب کاور</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}