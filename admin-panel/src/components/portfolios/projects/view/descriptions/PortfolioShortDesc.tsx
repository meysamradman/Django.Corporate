import { ValueFallback } from "@/components/shared/ValueFallback";
import type { Portfolio } from "@/types/portfolio/portfolio";

interface PortfolioShortDescProps {
    portfolio: Portfolio;
}

export function PortfolioShortDesc({ portfolio }: PortfolioShortDescProps) {
    return (
        <div className="flex flex-col gap-8">
            <label className="text-[10px] font-bold text-font-s tracking-wider mb-2 block">
                توضیحات کوتاه
            </label>
            <div className="text-sm text-font-p border-r-2 border-orange-1/30 pr-4 leading-relaxed">
                {portfolio.short_description || <ValueFallback value={null} fallback="شرح کوتاهی برای این پروژه ثبت نشده است" />}
            </div>
        </div>

    );
}
