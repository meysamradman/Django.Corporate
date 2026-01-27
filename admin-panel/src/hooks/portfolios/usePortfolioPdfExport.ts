/**
 * Portfolio PDF Export Hook
 */

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { PortfolioExportParams } from '@/types/portfolio/portfolioListParams';
import { exportPortfolios, exportPortfolioPdf } from '@/api/portfolios/export';

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
            toast.success('فایل PDF پروژه با موفقیت دانلود شد');
            options?.onSuccess?.();
        },
        onError: (error: Error) => {
            toast.error('خطا در دانلود فایل PDF پروژه');
            options?.onError?.(error);
        },
    });

    const exportListPdf = useMutation({
        mutationFn: async (filters?: PortfolioExportParams) => {
            await exportPortfolios(filters, 'pdf');
        },
        onSuccess: () => {
            toast.success('فایل PDF لیست پروژه‌ها با موفقیت دانلود شد');
            options?.onSuccess?.();
        },
        onError: (error: Error) => {
            toast.error('خطا در دانلود فایل PDF لیست پروژه‌ها');
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
