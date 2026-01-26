import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { ImageIcon, Eye } from "lucide-react";
import { Button } from "@/components/elements/Button";
import { mediaService } from "@/components/media/services";
import type { RealEstateAgency } from "@/types/real_estate/agency/realEstateAgency";

interface MediaTabProps {
    agencyData: RealEstateAgency;
}

export default function AgencyMedia({ agencyData }: MediaTabProps) {
    const MediaPreview = ({
        media,
        title
    }: {
        media: any;
        title: string;
    }) => {
        if (!media) {
            return (
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                    <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground">{title} انتخاب نشده</p>
                </div>
            );
        }

        const mediaUrl = mediaService.getMediaUrlFromObject(media);

        return (
            <div className="border border-border rounded-lg p-4">
                <div className="flex items-start gap-4">
                    <div className="relative w-32 h-32 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        {media.media_type === 'image' ? (
                            <img
                                src={mediaUrl}
                                alt={media.file_name || 'Agency media'}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <ImageIcon className="h-8 w-8 text-muted-foreground" />
                            </div>
                        )}
                    </div>

                    <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm mb-1">{media.file_name || 'بدون نام'}</h4>
                        <p className="text-xs text-muted-foreground mb-2">
                            {media.media_type} • {media.file_size ? (media.file_size / 1024).toFixed(1) : '0'} KB
                        </p>
                        {media.alt_text && (
                            <p className="text-xs text-muted-foreground mb-2">
                                توضیح تصویر: {media.alt_text}
                            </p>
                        )}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(mediaUrl, '_blank')}
                        >
                            <Eye className="h-4 w-4 mr-1" />
                            مشاهده
                        </Button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <CardWithIcon
                icon={ImageIcon}
                title="لوگو آژانس"
                iconBgColor="bg-primary/10"
                iconColor="stroke-primary"
                borderColor="border-b-primary"
                className="hover:shadow-lg transition-all duration-300"
            >
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        لوگوی آژانس که در لیست آژانس‌ها و جزئیات نمایش داده می‌شود.
                    </p>
                    <MediaPreview
                        media={agencyData.logo}
                        title="لوگو"
                    />
                </div>
            </CardWithIcon>

            <CardWithIcon
                icon={ImageIcon}
                title="تصویر کاور"
                iconBgColor="bg-primary/10"
                iconColor="stroke-primary"
                borderColor="border-b-primary"
                className="hover:shadow-lg transition-all duration-300"
            >
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        تصویر کاور آژانس که در صفحه جزئیات نمایش داده می‌شود.
                    </p>
                    <MediaPreview
                        media={agencyData.cover_image}
                        title="کاور"
                    />
                </div>
            </CardWithIcon>
        </div>
    );
}
