import { lazy, Suspense, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader/PageHeader";
import { usePropertyTypeColumns } from "@/components/real-estate/types/TypeTableColumns";
import { Plus, Edit, Trash2 } from "lucide-react";
import { ProtectedButton } from "@/core/permissions";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { showError } from "@/core/toast";
import { realEstateApi } from "@/api/real-estate";
import type { PropertyType } from "@/types/real_estate/type/propertyType";
import type { ColumnDef } from "@tanstack/react-table";
import { getConfirm } from "@/core/messages";
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
import { usePropertyTypeListTableState } from "@/components/real-estate/hooks/usePropertyTypeListTableState";
import { usePropertyTypeListActions } from "@/components/real-estate/hooks/usePropertyTypeListActions";

const DataTable = lazy(() => import("@/components/tables/DataTable").then((mod) => ({ default: mod.DataTable })));

export default function PropertyTypesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const open = useGlobalDrawerStore((state) => state.open);

  useEffect(() => {
    if (searchParams.get("action") === "create") {
      open(DRAWER_IDS.REAL_ESTATE_TYPE_FORM, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["property-types"] });
          queryClient.invalidateQueries({ queryKey: ["property-types-tree"] });
        },
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
    typeFilterConfig,
    handlePaginationChange,
    handleSortingChange,
  } = usePropertyTypeListTableState();

  const queryParams = {
    search: searchValue,
    page: pagination.pageIndex + 1,
    size: pagination.pageSize,
    order_by: sorting.length > 0 ? sorting[0].id : "created_at",
    order_desc: sorting.length > 0 ? sorting[0].desc : true,
    is_active: clientFilters.is_active as boolean | undefined,
    is_public: clientFilters.is_public as boolean | undefined,
    date_from: clientFilters.date_from as string | undefined,
    date_to: clientFilters.date_to as string | undefined,
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ["property-types", queryParams.search, queryParams.page, queryParams.size, queryParams.order_by, queryParams.order_desc, queryParams.is_active, queryParams.is_public, queryParams.date_from, queryParams.date_to],
    queryFn: async () => {
      const response = await realEstateApi.getTypes(queryParams);
      return response;
    },
    staleTime: 0,
    retry: 1,
  });

  const dataList: PropertyType[] = data?.data || [];
  const pageCount = data?.pagination?.total_pages || 1;

  const {
    deleteConfirm,
    setDeleteConfirm,
    handleDeleteType,
    handleDeleteSelected,
    handleConfirmDelete,
    handleToggleActive,
  } = usePropertyTypeListActions({ setRowSelection });

  const rowActions: DataTableRowAction<PropertyType>[] = [
    {
      label: "ویرایش",
      icon: <Edit className="h-4 w-4" />,
      onClick: (type) => {
        open(DRAWER_IDS.REAL_ESTATE_TYPE_FORM, {
          editId: type.id,
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["property-types"] });
            queryClient.invalidateQueries({ queryKey: ["property-types-tree"] });
          },
        });
      },
      permission: "real_estate.type.update",
    },
    {
      label: "حذف",
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (type) => handleDeleteType(type.id),
      isDestructive: true,
      permission: "real_estate.type.delete",
    },
  ];

  const handleEditType = (id: number) => {
    open(DRAWER_IDS.REAL_ESTATE_TYPE_FORM, {
      editId: id,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["property-types"] });
        queryClient.invalidateQueries({ queryKey: ["property-types-tree"] });
      },
    });
  };

  const columns = usePropertyTypeColumns(rowActions, handleToggleActive, handleEditType) as ColumnDef<PropertyType>[];

  if (error) {
    showError("خطا در بارگذاری داده‌ها");
    return (
      <div className="space-y-6">
        <PageHeader title="مدیریت نوع‌های ملک" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="مدیریت نوع‌های ملک">
        <ProtectedButton
          permission="real_estate.type.create"
          size="sm"
          onClick={() => {
            open(DRAWER_IDS.REAL_ESTATE_TYPE_FORM, {
              onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ["property-types"] });
                queryClient.invalidateQueries({ queryKey: ["property-types-tree"] });
              },
            });
          }}
        >
          <Plus className="h-4 w-4 ml-2" />
          افزودن نوع
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
            permission: "real_estate.type.delete",
            denyMessage: "اجازه حذف نوع ملک ندارید",
          }}
          filterConfig={typeFilterConfig}
        />
      </Suspense>

      <AlertDialog open={deleteConfirm.open} onOpenChange={(open) => setDeleteConfirm((prev) => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تایید حذف</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirm.isBulk
                ? getConfirm("bulkDelete", { item: "نوع ملک", count: deleteConfirm.typeIds?.length || 0 })
                : getConfirm("delete", { item: "نوع ملک" })}
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
