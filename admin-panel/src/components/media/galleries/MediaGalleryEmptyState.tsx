import { FileText as PDFIcon, Music, Image as ImageIcon, Video as VideoIcon } from 'lucide-react';

interface MediaGalleryEmptyStateProps {
    mediaType: 'image' | 'video' | 'audio' | 'document';
}

export function MediaGalleryEmptyState({ mediaType }: MediaGalleryEmptyStateProps) {
    return (
        <div className="border-2 border-dashed border-br rounded-2xl p-10 flex flex-col items-center justify-center bg-muted/5 group hover:bg-muted/10 transition-colors duration-300">
            <div className="w-16 h-16 rounded-full bg-wt shadow-sm border border-br flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                {mediaType === 'image' && <ImageIcon className="h-7 w-7 text-blue-1" />}
                {mediaType === 'video' && <VideoIcon className="h-7 w-7 text-purple-1" />}
                {mediaType === 'audio' && <Music className="h-7 w-7 text-pink-1" />}
                {mediaType === 'document' && <PDFIcon className="h-7 w-7 text-orange-2" />}
            </div>

            <p className="text-font-p font-bold">
                هنوز موردی انتخاب نشده است
            </p>
            <p className="text-[11px] text-font-s/60 mt-1 max-w-50 text-center leading-relaxed">
                از دکمه‌های بالا جهت افزودن فایل جدید یا انتخاب از کتابخانه استفاده کنید
            </p>
        </div>
    );
}