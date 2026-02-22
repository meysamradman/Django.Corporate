/**
 * Property PDF Export Hook
 */

import { useMutation } from '@tanstack/react-query';
import { toast } from '@/core/toast';
import type { PropertyExportParams } from '@/types/real_estate/realEstateListParams';
import { exportProperties, exportPropertyPdf } from '@/api/real-estate/export';
import { getExport } from '@/core/messages/ui';

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
            toast.success(getExport('pdfSuccess'));
            options?.onSuccess?.();
        },
        onError: (error: Error) => {
            toast.error(getExport('pdfError'));
            options?.onError?.(error);
        },
    });

    const exportListPdf = useMutation({
        mutationFn: async (filters?: PropertyExportParams) => {
            await exportProperties(filters, 'pdf');
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
        exportSinglePropertyPdf: exportSinglePdf.mutate,
        exportPropertyListPdf: exportListPdf.mutate,
        isExportingSingle: exportSinglePdf.isPending,
        isExportingList: exportListPdf.isPending,
        isLoading: exportSinglePdf.isPending || exportListPdf.isPending,
    };
}
