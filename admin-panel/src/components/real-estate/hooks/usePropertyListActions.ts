import { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SortingState } from '@tanstack/react-table';
import type { TablePaginationState } from '@/types/shared/pagination';
import type { PropertyFilters } from '@/types/real_estate/realEstateListParams';
import type { Property } from '@/types/real_estate/realEstate';
import { realEstateApi } from '@/api/real-estate';
import { msg, getStatus } from '@/core/messages';
import { showError, showSuccess, showWarning } from '@/core/toast';
import { usePropertyExcelExport } from '@/components/real-estate/hooks/usePropertyExcelExport';
import { usePropertyPdfExport } from '@/components/real-estate/hooks/usePropertyPdfExport';
import { usePropertyPrintView } from '@/components/real-estate/hooks/usePropertyPrintView';
import type { PropertyDeleteConfirmState } from '@/types/shared/deleteConfirm';


interface UsePropertyListActionsParams {
  data: Property[];
  totalCount: number;
  pagination: TablePaginationState;
  sorting: SortingState;
  rowSelection: Record<string, boolean>;
  setRowSelection: Dispatch<SetStateAction<Record<string, boolean>>>;
  queryParams: Record<string, any>;
}

export function usePropertyListActions({
  data,
  totalCount,
  pagination,
  sorting,
  rowSelection,
  setRowSelection,
  queryParams,
}: UsePropertyListActionsParams) {
  const queryClient = useQueryClient();
  const [deleteConfirm, setDeleteConfirm] = useState<PropertyDeleteConfirmState>({
    open: false,
    isBulk: false,
  });

  const deletePropertyMutation = useMutation({
    mutationFn: (propertyId: number) => realEstateApi.deleteProperty(propertyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      showSuccess(msg.crud('deleted', { item: 'ملک' }));
    },
    onError: () => {
      showError('خطای سرور رخ داد');
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (propertyIds: number[]) => realEstateApi.bulkDeleteProperties(propertyIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      showSuccess(msg.crud('deleted', { item: 'ملک‌ها' }));
      setRowSelection({});
    },
    onError: () => {
      showError('خطای سرور رخ داد');
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: number; is_active: boolean }) => {
      return realEstateApi.partialUpdateProperty(id, { is_active });
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      showSuccess(updated.is_active ? getStatus('active') : getStatus('inactive'));
    },
    onError: () => {
      showError(getStatus('statusChangeError'));
    },
  });

  const handleToggleActive = (property: Property) => {
    toggleActiveMutation.mutate({
      id: property.id,
      is_active: !property.is_active,
    });
  };

  const handleDeleteProperty = (propertyId: number | string) => {
    setDeleteConfirm({
      open: true,
      propertyId: Number(propertyId),
      isBulk: false,
    });
  };

  const handleDeleteSelected = (selectedIds: (string | number)[]) => {
    setDeleteConfirm({
      open: true,
      propertyIds: selectedIds.map((id) => Number(id)),
      isBulk: true,
    });
  };

  const handleConfirmDelete = async () => {
    try {
      if (deleteConfirm.isBulk && deleteConfirm.propertyIds) {
        await bulkDeleteMutation.mutateAsync(deleteConfirm.propertyIds);
      } else if (!deleteConfirm.isBulk && deleteConfirm.propertyId) {
        await deletePropertyMutation.mutateAsync(deleteConfirm.propertyId);
      }
    } catch {
    }
    setDeleteConfirm({ open: false, isBulk: false });
  };

  const { exportExcel, isLoading: isExcelLoading } = usePropertyExcelExport();
  const { exportPropertyListPdf, exportSinglePropertyPdf, isLoading: isPdfLoading } = usePropertyPdfExport();
  const { openPrintWindow } = usePropertyPrintView();

  const handleExcelExport = async (filters: PropertyFilters, search: string, exportAll = false) => {
    const exportParams: any = {
      search: search || undefined,
      order_by: sorting.length > 0 ? sorting[0].id : 'created_at',
      order_desc: sorting.length > 0 ? sorting[0].desc : true,
      is_published: filters.is_published,
      is_featured: filters.is_featured,
      is_active: filters.is_active,
      property_types__in: filters.property_type ? String(filters.property_type) : undefined,
      states__in: filters.state ? String(filters.state) : undefined,
      statuses__in: filters.status ? String(filters.status) : undefined,
      cities__in: filters.city ? String(filters.city) : undefined,
    };

    if (exportAll) {
      exportParams.export_all = true;
    } else {
      exportParams.page = pagination.pageIndex + 1;
      exportParams.size = pagination.pageSize;
    }

    await exportExcel(data, totalCount, exportParams);
  };

  const handlePdfExport = async (filters: PropertyFilters, search: string, exportAll = false) => {
    const exportParams: any = {
      search: search || undefined,
      order_by: sorting.length > 0 ? sorting[0].id : 'created_at',
      order_desc: sorting.length > 0 ? sorting[0].desc : true,
      is_published: filters.is_published,
      is_featured: filters.is_featured,
      is_active: filters.is_active,
      property_types__in: filters.property_type ? String(filters.property_type) : undefined,
      states__in: filters.state ? String(filters.state) : undefined,
      statuses__in: filters.status ? String(filters.status) : undefined,
      cities__in: filters.city ? String(filters.city) : undefined,
    };

    if (exportAll) {
      exportParams.export_all = true;
    } else {
      exportParams.page = pagination.pageIndex + 1;
      exportParams.size = pagination.pageSize;
    }

    exportPropertyListPdf(exportParams);
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
        openPrintWindow(data.map((property) => property.id));
      }
      return;
    }

    try {
      showWarning('در حال آماده‌سازی فایل پرینت برای تمامی موارد...');
      const response = await realEstateApi.getPropertyList({
        ...queryParams,
        page: 1,
        size: 10000,
      });

      const allIds = response.data.map((property) => property.id);
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
    handleDeleteProperty,
    handleDeleteSelected,
    handleConfirmDelete,
    handleToggleActive,
    handleExcelExport,
    handlePdfExport,
    handlePrintAction,
    exportSinglePropertyPdf,
    isExcelLoading,
    isPdfLoading,
  };
}
