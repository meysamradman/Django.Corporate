
import type { Property } from "@/types/real_estate/realEstate";
import { mediaService } from "@/components/media/services";
import { DocumentItem } from "@/components/media/documents/DocumentItem";

interface RealEstateDocumentsProps {
    property: Property;
}

export function RealEstateDocuments({ property }: RealEstateDocumentsProps) {
    const allMedia = property.media || property.property_media || [];
    const documents = allMedia.filter((item: any) => {
        const type = (item.media_detail || item.media || item)?.media_type;
        return type === 'document' || type === 'pdf';
    });

    if (documents.length === 0) return null;

    return (
        <div className="flex flex-col gap-3 flex-1">
            <label className="text-[10px] font-bold text-font-s tracking-widest uppercase opacity-70 mb-1">ضمائم و اسناد</label>
            <div className="flex flex-col gap-2.5">
                {documents.map((item: any) => {
                    const media = item.media_detail || item.media || item;
                    return (
                        <DocumentItem
                            key={item.id}
                            title={media.title || 'سند پیوست'}
                            fileUrl={media.file_url}
                            fileSize={media.file_size}
                            downloadUrl={mediaService.getMediaUrlFromObject(media)}
                        />
                    );
                })}
            </div>
        </div>
    );
}
