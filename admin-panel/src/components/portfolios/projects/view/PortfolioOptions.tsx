import { FileCode } from "lucide-react";
import type { Portfolio } from "@/types/portfolio/portfolio";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Badge } from "@/components/elements/Badge";
import { EmptyState } from "@/components/shared/EmptyState";

interface PortfolioOptionsProps {
    portfolio: Portfolio;
}

export function PortfolioOptions({ portfolio }: PortfolioOptionsProps) {
    const optionsCount = portfolio.options?.length || 0;
    const hasOptions = optionsCount > 0;

    return (
        <CardWithIcon
            icon={FileCode}
            title="گزینه‌ها"
            id="section-options"
            iconBgColor="bg-teal-0/50"
            iconColor="text-teal-1"
            cardBorderColor="border-b-teal-1"
            className="shadow-sm"
            titleExtra={<Badge variant="teal" className="h-5 px-2 text-[10px] font-black bg-teal-1/10 text-teal-1 border-teal-1/20">{optionsCount.toLocaleString('fa-IR')} مورد</Badge>}
        >
            {hasOptions ? (
                <div className="flex flex-wrap gap-2 px-5 py-2">
                    {portfolio.options.map((option) => (
                        <Badge
                            key={option.id}
                            variant="teal"
                            className="px-3 py-1 text-[10px] font-black h-7 gap-2 border-0 bg-teal-1/5 text-teal-1 hover:bg-teal-1/10"
                        >
                            {option.name}
                        </Badge>
                    ))}
                </div>
            ) : (
                <EmptyState
                    title="گزینه‌ای یافت نشد"
                    description="گزینه‌ای برای این نمونه‌کار ثبت نشده است"
                    icon={FileCode}
                    size="sm"
                    fullBleed={true}
                />
            )}
        </CardWithIcon>
    );
}
