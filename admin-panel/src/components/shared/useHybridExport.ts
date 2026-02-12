/**
 * Unified Hybrid Export Hook
 * 
 * Strategy: Client-side for small data, Backend API for large data.
 * Used for both Blogs and Portfolios.
 */

import type { UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { shouldUseClientSideExport } from '@/components/shared/export/excelExportConfig';

interface HybridExportOptions<TData, TParams> {
    onClientExport: (data: TData[], filename: string) => Promise<void>;
    backendMutation: UseMutationResult<void, Error, TParams | undefined>;
    itemLabel: string; // e.g., "بلاگ" or "نمونه‌کار"
    filenamePrefix: string;
}

export function useHybridExport<TData, TParams>(options: HybridExportOptions<TData, TParams>) {
    const { onClientExport, backendMutation, itemLabel, filenamePrefix } = options;

    const exportData = async (
        data: TData[],
        totalCount: number,
        params?: TParams
    ) => {
        const toastId = toast.loading(`در حال آماده‌سازی فایل Excel (${itemLabel})...`);
        try {
            if (shouldUseClientSideExport(totalCount)) {
                const filename = `${filenamePrefix}_${new Date().toISOString().split('T')[0]}`;
                await onClientExport(data, filename);

                toast.success(`فایل Excel با ${data.length} رکورد آماده شد`, { id: toastId });
            } else {
                toast.info(`تعداد ${totalCount} رکورد از سرور دریافت می‌شود...`, { id: toastId });
                await backendMutation.mutateAsync(params);
                toast.success(`فایل ${itemLabel} با موفقیت دریافت شد`, { id: toastId });
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : `خطا در Export ${itemLabel}`, { id: toastId });
            console.error(`Export error (${itemLabel}):`, error);
        }
    };

    return {
        exportData,
        isLoading: backendMutation.isPending,
    };
}
