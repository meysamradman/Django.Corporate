import { useMutation } from '@tanstack/react-query';
import type { Blog } from '@/types/blog/blog';
import type { BlogExportParams } from '@/types/blog/blogListParams';
import { exportBlogsToExcel } from '@/components/blogs/export/excel-client';
import { exportBlogs } from '@/api/blogs/export';
import { useHybridExport } from '@/components/shared/useHybridExport';

interface UseExcelExportOptions {
    onSuccess?: () => void;
    onError?: (error: Error) => void;
}

export function useExcelExport(options?: UseExcelExportOptions) {
    const backendExport = useMutation({
        mutationFn: async (filters?: BlogExportParams) => {
            await exportBlogs(filters, 'excel');
        },
        onSuccess: () => options?.onSuccess?.(),
        onError: (error) => options?.onError?.(error),
    });

    const { exportData, isLoading } = useHybridExport<Blog, BlogExportParams>({
        onClientExport: exportBlogsToExcel,
        backendMutation: backendExport,
        itemLabel: 'بلاگ',
        filenamePrefix: 'blogs',
    });

    return {
        exportExcel: exportData,
        isLoading,
    };
}
