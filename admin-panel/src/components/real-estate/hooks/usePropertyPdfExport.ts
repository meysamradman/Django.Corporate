/**
 * Property PDF Export Hook
 */

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { PropertyExportParams } from '@/types/real_estate/realEstateListParams';
import { exportProperties, exportPropertyPdf } from '@/api/real-estate/export';

interface UsePropertyPdfExportOptions {
    onSuccess?: () => void;
    onError?: (error: Error) => void;
}

export function usePropertyPdfExport(options?: UsePropertyPdfExportOptions) {
    const exportSinglePdf = useMutation({
        mutationFn: async (propertyId: number) => {
            await exportPropertyPdf(propertyId);
        },
        onSuccess: () => {
            toast.success('سند ملک با موفقیت دانلود شد');
            options?.onSuccess?.();
        },
        onError: (error: Error) => {
            toast.error('خطا در دانلود سند ملک');
            options?.onError?.(error);
        },
    });

    const exportListPdf = useMutation({
        mutationFn: async (filters?: PropertyExportParams) => {
            await exportProperties(filters, 'pdf');
        },
        onSuccess: () => {
            toast.success('لیست املاک با موفقیت دانلود شد');
            options?.onSuccess?.();
        },
        onError: (error: Error) => {
            toast.error('خطا در دانلود لیست املاک');
            options?.onError?.(error);
        },
    });

    return {
        exportSinglePropertyPdf: exportSinglePdf.mutate,
        exportPropertyListPdf: exportListPdf.mutate,
        isExportingSingle: exportSinglePdf.isPending,
        isExportingList: exportListPdf.isPending,
        isLoading: exportSinglePdf.isPending || exportListPdf.isPending,
    };
}
