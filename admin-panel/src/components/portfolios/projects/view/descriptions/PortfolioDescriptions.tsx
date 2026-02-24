import { FileText } from "lucide-react";
import type { Portfolio } from "@/types/portfolio/portfolio";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/elements/Card";
import { PortfolioShortDesc } from "./PortfolioShortDesc";
import { PortfolioFullDesc } from "./PortfolioFullDesc";

interface PortfolioDescriptionsProps {
    portfolio: Portfolio;
}

export function PortfolioDescriptions({ portfolio }: PortfolioDescriptionsProps) {
    if (!portfolio) return null;

    return (
        <Card className="gap-0 shadow-sm">
            <CardHeader className="border-b">
                <CardTitle>توضیحات و جزئیات تکمیلی</CardTitle>
            </CardHeader>
            <CardContent className="px-6 py-6">
            <div className="flex flex-col gap-8">
                <PortfolioShortDesc portfolio={portfolio} />
                <div className="border-t border-br/50 my-2" />
                <PortfolioFullDesc portfolio={portfolio} />
            </div>
            </CardContent>
        </Card>
    );
}
