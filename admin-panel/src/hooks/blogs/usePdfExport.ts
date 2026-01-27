/**
 * PDF Export Hook
 * 
 * Handles PDF export via backend API
 */

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { BlogExportParams } from '@/types/blog/blogListParams';
import { exportBlogs, exportBlogPdf } from '@/api/blogs/export';

interface UsePdfExportOptions {
    onSuccess?: () => void;
    onError?: (error: Error) => void;
}

export function usePdfExport(options?: UsePdfExportOptions) {
    // Export single blog PDF
    const exportSingleBlog = useMutation({
        mutationFn: async (blogId: number) => {
            await exportBlogPdf(blogId);
        },
        onSuccess: () => {
            toast.success('فایل PDF با موفقیت دانلود شد');
            options?.onSuccess?.();
        },
        onError: (error: Error) => {
            toast.error('خطا در دانلود فایل PDF');
            console.error('PDF export error:', error);
            options?.onError?.(error);
        },
    });

    // Export blog list PDF
    const exportBlogList = useMutation({
        mutationFn: async (filters?: BlogExportParams) => {
            await exportBlogs(filters, 'pdf');
        },
        onSuccess: () => {
            toast.success('فایل PDF با موفقیت دانلود شد');
            options?.onSuccess?.();
        },
        onError: (error: Error) => {
            toast.error('خطا در دانلود فایل PDF');
            console.error('PDF list export error:', error);
            options?.onError?.(error);
        },
    });

    return {
        exportSingleBlogPdf: exportSingleBlog.mutate,
        exportBlogListPdf: exportBlogList.mutate,
        isExportingSingle: exportSingleBlog.isPending,
        isExportingList: exportBlogList.isPending,
        isLoading: exportSingleBlog.isPending || exportBlogList.isPending,
    };
}
