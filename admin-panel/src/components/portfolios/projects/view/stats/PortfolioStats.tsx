
import type { Portfolio } from "@/types/portfolio/portfolio";
import { Badge } from "@/components/elements/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/elements/Card";
import { Eye, Globe, Smartphone, Heart } from "lucide-react";

interface PortfolioStatsProps {
    portfolio: Portfolio;
}

export function PortfolioStats({ portfolio }: PortfolioStatsProps) {
    const statusMap: Record<string, { label: string; variant: any }> = {
        published: { label: "فعال/منتشر شده", variant: "green" },
        draft: { label: "پیش‌نویس/غیرفعال", variant: "yellow" },
    };

    const config = statusMap[portfolio.status] || { label: portfolio.status, variant: "gray" };

    return (
        <Card className="gap-0 shadow-sm">
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span>آمار و وضعیت بازخورد</span>
                    <Badge variant={config.variant}>{config.label}</Badge>
                </CardTitle>
            </CardHeader>
            <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-bg border border-br/50 flex flex-col items-center gap-2 group hover:border-blue-1/30 transition-all">
                    <Eye className="w-4 h-4 text-blue-1 opacity-70 group-hover:opacity-100 transition-opacity" />
                    <span className="text-lg font-black text-font-p">{portfolio.views_count?.toLocaleString('fa-IR') || "۰"}</span>
                    <span className="text-[10px] font-bold text-font-s tracking-wider text-center">بازدید کل</span>
                </div>

                <div className="p-4 rounded-xl bg-bg border border-br/50 flex flex-col items-center gap-2 group hover:border-blue-1/30 transition-all">
                    <Globe className="w-4 h-4 text-emerald-1 opacity-70 group-hover:opacity-100 transition-opacity" />
                    <span className="text-lg font-black text-font-p">{portfolio.web_views_count?.toLocaleString('fa-IR') || "۰"}</span>
                    <span className="text-[10px] font-bold text-font-s tracking-wider text-center">وب</span>
                </div>

                <div className="p-4 rounded-xl bg-bg border border-br/50 flex flex-col items-center gap-2 group hover:border-blue-1/30 transition-all">
                    <Smartphone className="w-4 h-4 text-purple-1 opacity-70 group-hover:opacity-100 transition-opacity" />
                    <span className="text-lg font-black text-font-p">{portfolio.app_views_count?.toLocaleString('fa-IR') || "۰"}</span>
                    <span className="text-[10px] font-bold text-font-s tracking-wider text-center">اپلیکیشن</span>
                </div>

                <div className="p-4 rounded-xl bg-bg border border-br/50 flex flex-col items-center gap-2 group hover:border-blue-1/30 transition-all">
                    <Heart className="w-4 h-4 text-red-1 opacity-70 group-hover:opacity-100 transition-opacity" />
                    <span className="text-lg font-black text-font-p">{portfolio.favorites_count?.toLocaleString('fa-IR') || "۰"}</span>
                    <span className="text-[10px] font-bold text-font-s tracking-wider text-center">علاقه</span>
                </div>
            </div>
            </CardContent>
        </Card>
    );
}
