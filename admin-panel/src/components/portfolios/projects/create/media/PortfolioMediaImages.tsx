import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { MediaGallery } from "@/components/media/galleries/MediaGallery";
import { Image as ImageIcon } from "lucide-react";
import type { Media } from "@/types/shared/media";
import { MEDIA_MODULES } from "@/components/media/constants";

interface PortfolioMediaImagesProps {
    imageGallery: Media[];
    onMediaSelect: (media: Media[]) => void;
    editMode: boolean;
    portfolioId?: number | string;
    totalMediaCount: number;
}

export function PortfolioMediaImages({
    imageGallery,
    onMediaSelect,
    editMode,
    portfolioId,
    totalMediaCount
}: PortfolioMediaImagesProps) {
    return (
        <CardWithIcon
            icon={ImageIcon}
            title="گالری تصاویر"
            iconBgColor="bg-blue-0"
            iconColor="stroke-blue-2"
            cardBorderColor="border-b-blue-1"
        >
            <MediaGallery
                mediaItems={imageGallery || []}
                onMediaSelect={onMediaSelect}
                mediaType="image"
                title=""
                isGallery={true}
                disabled={!editMode}
                context={MEDIA_MODULES.PORTFOLIO}
                contextId={portfolioId}
                totalItemsCount={totalMediaCount}
            />
        </CardWithIcon>
    );
}
