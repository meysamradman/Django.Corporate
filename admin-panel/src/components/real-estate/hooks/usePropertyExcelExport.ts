import { useMutation } from '@tanstack/react-query';
import type { Property } from '@/types/real_estate/realEstate';
import type { PropertyExportParams } from '@/types/real_estate/realEstateListParams';
import { exportPropertiesToExcel } from '@/components/real-estate/export/property-excel-client';
import { exportProperties } from '@/api/real-estate/export';
import { useHybridExport } from '@/components/shared/useHybridExport';

interface UsePropertyExcelExportOptions {
    onSuccess?: () => void;
    onError?: (error: Error) => void;
}

export function usePropertyExcelExport(options?: UsePropertyExcelExportOptions) {
    const backendExport = useMutation({
        mutationFn: async (filters?: PropertyExportParams) => {
            await exportProperties(filters, 'excel');
        },
        onSuccess: () => options?.onSuccess?.(),
        onError: (error) => options?.onError?.(error),
    });

    const { exportData, isLoading } = useHybridExport<Property, PropertyExportParams>({
        onClientExport: exportPropertiesToExcel,
        backendMutation: backendExport,
        itemLabel: 'ملک',
        filenamePrefix: 'properties',
    });

    return {
        exportExcel: exportData,
        isLoading,
    };
}
