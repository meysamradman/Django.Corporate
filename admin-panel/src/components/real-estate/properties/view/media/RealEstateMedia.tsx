
import { Image as ImageIcon } from "lucide-react";
import type { Property } from "@/types/real_estate/realEstate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/elements/Card";
import { Badge } from "@/components/elements/Badge";
import { EmptyState } from "@/components/shared/EmptyState";
import { RealEstateVideo } from "./RealEstateVideo";
import { RealEstateDocuments } from "./RealEstateDocuments";
import { RealEstateAudio } from "./RealEstateAudio";

interface MediaInfoTabProps {
    property: Property;
}

export function RealEstateMedia({ property }: MediaInfoTabProps) {
    const allMedia = property.media || property.property_media || [];

    const videos = allMedia.filter((item: any) => (item.media_detail || item.media || item)?.media_type === 'video');
    const audios = allMedia.filter((item: any) => (item.media_detail || item.media || item)?.media_type === 'audio');
    const documents = allMedia.filter((item: any) => {
        const type = (item.media_detail || item.media || item)?.media_type;
        return type === 'document' || type === 'pdf';
    });

    const hasMedia = videos.length > 0 || audios.length > 0 || documents.length > 0;

    return (
        <div className="flex flex-col gap-6">
            {!hasMedia ? (
                <Card className="gap-0">
                    <CardHeader className="border-b">
                        <CardTitle>رسانه‌ها و مستندات</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <EmptyState
                        title="رسانه‌ای یافت نشد"
                        description="ویدئو، پادکست یا سندی برای این ملک ثبت نشده است"
                        icon={ImageIcon}
                        size="md"
                        fullBleed={true}
                    />
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-stretch">
                    <RealEstateVideo property={property} />

                    {(documents.length > 0 || audios.length > 0) && (
                        <div className="flex flex-col">
                            <Card className="gap-0 w-full shadow-sm h-full flex flex-col">
                                <CardHeader className="border-b">
                                    <CardTitle className="flex items-center justify-between">
                                        <span>اسناد و پادکست آموزشی</span>
                                        <div className="flex gap-2">
                                            {documents.length > 0 && (
                                                <Badge variant="purple" className="h-5 px-2 text-[10px] font-black bg-purple-1/10 text-purple-1 border-purple-1/20">
                                                    {documents.length.toLocaleString('fa-IR')} سند
                                                </Badge>
                                            )}
                                            {audios.length > 0 && (
                                                <Badge variant="blue" className="h-5 px-2 text-[10px] font-black bg-blue-1/10 text-blue-1 border-blue-1/20">
                                                    {audios.length.toLocaleString('fa-IR')} صوت
                                                </Badge>
                                            )}
                                        </div>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 h-full flex flex-col gap-6">
                                    <RealEstateAudio property={property} />
                                    <RealEstateDocuments property={property} />

                                    <div className="mt-auto p-4 rounded-xl bg-purple-0/20 border border-purple-1/10 border-dashed">
                                        <p className="text-[9.5px] font-bold text-purple-1/60 leading-relaxed text-center">
                                            تمامی اسناد بر روی سرورهای امن ذخیره شده و فقط برای مدیران و کاربران مجاز قابل دسترس هستند.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
