
import { FileText } from "lucide-react";
import type { Portfolio } from "@/types/portfolio/portfolio";
import { ReadMore } from "@/components/elements/ReadMore";
import { EmptyState } from "@/components/shared/EmptyState";

interface PortfolioFullDescProps {
    portfolio: Portfolio;
}

export function PortfolioFullDesc({ portfolio }: PortfolioFullDescProps) {
    return (
        <div className="flex flex-col gap-8">
            <label className="text-[10px] font-bold text-font-s tracking-wider mb-2 block">
                توضیحات کامل
            </label>
            <div className="text-sm text-font-p bg-bg/50 rounded-xl overflow-hidden leading-loose">
                {portfolio.description ? (
                    <div className="p-6">
                        <ReadMore content={portfolio.description} isHTML={true} maxHeight="400px" />
                    </div>
                ) : (
                    <EmptyState
                        title="توضیحات کامل ثبت نشده است"
                        description="هیچ توضیحات تکمیلی برای این پروژه در سیستم موجود نیست"
                        icon={FileText}
                        size="sm"
                        fullBleed={true}
                    />
                )}
            </div>
        </div>
    );
}
