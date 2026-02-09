
import { Badge } from "@/components/elements/Badge";
import { Clock } from "lucide-react";
import { formatDate } from "@/core/utils/commonFormat";
import type { Portfolio } from "@/types/portfolio/portfolio";

interface PortfolioTitleProps {
    portfolio: Portfolio;
}

export function PortfolioTitle({ portfolio }: PortfolioTitleProps) {
    const statusConfig: Record<string, any> = {
        published: { label: "منتشر شده", variant: "emerald", dot: "bg-emerald-1" },
        draft: { label: "پیش‌نویس", variant: "amber", dot: "bg-amber-1" },
    };

    return (
        <div className="flex flex-col gap-1.5 min-w-0">
            <div className="flex items-center gap-4 flex-wrap">
                <h1 className="text-xl font-black text-font-p tracking-tight shrink-0 leading-tight">
                    {portfolio.title}
                </h1>
                <div className="flex items-center gap-2">
                    <Badge variant={statusConfig[portfolio.status]?.variant || "default"} className="rounded-full px-3 py-1 text-[10px] font-black h-6.5 gap-2 border-0">
                        <div className={`w-1.5 h-1.5 rounded-full ${statusConfig[portfolio.status]?.dot || 'bg-current'} animate-pulse`} />
                        {statusConfig[portfolio.status]?.label || portfolio.status}
                    </Badge>

                    {portfolio.is_featured && (
                        <Badge variant="blue" className="rounded-full px-3 py-1 text-[10px] font-black h-6.5 gap-2 border-0">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-1 animate-pulse" />
                            ویژه
                        </Badge>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-4 text-[11px] font-bold text-font-s opacity-70">
                <span className="font-mono text-font-p bg-bg px-2 py-0.5 rounded-md border border-br/60 shadow-xs">#{portfolio.id}</span>
                <div className="w-1 h-1 rounded-full bg-br" />
                <span className="tracking-wide">پروژه پورتفولیو</span>
                {portfolio.slug && (
                    <>
                        <div className="w-1.5 h-1.5 rounded-full bg-br/50" />
                        <span className="font-mono tracking-wide opacity-80">{portfolio.slug}</span>
                    </>
                )}
                <div className="w-1.5 h-1.5 rounded-full bg-br/50" />
                <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 opacity-60" />
                    <span>{formatDate(portfolio.created_at)}</span>
                </div>
            </div>
        </div>
    );
}
