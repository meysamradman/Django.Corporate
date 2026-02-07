import { Card, CardContent } from "@/components/elements/Card";
import type { Portfolio } from "@/types/portfolio/portfolio";
import {
    CheckCircle2,
    XCircle,
    Star,
    Zap,
    Globe,
    Link as LinkIcon,
    Clock,
} from "lucide-react";
import { TruncatedText } from "@/components/elements/TruncatedText";

interface PortfolioBasicInfoProps {
    portfolio: Portfolio;
}

export function PortfolioInfo({ portfolio }: PortfolioBasicInfoProps) {
    const formatDate = (dateString: string) => {
        if (!dateString) return "نامشخص";
        const date = new Date(dateString);
        return new Intl.DateTimeFormat("fa-IR", {
            year: "numeric",
            month: "long",
            day: "numeric",
        }).format(date);
    };

    return (
        <Card className="overflow-hidden gap-0 ring-1 ring-static-b/5 border-br/50 shadow-lg">
            {/* Status Section */}
            <CardContent className="p-6 border-b bg-linear-to-b from-wt to-bg/10">
                <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-wt border border-br/40 shadow-xs hover:border-blue-1/30 transition-all group">
                        <div className={`flex items-center justify-center w-10 h-10 rounded-full mb-2 transition-colors ${portfolio.is_public ? "bg-blue-1/10" : "bg-bg"}`}>
                            <Globe className={`w-4 h-4 ${portfolio.is_public ? "text-blue-1" : "text-font-s opacity-40"}`} />
                        </div>
                        <span className={`text-[10px] font-black transition-colors ${portfolio.is_public ? "text-blue-1" : "text-font-s opacity-40"}`}>
                            {portfolio.is_public ? "عمومی" : "غیرعمومی"}
                        </span>
                    </div>

                    <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-wt border border-br/40 shadow-xs hover:border-blue-1/30 transition-all group">
                        <div className={`flex items-center justify-center w-10 h-10 rounded-full mb-2 transition-colors ${portfolio.is_active ? "bg-blue-1/10" : "bg-red-1/10"}`}>
                            <Zap className={`w-4 h-4 ${portfolio.is_active ? "text-blue-1" : "text-red-1"}`} />
                        </div>
                        <span className={`text-[10px] font-black transition-colors ${portfolio.is_active ? "text-blue-2" : "text-red-2"}`}>
                            {portfolio.is_active ? "فعال" : "غیرفعال"}
                        </span>
                    </div>

                    <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-wt border border-br/40 shadow-xs hover:border-orange-1/30 transition-all group">
                        <div className={`flex items-center justify-center w-10 h-10 rounded-full mb-2 transition-colors ${portfolio.is_featured ? "bg-orange-1/10" : "bg-bg"}`}>
                            <Star className={`w-4 h-4 ${portfolio.is_featured ? "text-orange-1 fill-orange-1" : "text-font-s opacity-40"}`} />
                        </div>
                        <span className={`text-[10px] font-black transition-colors ${portfolio.is_featured ? "text-orange-1" : "text-font-s opacity-40"}`}>
                            {portfolio.is_featured ? "ویژه" : "عادی"}
                        </span>
                    </div>

                    <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-wt border border-br/40 shadow-xs hover:border-green-1/30 transition-all group">
                        <div className={`flex items-center justify-center w-10 h-10 rounded-full mb-2 transition-colors ${portfolio.status === "published" ? "bg-green-1/10" : "bg-yellow-1/10"}`}>
                            {portfolio.status === "published" ? (
                                <CheckCircle2 className="w-4 h-4 text-green-1" />
                            ) : (
                                <XCircle className="w-4 h-4 text-yellow-1" />
                            )}
                        </div>
                        <span className={`text-[10px] font-black transition-colors ${portfolio.status === "published" ? "text-green-1" : "text-yellow-1"}`}>
                            {portfolio.status === "published" ? "منتشر شده" : "پیش‌نویس"}
                        </span>
                    </div>
                </div>
            </CardContent>

            {/* Content Section */}
            <CardContent className="p-0">
                <div className="p-6 bg-linear-to-bl from-bg/20 to-wt flex flex-col items-center text-center gap-2 border-b border-br/30">
                    <h3 className="text-font-p font-black text-lg leading-tight">
                        <TruncatedText text={portfolio.title} maxLength={50} />
                    </h3>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-bg border border-br/50 text-font-s text-[9px] font-black tracking-widest uppercase">
                        <span>شناسه:</span>
                        <span className="text-font-p">{portfolio.id}</span>
                    </div>
                </div>

                <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between gap-3 group">
                        <div className="flex items-center gap-2 text-font-s">
                            <LinkIcon className="w-3.5 h-3.5 opacity-40 group-hover:text-blue-1 group-hover:opacity-100 transition-all" />
                            <span className="text-[10px] font-black tracking-widest uppercase opacity-60">نامک (Slug)</span>
                        </div>
                        <TruncatedText
                            text={portfolio.slug || "-"}
                            maxLength={25}
                            className="font-mono text-font-p text-[10px] font-black text-left direction-ltr bg-bg px-2 py-0.5 rounded-md border border-br/40"
                        />
                    </div>

                    {portfolio.created_at && (
                        <div className="flex items-center justify-between gap-3 pt-4 border-t border-br/40 group">
                            <div className="flex items-center gap-2 text-font-s">
                                <Clock className="w-3.5 h-3.5 opacity-40 group-hover:text-orange-1 group-hover:opacity-100 transition-all" />
                                <span className="text-[10px] font-black tracking-widest uppercase opacity-60">تاریخ ثبت</span>
                            </div>
                            <span className="text-font-p text-[10px] font-black">
                                {formatDate(portfolio.created_at)}
                            </span>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

