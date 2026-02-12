import { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SortingState } from '@tanstack/react-table';
import type { TablePaginationState } from '@/types/shared/pagination';
import type { PortfolioFilters } from '@/types/portfolio/portfolioListParams';
import type { Portfolio } from '@/types/portfolio/portfolio';
import { portfolioApi } from '@/api/portfolios/portfolios';
import { showError, showSuccess, showWarning } from '@/core/toast';
import { msg, getStatus } from '@/core/messages';
import { usePortfolioExcelExport } from '@/components/portfolios/hooks/usePortfolioExcelExport';
import { usePortfolioPdfExport } from '@/components/portfolios/hooks/usePortfolioPdfExport';
import { usePortfolioPrintView } from '@/components/portfolios/hooks/usePortfolioPrintView';
import type { PortfolioDeleteConfirmState } from '@/types/shared/deleteConfirm';


interface UsePortfolioListActionsParams {
  data: Portfolio[];
  totalCount: number;
  pagination: TablePaginationState;
  sorting: SortingState;
  rowSelection: Record<string, boolean>;
  setRowSelection: Dispatch<SetStateAction<Record<string, boolean>>>;
  queryParams: Record<string, any>;
}

export function usePortfolioListActions({
  data,
  totalCount,
  pagination,
  sorting,
  rowSelection,
  setRowSelection,
  queryParams,
}: UsePortfolioListActionsParams) {
  const queryClient = useQueryClient();
  const [deleteConfirm, setDeleteConfirm] = useState<PortfolioDeleteConfirmState>({
    open: false,
    isBulk: false,
  });

  const deletePortfolioMutation = useMutation({
    mutationFn: (portfolioId: number) => portfolioApi.deletePortfolio(portfolioId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolios'] });
      showSuccess(msg.crud('deleted', { item: 'نمونه‌کار' }));
    },
    onError: () => {
      showError('خطای سرور رخ داد');
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (portfolioIds: number[]) => portfolioApi.bulkDeletePortfolios(portfolioIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolios'] });
      showSuccess(msg.crud('deleted', { item: 'نمونه‌کارها' }));
      setRowSelection({});
    },
    onError: () => {
      showError('خطای سرور رخ داد');
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: number; is_active: boolean }) => {
      return portfolioApi.partialUpdatePortfolio(id, { is_active });
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['portfolios'] });
      showSuccess(updated.is_active ? getStatus('active') : getStatus('inactive'));
    },
    onError: () => {
      showError(getStatus('statusChangeError'));
    },
  });

  const handleToggleActive = (portfolio: Portfolio) => {
    toggleActiveMutation.mutate({
      id: portfolio.id,
      is_active: !portfolio.is_active,
    });
  };

  const handleDeletePortfolio = (portfolioId: number | string) => {
    setDeleteConfirm({
      open: true,
      portfolioId: Number(portfolioId),
      isBulk: false,
    });
  };

  const handleDeleteSelected = (selectedIds: (string | number)[]) => {
    setDeleteConfirm({
      open: true,
      portfolioIds: selectedIds.map((id) => Number(id)),
      isBulk: true,
    });
  };

  const handleConfirmDelete = async () => {
    try {
      if (deleteConfirm.isBulk && deleteConfirm.portfolioIds) {
        await bulkDeleteMutation.mutateAsync(deleteConfirm.portfolioIds);
      } else if (!deleteConfirm.isBulk && deleteConfirm.portfolioId) {
        await deletePortfolioMutation.mutateAsync(deleteConfirm.portfolioId);
      }
    } catch {
    }

    setDeleteConfirm({ open: false, isBulk: false });
  };

  const { exportExcel, isLoading: isExcelLoading } = usePortfolioExcelExport();
  const { exportPortfolioListPdf, exportSinglePortfolioPdf, isLoading: isPdfLoading } = usePortfolioPdfExport();
  const { openPrintWindow } = usePortfolioPrintView();

  const handleExcelExport = async (filters: PortfolioFilters, search: string, exportAll = false) => {
    const exportParams: any = {
      search: search || undefined,
      order_by: sorting.length > 0 ? sorting[0].id : 'created_at',
      order_desc: sorting.length > 0 ? sorting[0].desc : true,
      status: filters.status,
      is_featured: filters.is_featured,
      is_public: filters.is_public,
      is_active: filters.is_active,
      categories__in: filters.category ? filters.category.toString() : undefined,
    };

    if (exportAll) {
      exportParams.export_all = true;
    } else {
      exportParams.page = pagination.pageIndex + 1;
      exportParams.size = pagination.pageSize;
    }

    await exportExcel(data, totalCount, exportParams);
  };

  const handlePdfExport = async (filters: PortfolioFilters, search: string, exportAll = false) => {
    const exportParams: any = {
      search: search || undefined,
      order_by: sorting.length > 0 ? sorting[0].id : 'created_at',
      order_desc: sorting.length > 0 ? sorting[0].desc : true,
      status: filters.status,
      is_featured: filters.is_featured,
      is_public: filters.is_public,
      is_active: filters.is_active,
      categories__in: filters.category ? filters.category.toString() : undefined,
    };

    if (exportAll) {
      exportParams.export_all = true;
    } else {
      exportParams.page = pagination.pageIndex + 1;
      exportParams.size = pagination.pageSize;
    }

    exportPortfolioListPdf(exportParams);
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
        openPrintWindow(data.map((portfolio) => portfolio.id));
      }
      return;
    }

    try {
      showWarning('در حال آماده‌سازی فایل پرینت برای تمامی موارد...');
      const response = await portfolioApi.getPortfolioList({
        ...queryParams,
        page: 1,
        size: 10000,
      });

      const allIds = response.data.map((portfolio) => portfolio.id);
      if (allIds.length > 0) {
        openPrintWindow(allIds);
      } else {
        showError('داده‌ای برای پرینت یافت نشد');
      }
    } catch {
      showError('خطا در بارگذاری داده‌ها برای پرینت');
    }
  };

  return {
    deleteConfirm,
    setDeleteConfirm,
    handleDeletePortfolio,
    handleDeleteSelected,
    handleConfirmDelete,
    handleToggleActive,
    handleExcelExport,
    handlePdfExport,
    handlePrintAction,
    exportSinglePortfolioPdf,
    isExcelLoading,
    isPdfLoading,
  };
}
