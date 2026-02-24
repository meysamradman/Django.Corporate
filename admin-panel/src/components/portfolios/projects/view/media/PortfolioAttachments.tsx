
import type { Portfolio } from "@/types/portfolio/portfolio";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/elements/Card";
import { Badge } from "@/components/elements/Badge";
import { PortfolioAudio } from "./PortfolioAudio";
import { PortfolioDocuments } from "./PortfolioDocuments";

interface PortfolioAttachmentsProps {
    portfolio: Portfolio;
}

export function PortfolioAttachments({ portfolio }: PortfolioAttachmentsProps) {
    const allMedia = portfolio.portfolio_media || [];

    const documentsCount = allMedia.filter((item: any) => {
        const media = item.media_detail || item.media;
        return media?.media_type === 'document' || media?.media_type === 'pdf';
    }).length;

    const audiosCount = allMedia.filter((item: any) => {
        const media = item.media_detail || item.media;
        return media?.media_type === 'audio';
    }).length;

    if (documentsCount === 0 && audiosCount === 0) return null;

    return (
        <div className="flex flex-col">
            <Card className="gap-0 w-full shadow-sm h-full flex flex-col">
                <CardHeader className="border-b">
                    <CardTitle className="flex items-center justify-between">
                        <span>اسناد و پادکست آموزشی</span>
                        <div className="flex gap-2">
                            {documentsCount > 0 && (
                                <Badge variant="purple" className="h-5 px-2 text-[10px] font-black bg-purple-1/10 text-purple-1 border-purple-1/20">
                                    {documentsCount.toLocaleString('fa-IR')} سند
                                </Badge>
                            )}
                            {audiosCount > 0 && (
                                <Badge variant="blue" className="h-5 px-2 text-[10px] font-black bg-blue-1/10 text-blue-1 border-blue-1/20">
                                    {audiosCount.toLocaleString('fa-IR')} صوت
                                </Badge>
                            )}
                        </div>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-4 h-full flex flex-col gap-6">
                    <PortfolioAudio portfolio={portfolio} />
                    <PortfolioDocuments portfolio={portfolio} />

                    <div className="mt-auto p-4 rounded-xl bg-purple-0/20 border border-purple-1/10 border-dashed">
                        <p className="text-[9.5px] font-bold text-purple-1/60 leading-relaxed text-center">
                            تمامی اسناد بر روی سرورهای امن ذخیره شده و فقط برای مدیران و کاربران مجاز قابل دسترس هستند.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
