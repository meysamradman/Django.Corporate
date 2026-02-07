import { useMutation } from '@tanstack/react-query';
import type { Portfolio } from '@/types/portfolio/portfolio';
import type { PortfolioExportParams } from '@/types/portfolio/portfolioListParams';
import { exportPortfoliosToExcel } from '@/lib/export/portfolio-excel-client';
import { exportPortfolios } from '@/api/portfolios/export';
import { useHybridExport } from '@/components/shared/useHybridExport';

interface UsePortfolioExcelExportOptions {
    onSuccess?: () => void;
    onError?: (error: Error) => void;
}

export function usePortfolioExcelExport(options?: UsePortfolioExcelExportOptions) {
    const backendExport = useMutation({
        mutationFn: async (filters?: PortfolioExportParams) => {
            await exportPortfolios(filters, 'excel');
        },
        onSuccess: () => options?.onSuccess?.(),
        onError: (error) => options?.onError?.(error),
    });

    const { exportData, isLoading } = useHybridExport<Portfolio, PortfolioExportParams>({
        onClientExport: exportPortfoliosToExcel,
        backendMutation: backendExport,
        itemLabel: 'نمونه‌کار',
        filenamePrefix: 'portfolios',
    });

    return {
        exportExcel: exportData,
        isLoading,
    };
}
