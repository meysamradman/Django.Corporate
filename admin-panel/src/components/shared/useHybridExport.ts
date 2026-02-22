/**
 * Unified Hybrid Export Hook
 * 
 * Strategy: Client-side for small data, Backend API for large data.
 * Used for both Blogs and Portfolios.
 */

import type { UseMutationResult } from '@tanstack/react-query';
import { toast } from '@/core/toast';
import { shouldUseClientSideExport } from '@/components/shared/export/excelExportConfig';
import { getExport } from '@/core/messages/ui';

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
        const toastId = toast.loading(getExport('excelPreparing', { item: itemLabel }));
        try {
            if (shouldUseClientSideExport(totalCount)) {
                const filename = `${filenamePrefix}_${new Date().toISOString().split('T')[0]}`;
                await onClientExport(data, filename);

                toast.success(getExport('excelReadyWithCount', { count: data.length }), { id: toastId });
            } else {
                toast.info(getExport('serverFetchingCount', { count: totalCount }), { id: toastId });
                await backendMutation.mutateAsync(params);
                toast.success(getExport('fileReceived', { item: itemLabel }), { id: toastId });
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : getExport('exportErrorForItem', { item: itemLabel }), { id: toastId });
            console.error(`Export error (${itemLabel}):`, error);
        }
    };

    return {
        exportData,
        isLoading: backendMutation.isPending,
    };
}
