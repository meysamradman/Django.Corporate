import { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SortingState } from '@tanstack/react-table';
import type { TablePaginationState } from '@/types/shared/pagination';
import type { BlogFilters } from '@/types/blog/blogListParams';
import type { Blog } from '@/types/blog/blog';
import { blogApi } from '@/api/blogs/blogs';
import { notifyApiError, showError, showSuccess, showWarning } from '@/core/toast';
import { msg } from '@/core/messages';
import { useExcelExport } from '@/components/blogs/hooks/useExcelExport';
import { usePdfExport } from '@/components/blogs/hooks/usePdfExport';
import { usePrintView } from '@/components/blogs/hooks/usePrintView';
import type { BlogDeleteConfirmState } from '@/types/shared/deleteConfirm';

interface UseBlogListActionsParams {
  data: Blog[];
  totalCount: number;
  pagination: TablePaginationState;
  sorting: SortingState;
  rowSelection: Record<string, boolean>;
  setRowSelection: Dispatch<SetStateAction<Record<string, boolean>>>;
  queryParams: Record<string, any>;
}

export function useBlogListActions({
  data,
  totalCount,
  pagination,
  sorting,
  rowSelection,
  setRowSelection,
  queryParams,
}: UseBlogListActionsParams) {
  const queryClient = useQueryClient();
  const [deleteConfirm, setDeleteConfirm] = useState<BlogDeleteConfirmState>({
    open: false,
    isBulk: false,
  });

  const deleteBlogMutation = useMutation({
    mutationFn: (blogId: number) => blogApi.deleteBlog(blogId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
      showSuccess(msg.crud('deleted', { item: 'بلاگ' }));
    },
    onError: (error) => {
      notifyApiError(error, {
        fallbackMessage: msg.error('serverError'),
        dedupeKey: 'blog-delete-error',
        preferBackendMessage: false,
      });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (blogIds: number[]) => blogApi.bulkDeleteBlogs(blogIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
      showSuccess(msg.crud('deleted', { item: 'بلاگ' }));
      setRowSelection({});
    },
    onError: (error) => {
      notifyApiError(error, {
        fallbackMessage: msg.error('serverError'),
        dedupeKey: 'blog-bulk-delete-error',
        preferBackendMessage: false,
      });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: number; is_active: boolean }) => {
      return blogApi.partialUpdateBlog(id, { is_active });
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
      showSuccess(msg.crud(updated.is_active ? 'activated' : 'deactivated', { item: 'بلاگ' }));
    },
    onError: (error) => {
      notifyApiError(error, {
        fallbackMessage: msg.status('statusChangeError'),
        dedupeKey: 'blog-toggle-active-error',
        preferBackendMessage: false,
      });
    },
  });

  const handleToggleActive = (blog: Blog) => {
    toggleActiveMutation.mutate({
      id: blog.id,
      is_active: !blog.is_active,
    });
  };

  const handleDeleteBlog = (blogId: number | string) => {
    setDeleteConfirm({
      open: true,
      blogId: Number(blogId),
      isBulk: false,
    });
  };

  const handleDeleteSelected = (selectedIds: (string | number)[]) => {
    setDeleteConfirm({
      open: true,
      blogIds: selectedIds.map((id) => Number(id)),
      isBulk: true,
    });
  };

  const handleConfirmDelete = async () => {
    try {
      if (deleteConfirm.isBulk && deleteConfirm.blogIds) {
        await bulkDeleteMutation.mutateAsync(deleteConfirm.blogIds);
      } else if (!deleteConfirm.isBulk && deleteConfirm.blogId) {
        await deleteBlogMutation.mutateAsync(deleteConfirm.blogId);
      }
    } catch {
    }

    setDeleteConfirm({ open: false, isBulk: false });
  };

  const { exportExcel, isLoading: isExcelLoading } = useExcelExport();
  const { exportBlogListPdf, isLoading: isPdfLoading } = usePdfExport();
  const { openPrintWindow } = usePrintView();

  const handleExcelExport = async (filters: BlogFilters, search: string, exportAll = false) => {
    const exportParams: any = {
      search: search || undefined,
      order_by: sorting.length > 0 ? sorting[0].id : 'created_at',
      order_desc: sorting.length > 0 ? sorting[0].desc : true,
      status: filters.status,
      is_featured: filters.is_featured,
      is_public: filters.is_public,
      is_active: filters.is_active,
      categories__in: filters.categories ? filters.categories.toString() : undefined,
    };

    if (exportAll) {
      exportParams.export_all = true;
    } else {
      exportParams.page = pagination.pageIndex + 1;
      exportParams.size = pagination.pageSize;
    }

    await exportExcel(data, totalCount, exportParams);
  };

  const handlePdfExport = async (filters: BlogFilters, search: string, exportAll = false) => {
    const exportParams: any = {
      search: search || undefined,
      order_by: sorting.length > 0 ? sorting[0].id : 'created_at',
      order_desc: sorting.length > 0 ? sorting[0].desc : true,
      status: filters.status,
      is_featured: filters.is_featured,
      is_public: filters.is_public,
      is_active: filters.is_active,
      categories__in: filters.categories ? filters.categories.toString() : undefined,
    };

    if (exportAll) {
      exportParams.export_all = true;
    } else {
      exportParams.page = pagination.pageIndex + 1;
      exportParams.size = pagination.pageSize;
    }

    exportBlogListPdf(exportParams);
  };

  const handlePrintAction = async (printAll = false) => {
    if (!printAll) {
      const selectedIds = Object.keys(rowSelection)
        .filter((key) => rowSelection[key])
        .map((idx) => data[parseInt(idx, 10)]?.id)
        .filter(Boolean) as number[];

      if (selectedIds.length > 0) {
        openPrintWindow(selectedIds);
      } else {
        openPrintWindow(data.map((blog) => blog.id));
      }
      return;
    }

    try {
      showWarning(msg.export('printPreparingAll'));
      const response = await blogApi.getBlogList({
        ...queryParams,
        page: 1,
        size: 10000,
      });

      const allIds = response.data.map((blog) => blog.id);
      if (allIds.length > 0) {
        openPrintWindow(allIds);
      } else {
        showError(msg.export('printNoData'));
      }
    } catch (error) {
      notifyApiError(error, {
        fallbackMessage: msg.export('printError'),
        dedupeKey: 'blog-print-load-error',
        preferBackendMessage: false,
      });
    }
  };

  return {
    deleteConfirm,
    setDeleteConfirm,
    handleDeleteBlog,
    handleDeleteSelected,
    handleConfirmDelete,
    handleToggleActive,
    handleExcelExport,
    handlePdfExport,
    handlePrintAction,
    isExcelLoading,
    isPdfLoading,
  };
}
