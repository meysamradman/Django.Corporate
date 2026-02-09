
import type { Portfolio } from "@/types/portfolio/portfolio";
import { mediaService } from "@/components/media/services";
import { DocumentItem } from "@/components/media/documents/DocumentItem";

interface PortfolioDocumentsProps {
    portfolio: Portfolio;
}

export function PortfolioDocuments({ portfolio }: PortfolioDocumentsProps) {
    const allMedia = portfolio.portfolio_media || [];
    const documents = allMedia.filter((item: any) => {
        const media = item.media_detail || item.media;
        return media?.media_type === 'document' || media?.media_type === 'pdf';
    });

    if (documents.length === 0) return null;

    return (
        <div className="flex flex-col gap-3 flex-1">
            <label className="text-[10px] font-bold text-font-s tracking-widest uppercase opacity-70 mb-1">ضمائم و اسناد</label>
            <div className="flex flex-col gap-2.5">
                {documents.map((item: any) => {
                    const media = item.media_detail || item.media;
                    return (
                        <DocumentItem
                            key={item.id}
                            title={media.title || 'سند پیوست'}
                            fileUrl={media.file || media.file_url}
                            fileSize={media.file_size}
                            downloadUrl={mediaService.getMediaUrlFromObject(media)}
                        />
                    );
                })}
            </div>
        </div>
    );
}
