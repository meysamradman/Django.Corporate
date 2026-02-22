/**
 * Portfolio PDF Export Hook
 */

import { useMutation } from '@tanstack/react-query';
import { toast } from '@/core/toast';
import type { PortfolioExportParams } from '@/types/portfolio/portfolioListParams';
import { exportPortfolios, exportPortfolioPdf } from '@/api/portfolios/export';
import { getExport } from '@/core/messages/ui';

interface UsePortfolioPdfExportOptions {
    onSuccess?: () => void;
    onError?: (error: Error) => void;
}

export function usePortfolioPdfExport(options?: UsePortfolioPdfExportOptions) {
    const exportSinglePdf = useMutation({
        mutationFn: async (portfolioId: number) => {
            await exportPortfolioPdf(portfolioId);
        },
        onSuccess: () => {
            toast.success(getExport('pdfSuccess'));
            options?.onSuccess?.();
        },
        onError: (error: Error) => {
            toast.error(getExport('pdfError'));
            options?.onError?.(error);
        },
    });

    const exportListPdf = useMutation({
        mutationFn: async (filters?: PortfolioExportParams) => {
            await exportPortfolios(filters, 'pdf');
        },
        onSuccess: () => {
            toast.success(getExport('pdfSuccess'));
            options?.onSuccess?.();
        },
        onError: (error: Error) => {
            toast.error(getExport('pdfError'));
            options?.onError?.(error);
        },
    });

    return {
        exportSinglePortfolioPdf: exportSinglePdf.mutate,
        exportPortfolioListPdf: exportListPdf.mutate,
        isExportingSingle: exportSinglePdf.isPending,
        isExportingList: exportListPdf.isPending,
        isLoading: exportSinglePdf.isPending || exportListPdf.isPending,
    };
}
