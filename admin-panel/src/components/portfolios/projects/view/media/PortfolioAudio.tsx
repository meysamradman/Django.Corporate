
import type { Portfolio } from "@/types/portfolio/portfolio";

import { mediaService } from "@/components/media/services";
import { AudioPlayer } from "@/components/media/audios/AudioPlayer";

interface PortfolioAudioProps {
    portfolio: Portfolio;
}

export function PortfolioAudio({ portfolio }: PortfolioAudioProps) {
    const allMedia = portfolio.portfolio_media || [];
    const audios = allMedia.filter((item: any) => {
        const media = item.media_detail || item.media;
        return media?.media_type === 'audio';
    });

    if (audios.length === 0) return null;

    return (
        <div className="flex flex-col gap-4">
            <label className="text-[10px] font-black text-font-s tracking-widest uppercase opacity-40 mb-1">فایل‌های صوتی</label>
            <div className="flex flex-col gap-3">
                {audios.map((item: any) => {
                    const media = item.media_detail || item.media;
                    return (
                        <AudioPlayer
                            key={item.id}
                            src={mediaService.getMediaUrlFromObject(media)}
                            title={media.title || 'پادکست پروژه'}
                        />
                    );
                })}
            </div>
        </div>
    );
}
