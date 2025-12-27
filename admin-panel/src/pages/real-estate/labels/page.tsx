import { useState, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader/PageHeader";
import { usePropertyLabelColumns } from "@/components/real-estate/labels/PropertyLabelTableColumns";
import { usePropertyLabelFilterOptions, getPropertyLabelFilterConfig } from "@/components/real-estate/labels/PropertyLabelTableFilters";
import type { OnChangeFn, SortingState } from "@tanstack/react-table";
import type { TablePaginationState } from '@/types/shared/pagination';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { initSortingFromURL } from "@/components/tables/utils/tableSorting";
import { Plus } from "lucide-react";
import { ProtectedButton } from "@/components/admins/permissions";
import { showError, showSuccess } from '@/core/toast';
import { realEstateApi } from "@/api/real-estate";
import type { PropertyLabel } from "@/types/real_estate/label/realEstateLabel";
import type { ColumnDef } from "@tanstack/react-table";
import { getCrud, getConfirm, getStatus } from '@/core/messages';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/elements/AlertDialog";
import type { DataTableRowAction } from "@/types/shared/table";
import { Edit, Trash2 } from "lucide-react";

const DataTable = lazy(() => import("@/components/tables/DataTable").then(mod => ({ default: mod.DataTable })));

export default function PropertyLabelsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { booleanFilterOptions } = usePropertyLabelFilterOptions();
  
  const [pagination, setPagination] = useState<TablePaginationState>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const page = parseInt(urlParams.get('page') || '1', 10);
      const size = parseInt(urlParams.get('size') || '10', 10);
      return {
        pageIndex: Math.max(0, page - 1),
        pageSize: size,
      };
    }
    return {
      pageIndex: 0,
      pageSize: 10,
    };
  });
  const [sorting, setSorting] = useState<SortingState>(() => initSortingFromURL());
  const [rowSelection, setRowSelection] = useState({});
  const [searchValue, setSearchValue] = useState(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('search') || '';
    }
    return '';
  });
  const [clientFilters, setClientFilters] = useState<Record<string, unknown>>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const filters: Record<string, unknown> = {};
      if (urlParams.get('is_active')) filters.is_active = urlParams.get('is_active') === 'true';
      return filters;
    }
    return {};
  });

  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    labelId?: number;
    labelIds?: number[];
    isBulk: boolean;
  }>({
    open: false,
    isBulk: false,
  });

  const labelFilterConfig = getPropertyLabelFilterConfig(booleanFilterOptions);

  const queryParams = {
    search: searchValue,
    page: pagination.pageIndex + 1,
    size: pagination.pageSize,
    order_by: sorting.length > 0 ? sorting[0].id : "created_at",
    order_desc: sorting.length > 0 ? sorting[0].desc : true,
    is_active: clientFilters.is_active as boolean | undefined,
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ['property-labels', queryParams.search, queryParams.page, queryParams.size, queryParams.order_by, queryParams.order_desc, queryParams.is_active],
    queryFn: async () => {
      const response = await realEstateApi.getLabels(queryParams);
      return response;
    },
    staleTime: 0,
    retry: 1,
  });

  const dataList: PropertyLabel[] = data?.data || [];
  const pageCount = data?.pagination?.total_pages || 1;

  const deleteLabelMutation = useMutation({
    mutationFn: (labelId: number) => realEstateApi.deleteLabel(labelId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-labels'] });
      showSuccess(getCrud('deleted', { item: 'برچسب ملک' }));
    },
    onError: (_error) => {
      showError('خطای سرور رخ داد');
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (labelIds: number[]) => Promise.all(labelIds.map(id => realEstateApi.deleteLabel(id))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-labels'] });
      showSuccess(getCrud('deleted', { item: 'برچسب‌های ملک' }));
      setRowSelection({});
    },
    onError: (_error) => {
      showError('خطای سرور رخ داد');
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: number; is_active: boolean }) => {
      return await realEstateApi.partialUpdateLabel(id, { is_active });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['property-labels'] });
      showSuccess(data.is_active ? getStatus('active') : getStatus('inactive'));
    },
    onError: (_error) => {
      showError(getStatus('statusChangeError'));
    },
  });

  const handleToggleActive = (label: PropertyLabel) => {
    toggleActiveMutation.mutate({
      id: label.id,
      is_active: !label.is_active,
    });
  };

  const handleDeleteLabel = (labelId: number | string) => {
    setDeleteConfirm({
      open: true,
      labelId: Number(labelId),
      isBulk: false,
    });
  };

  const handleDeleteSelected = (selectedIds: (string | number)[]) => {
    setDeleteConfirm({
      open: true,
      labelIds: selectedIds.map(id => Number(id)),
      isBulk: true,
    });
  };

  const handleConfirmDelete = async () => {
    try {
      if (deleteConfirm.isBulk && deleteConfirm.labelIds) {
        await bulkDeleteMutation.mutateAsync(deleteConfirm.labelIds);
      } else if (!deleteConfirm.isBulk && deleteConfirm.labelId) {
        await deleteLabelMutation.mutateAsync(deleteConfirm.labelId);
      }
    } catch (error) {
    }
    setDeleteConfirm({ open: false, isBulk: false });
  };

  const rowActions: DataTableRowAction<PropertyLabel>[] = [
    {
      label: "ویرایش",
      icon: <Edit className="h-4 w-4" />,
      onClick: (label) => navigate(`/real-estate/labels/${label.id}/edit`),
      permission: "property_label.update",
    },
    {
      label: "حذف",
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (label) => handleDeleteLabel(label.id),
      isDestructive: true,
      permission: "property_label.delete",
    },
  ];
  
  const columns = usePropertyLabelColumns(rowActions, handleToggleActive) as ColumnDef<PropertyLabel>[];

  const handleFilterChange = (filterId: string | number, value: unknown) => {
    const filterKey = filterId as string;
    
    if (filterKey === "search") {
      setSearchValue(typeof value === 'string' ? value : '');
      setPagination(prev => ({ ...prev, pageIndex: 0 }));
      
      const url = new URL(window.location.href);
      if (value && typeof value === 'string') {
        url.searchParams.set('search', value);
      } else {
        url.searchParams.delete('search');
      }
      url.searchParams.set('page', '1');
      window.history.replaceState({}, '', url.toString());
    } else {
      setClientFilters(prev => ({
        ...prev,
        [filterKey]: value as string | boolean | number | undefined
      }));
      setPagination(prev => ({ ...prev, pageIndex: 0 }));
      
      const url = new URL(window.location.href);
      if (value !== undefined && value !== null) {
        if (typeof value === 'boolean') {
          url.searchParams.set(filterKey, value.toString());
        } else {
          url.searchParams.set(filterKey, String(value));
        }
      } else {
        url.searchParams.delete(filterKey);
      }
      url.searchParams.set('page', '1');
      window.history.replaceState({}, '', url.toString());
    }
  };

  const handlePaginationChange: OnChangeFn<TablePaginationState> = (updaterOrValue) => {
    const newPagination = typeof updaterOrValue === 'function' 
      ? updaterOrValue(pagination) 
      : updaterOrValue;
    
    setPagination(newPagination);
    
    const url = new URL(window.location.href);
    url.searchParams.set('page', String(newPagination.pageIndex + 1));
    url.searchParams.set('size', String(newPagination.pageSize));
    window.history.replaceState({}, '', url.toString());
  };

  const handleSortingChange: OnChangeFn<SortingState> = (updaterOrValue) => {
    const newSorting = typeof updaterOrValue === 'function' 
      ? updaterOrValue(sorting) 
      : updaterOrValue;
    
    setSorting(newSorting);
    
    const url = new URL(window.location.href);
    if (newSorting.length > 0) {
      url.searchParams.set('order_by', newSorting[0].id);
      url.searchParams.set('order_desc', String(newSorting[0].desc));
    } else {
      url.searchParams.delete('order_by');
      url.searchParams.delete('order_desc');
    }
    window.history.replaceState({}, '', url.toString());
  };

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="مدیریت برچسب‌های ملک" />
        <div className="text-center py-8">
          <p className="text-red-1 mb-4">خطا در بارگذاری داده‌ها</p>
          <p className="text-sm text-font-s mb-4">
            سرور با خطای 500 پاسخ داده است. لطفاً با مدیر سیستم تماس بگیرید.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="مدیریت برچسب‌های ملک">
        <ProtectedButton 
          permission="property_label.create"
          size="sm"
          onClick={() => navigate('/real-estate/labels/create')}
        >
          <Plus className="h-4 w-4" />
          افزودن برچسب
        </ProtectedButton>
      </PageHeader>

      <Suspense fallback={null}>
        <DataTable
          columns={columns as any}
          data={dataList}
          pageCount={pageCount}
          isLoading={isLoading}
          onPaginationChange={handlePaginationChange}
          onSortingChange={handleSortingChange}
          onRowSelectionChange={setRowSelection}
          clientFilters={clientFilters}
          onFilterChange={handleFilterChange}
          state={{
            pagination,
            sorting,
            rowSelection,
          }}
          searchValue={searchValue}
          pageSizeOptions={[10, 20, 50]}
          deleteConfig={{
            onDeleteSelected: handleDeleteSelected,
            permission: "property_label.delete",
            denyMessage: "اجازه حذف برچسب ملک ندارید",
          }}
          filterConfig={labelFilterConfig}
        />
      </Suspense>

      <AlertDialog 
        open={deleteConfirm.open} 
        onOpenChange={(open) => setDeleteConfirm(prev => ({ ...prev, open }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تایید حذف</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirm.isBulk
                ? getConfirm('bulkDelete', { item: 'برچسب ملک', count: deleteConfirm.labelIds?.length || 0 })
                : getConfirm('delete', { item: 'برچسب ملک' })
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              لغو
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-static-w hover:bg-destructive/90"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
