import { useState, lazy, Suspense } from "react";
import { useTableFilters } from "@/components/tables/utils/useTableFilters";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader/PageHeader";
import { usePropertyStateColumns } from "@/components/real-estate/states/StateTableColumns";
import { usePropertyStateFilterOptions, getPropertyStateFilterConfig } from "@/components/real-estate/states/StateTableFilters";
import type { OnChangeFn, SortingState } from "@tanstack/react-table";
import type { TablePaginationState } from '@/types/shared/pagination';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { initSortingFromURL } from "@/components/tables/utils/tableSorting";
import { Plus } from "lucide-react";
import { ProtectedButton } from "@/core/permissions";
import { showError, showSuccess } from '@/core/toast';
import { realEstateApi } from "@/api/real-estate";
import type { PropertyState } from "@/types/real_estate/state/realEstateState";
import type { ColumnDef } from "@tanstack/react-table";
import { msg, getConfirm, getStatus } from '@/core/messages';
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

export default function PropertyStatesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { booleanFilterOptions } = usePropertyStateFilterOptions();
  const [usageTypeOptions, setUsageTypeOptions] = useState<{ label: string; value: string }[]>([]);

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
      if (urlParams.get('date_from')) filters.date_from = urlParams.get('date_from');
      if (urlParams.get('date_to')) filters.date_to = urlParams.get('date_to');
      return filters;
    }
    return {};
  });

  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    stateId?: number;
    stateIds?: number[];
    isBulk: boolean;
  }>({
    open: false,
    isBulk: false,
  });

  const [_fieldOptions, setFieldOptions] = useState<any>(null);

  useState(() => {
    const fetchOptions = async () => {
      try {
        const options = await realEstateApi.getStateFieldOptions();
        setFieldOptions(options);
        setUsageTypeOptions(options.usage_type.map(([value, label]) => ({ label, value })));
      } catch (error) {
      }
    };
    fetchOptions();
  });

  const { handleFilterChange } = useTableFilters(
    setClientFilters,
    setSearchValue,
    setPagination
  );

  const stateFilterConfig = getPropertyStateFilterConfig(booleanFilterOptions, usageTypeOptions);

  const queryParams = {
    search: searchValue,
    page: pagination.pageIndex + 1,
    size: pagination.pageSize,
    order_by: sorting.length > 0 ? sorting[0].id : "created_at",
    order_desc: sorting.length > 0 ? sorting[0].desc : true,
    is_active: clientFilters.is_active as boolean | undefined,
    date_from: clientFilters.date_from as string | undefined,
    date_to: clientFilters.date_to as string | undefined,
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ['property-states', queryParams.search, queryParams.page, queryParams.size, queryParams.order_by, queryParams.order_desc, queryParams.is_active, queryParams.date_from, queryParams.date_to],
    queryFn: async () => {
      const response = await realEstateApi.getStates(queryParams);
      return response;
    },
    staleTime: 0,
    retry: 1,
  });

  const dataList: PropertyState[] = data?.data || [];
  const pageCount = data?.pagination?.total_pages || 1;

  const deleteStateMutation = useMutation({
    mutationFn: (stateId: number) => realEstateApi.deleteState(stateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-states'] });
      showSuccess(msg.crud('deleted', { item: 'وضعیت ملک' }));
    },
    onError: (_error) => {
      showError('خطای سرور رخ داد');
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (stateIds: number[]) => Promise.all(stateIds.map(id => realEstateApi.deleteState(id))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-states'] });
      showSuccess(msg.crud('deleted', { item: 'وضعیت‌های ملک' }));
      setRowSelection({});
    },
    onError: (_error) => {
      showError('خطای سرور رخ داد');
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: number; is_active: boolean }) => {
      return await realEstateApi.partialUpdateState(id, { is_active });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['property-states'] });
      showSuccess(data.is_active ? getStatus('active') : getStatus('inactive'));
    },
    onError: (_error) => {
      showError(getStatus('statusChangeError'));
    },
  });

  const handleToggleActive = (state: PropertyState) => {
    toggleActiveMutation.mutate({
      id: state.id,
      is_active: !state.is_active,
    });
  };

  const handleDeleteState = (stateId: number | string) => {
    setDeleteConfirm({
      open: true,
      stateId: Number(stateId),
      isBulk: false,
    });
  };

  const handleDeleteSelected = (selectedIds: (string | number)[]) => {
    setDeleteConfirm({
      open: true,
      stateIds: selectedIds.map(id => Number(id)),
      isBulk: true,
    });
  };

  const handleConfirmDelete = async () => {
    try {
      if (deleteConfirm.isBulk && deleteConfirm.stateIds) {
        await bulkDeleteMutation.mutateAsync(deleteConfirm.stateIds);
      } else if (!deleteConfirm.isBulk && deleteConfirm.stateId) {
        await deleteStateMutation.mutateAsync(deleteConfirm.stateId);
      }
    } catch (error) {
    }
    setDeleteConfirm({ open: false, isBulk: false });
  };

  const rowActions: DataTableRowAction<PropertyState>[] = [
    {
      label: "ویرایش",
      icon: <Edit className="h-4 w-4" />,
      onClick: (state) => navigate(`/real-estate/states/${state.id}/edit`),
      permission: "real_estate.state.update",
    },
    {
      label: "حذف",
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (state) => handleDeleteState(state.id),
      isDestructive: true,
      permission: "real_estate.state.delete",
    },
  ];

  const columns = usePropertyStateColumns(rowActions, handleToggleActive) as ColumnDef<PropertyState>[];

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
        <PageHeader title="مدیریت وضعیت‌های ملک" />
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
      <PageHeader title="مدیریت وضعیت‌های ملک">
        <ProtectedButton
          permission="real_estate.state.create"
          size="sm"
          onClick={() => navigate('/real-estate/states/create')}
        >
          <Plus className="h-4 w-4" />
          افزودن وضعیت
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
            permission: "real_estate.state.delete",
            denyMessage: "اجازه حذف وضعیت ملک ندارید",
          }}
          filterConfig={stateFilterConfig}
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
                ? getConfirm('bulkDelete', { item: 'وضعیت ملک', count: deleteConfirm.stateIds?.length || 0 })
                : getConfirm('delete', { item: 'وضعیت ملک' })
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
