import type { Property } from "@/types/real_estate/realEstate";
import { mediaService } from "@/components/media/services";
import { AudioPlayer } from "@/components/media/audios/AudioPlayer";

interface RealEstateAudiosProps {
    property: Property;
}

export function RealEstateAudios({ property }: RealEstateAudiosProps) {
    const allMedia = property.media || property.property_media || [];
    const audios = allMedia.filter((item: any) => (item.media_detail || item.media || item)?.media_type === 'audio');

    if (audios.length === 0) return null;

    return (
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
    );
}
