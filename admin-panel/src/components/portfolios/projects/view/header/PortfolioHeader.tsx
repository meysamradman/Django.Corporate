
import { Card } from "@/components/elements/Card";
import type { Portfolio } from "@/types/portfolio/portfolio";
import { PortfolioTitle } from "./PortfolioTitle";
import { PortfolioActions } from "../actions/PortfolioActions";

interface PortfolioHeaderProps {
    portfolio: Portfolio;
    onPrint: () => void;
    onPdf: () => void;
    isExportingPdf: boolean;
}

export function PortfolioHeader({
    portfolio,
    onPrint,
    onPdf,
    isExportingPdf,
}: PortfolioHeaderProps) {
    return (
        <Card className="flex-row items-center justify-between gap-4 p-4 lg:px-6 py-4.5 relative overflow-hidden border-br shadow-xs shrink-0 bg-card">
            <div className="absolute top-0 right-0 w-full h-[3px] bg-linear-to-r from-blue-1/40 via-purple-1/40 to-pink-1/40" />
            <PortfolioTitle portfolio={portfolio} />
            <PortfolioActions
                portfolioId={portfolio.id}
                onPrint={onPrint}
                onPdf={onPdf}
                isExportingPdf={isExportingPdf}
            />
        </Card>
    );
}
