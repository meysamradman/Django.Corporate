import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { MediaGallery } from "@/components/media/galleries/MediaGallery";
import { Video, Music, FileText } from "lucide-react";
import type { Media } from "@/types/shared/media";
import { MEDIA_MODULES } from "@/components/media/constants";

interface PortfolioMediaOtherProps {
    videoGallery: Media[];
    audioGallery: Media[];
    pdfDocuments: Media[];
    onVideoSelect: (media: Media[]) => void;
    onAudioSelect: (media: Media[]) => void;
    onPdfSelect: (media: Media[]) => void;
    editMode: boolean;
    portfolioId?: number | string;
    totalMediaCount: number;
}

export function PortfolioMediaOther({
    videoGallery,
    audioGallery,
    pdfDocuments,
    onVideoSelect,
    onAudioSelect,
    onPdfSelect,
    editMode,
    portfolioId,
    totalMediaCount
}: PortfolioMediaOtherProps) {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <CardWithIcon
                    icon={Video}
                    title="ویدیو و تیزر"
                    iconBgColor="bg-purple-0"
                    iconColor="stroke-purple-2"
                    cardBorderColor="border-b-purple-1"
                >
                    <MediaGallery
                        mediaItems={videoGallery || []}
                        onMediaSelect={onVideoSelect}
                        mediaType="video"
                        title=""
                        isGallery={false}
                        disabled={!editMode}
                        context={MEDIA_MODULES.PORTFOLIO}
                        contextId={portfolioId}
                        totalItemsCount={totalMediaCount}
                    />
                </CardWithIcon>

                <CardWithIcon
                    icon={Music}
                    title="توضیحات صوتی"
                    iconBgColor="bg-pink-0"
                    iconColor="stroke-pink-2"
                    cardBorderColor="border-b-pink-1"
                >
                    <MediaGallery
                        mediaItems={audioGallery || []}
                        onMediaSelect={onAudioSelect}
                        mediaType="audio"
                        title=""
                        isGallery={false}
                        disabled={!editMode}
                        context={MEDIA_MODULES.PORTFOLIO}
                        contextId={portfolioId}
                        totalItemsCount={totalMediaCount}
                    />
                </CardWithIcon>
            </div>

            <CardWithIcon
                icon={FileText}
                title="مستندات و فایل‌های ضمیمه (PDF)"
                iconBgColor="bg-orange-0"
                iconColor="stroke-orange-2"
                cardBorderColor="border-b-orange-1"
            >
                <MediaGallery
                    mediaItems={pdfDocuments || []}
                    onMediaSelect={onPdfSelect}
                    mediaType="document"
                    title=""
                    isGallery={false}
                    disabled={!editMode}
                    context={MEDIA_MODULES.PORTFOLIO}
                    contextId={portfolioId}
                    totalItemsCount={totalMediaCount}
                />
            </CardWithIcon>
        </div>
    );
}
