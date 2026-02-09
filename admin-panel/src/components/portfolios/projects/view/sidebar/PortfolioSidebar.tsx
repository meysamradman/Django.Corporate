import { Card } from "@/components/elements/Card";
import type { Portfolio } from "@/types/portfolio/portfolio";
import { PortfolioActions } from "./PortfolioActions";
import { PortfolioStatus } from "./PortfolioStatus";
import { PortfolioIdentity } from "./PortfolioIdentity";

interface PortfolioSidebarProps {
    portfolio: Portfolio;
    onPrint?: () => void;
    onPdf?: () => void;
    isExportingPdf?: boolean;
}

export function PortfolioSidebar({
    portfolio,
    onPrint,
    onPdf,
    isExportingPdf = false
}: PortfolioSidebarProps) {
    return (
        <Card className="overflow-hidden gap-0">
            <PortfolioActions
                portfolioId={portfolio.id}
                onPrint={onPrint}
                onPdf={onPdf}
                isExportingPdf={isExportingPdf}
            />
            <PortfolioStatus portfolio={portfolio} />
            <PortfolioIdentity portfolio={portfolio} />
        </Card>
    );
}
