/**
 * Portfolio Export Buttons Component
 */

import { Button } from '@/components/elements/Button';
import { Download, FileText, Printer } from 'lucide-react';
import { usePortfolioExcelExport } from '@/hooks/portfolios/usePortfolioExcelExport';
import { usePortfolioPdfExport } from '@/hooks/portfolios/usePortfolioPdfExport';
import { usePortfolioPrintView } from '@/hooks/portfolios/usePortfolioPrintView';
import type { Portfolio } from '@/types/portfolio/portfolio';
import type { PortfolioExportParams } from '@/types/portfolio/portfolioListParams';

interface PortfolioExportButtonsProps {
    selectedPortfolios: Portfolio[];
    totalCount: number;
    filters?: PortfolioExportParams;
    className?: string;
}

export function PortfolioExportButtons({
    selectedPortfolios,
    totalCount,
    filters,
    className = '',
}: PortfolioExportButtonsProps) {
    const { exportExcel, isLoading: isExcelLoading } = usePortfolioExcelExport();
    const { exportPortfolioListPdf, isExportingList: isPdfLoading } = usePortfolioPdfExport();
    const { openPrintWindow } = usePortfolioPrintView();

    const handleExcelExport = async () => {
        await exportExcel(selectedPortfolios, totalCount, filters);
    };

    const handlePdfExport = () => {
        exportPortfolioListPdf(filters);
    };

    const handlePrint = () => {
        const ids = selectedPortfolios.map(p => p.id);
        if (ids.length === 0) return;
        openPrintWindow(ids);
    };

    const hasSelection = selectedPortfolios.length > 0;

    return (
        <div className={`flex gap-2 ${className}`}>
            <Button
                onClick={handleExcelExport}
                disabled={isExcelLoading}
                variant="outline"
                size="sm"
                className="gap-2"
            >
                <Download className="w-4 h-4" />
                {isExcelLoading ? 'در حال Export...' : 'Excel'}
            </Button>

            <Button
                onClick={handlePdfExport}
                disabled={isPdfLoading}
                variant="outline"
                size="sm"
                className="gap-2"
            >
                <FileText className="w-4 h-4" />
                {isPdfLoading ? 'در حال Export...' : 'PDF'}
            </Button>

            <Button
                onClick={handlePrint}
                disabled={!hasSelection}
                variant="outline"
                size="sm"
                className="gap-2"
                title={!hasSelection ? 'لطفاً حداقل یک مورد انتخاب کنید' : 'چاپ موارد انتخاب شده'}
            >
                <Printer className="w-4 h-4" />
                چاپ {hasSelection && `(${selectedPortfolios.length})`}
            </Button>
        </div>
    );
}
