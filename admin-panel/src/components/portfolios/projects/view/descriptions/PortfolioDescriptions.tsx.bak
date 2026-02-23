import { FileText } from "lucide-react";
import type { Portfolio } from "@/types/portfolio/portfolio";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { PortfolioShortDesc } from "./PortfolioShortDesc";
import { PortfolioFullDesc } from "./PortfolioFullDesc";

interface PortfolioDescriptionsProps {
    portfolio: Portfolio;
}

export function PortfolioDescriptions({ portfolio }: PortfolioDescriptionsProps) {
    if (!portfolio) return null;

    return (
        <CardWithIcon
            icon={FileText}
            title="توضیحات و جزئیات تکمیلی"
            iconBgColor="bg-orange-0/50"
            iconColor="text-orange-1"
            cardBorderColor="border-b-orange-1"
            className="shadow-sm"
            contentClassName="px-6 py-6"
        >
            <div className="flex flex-col gap-8">
                <PortfolioShortDesc portfolio={portfolio} />
                <div className="border-t border-br/50 my-2" />
                <PortfolioFullDesc portfolio={portfolio} />
            </div>
        </CardWithIcon>
    );
}
