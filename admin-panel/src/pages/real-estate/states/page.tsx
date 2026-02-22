import { lazy, Suspense, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader/PageHeader";
import { usePropertyStateColumns } from "@/components/real-estate/states/StateTableColumns";
import { Plus, Edit, Trash2 } from "lucide-react";
import { ProtectedButton } from "@/core/permissions";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { showError } from "@/core/toast";
import { realEstateApi } from "@/api/real-estate";
import type { PropertyState } from "@/types/real_estate/state/realEstateState";
import type { ColumnDef } from "@tanstack/react-table";
import { getConfirm, getError } from "@/core/messages";
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
import { useGlobalDrawerStore } from "@/components/shared/drawer/store";
import { DRAWER_IDS } from "@/components/shared/drawer/types";
import { usePropertyStateListTableState } from "@/components/real-estate/hooks/usePropertyStateListTableState";
import { usePropertyStateListActions } from "@/components/real-estate/hooks/usePropertyStateListActions";

const DataTable = lazy(() => import("@/components/tables/DataTable").then((mod) => ({ default: mod.DataTable })));

export default function PropertyStatesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const open = useGlobalDrawerStore((state) => state.open);

  useEffect(() => {
    if (searchParams.get("action") === "create") {
      open(DRAWER_IDS.REAL_ESTATE_STATE_FORM, {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["property-states"] }),
      });
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("action");
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams, open, queryClient]);

  const {
    pagination,
    sorting,
    rowSelection,
    setRowSelection,
    searchValue,
    clientFilters,
    handleFilterChange,
    stateFilterConfig,
    handlePaginationChange,
    handleSortingChange,
  } = usePropertyStateListTableState();

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
    queryKey: ["property-states", queryParams.search, queryParams.page, queryParams.size, queryParams.order_by, queryParams.order_desc, queryParams.is_active, queryParams.date_from, queryParams.date_to],
    queryFn: async () => {
      const response = await realEstateApi.getStates(queryParams);
      return response;
    },
    staleTime: 0,
    retry: 1,
  });

  const dataList: PropertyState[] = data?.data || [];
  const pageCount = data?.pagination?.total_pages || 1;

  const {
    deleteConfirm,
    setDeleteConfirm,
    handleDeleteState,
    handleDeleteSelected,
    handleConfirmDelete,
    handleToggleActive,
  } = usePropertyStateListActions({ setRowSelection });

  const rowActions: DataTableRowAction<PropertyState>[] = [
    {
      label: "ویرایش",
      icon: <Edit className="h-4 w-4" />,
      onClick: (state) => {
        open(DRAWER_IDS.REAL_ESTATE_STATE_FORM, {
          editId: state.id,
          onSuccess: () => queryClient.invalidateQueries({ queryKey: ["property-states"] }),
        });
      },
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

  const handleEditState = (id: number) => {
    open(DRAWER_IDS.REAL_ESTATE_STATE_FORM, {
      editId: id,
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["property-states"] }),
    });
  };

  const columns = usePropertyStateColumns(rowActions, handleToggleActive, handleEditState) as ColumnDef<PropertyState>[];

  if (error) {
    showError(getError("serverError"));
    return (
      <div className="space-y-6">
        <PageHeader title="مدیریت نوع معامله ملک" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="مدیریت نوع معامله ملک">
        <ProtectedButton
          permission="real_estate.state.create"
          size="sm"
          onClick={() => {
            open(DRAWER_IDS.REAL_ESTATE_STATE_FORM, {
              onSuccess: () => queryClient.invalidateQueries({ queryKey: ["property-states"] }),
            });
          }}
        >
          <Plus className="h-4 w-4 ml-2" />
          افزودن نوع معامله
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
          state={{ pagination, sorting, rowSelection }}
          searchValue={searchValue}
          pageSizeOptions={[10, 20, 50]}
          deleteConfig={{
            onDeleteSelected: handleDeleteSelected,
            permission: "real_estate.state.delete",
            denyMessage: "اجازه حذف نوع معامله ملک ندارید",
          }}
          filterConfig={stateFilterConfig}
        />
      </Suspense>

      <AlertDialog open={deleteConfirm.open} onOpenChange={(open) => setDeleteConfirm((prev) => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تایید حذف</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirm.isBulk
                ? getConfirm("bulkDelete", { item: "نوع معامله ملک", count: deleteConfirm.stateIds?.length || 0 })
                : getConfirm("delete", { item: "نوع معامله ملک" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>لغو</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-static-w hover:bg-destructive/90">
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
