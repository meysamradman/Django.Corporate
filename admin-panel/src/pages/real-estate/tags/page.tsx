import { lazy, Suspense, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader/PageHeader";
import { usePropertyTagColumns } from "@/components/real-estate/tags/TagTableColumns";
import { Plus, Edit, Trash2 } from "lucide-react";
import { ProtectedButton } from "@/core/permissions";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { showError } from "@/core/toast";
import { realEstateApi } from "@/api/real-estate";
import type { PropertyTag } from "@/types/real_estate/tags/realEstateTag";
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
import { usePropertyTagListTableState } from "@/components/real-estate/hooks/usePropertyTagListTableState";
import { usePropertyTagListActions } from "@/components/real-estate/hooks/usePropertyTagListActions";

const DataTable = lazy(() => import("@/components/tables/DataTable").then((mod) => ({ default: mod.DataTable })));

export default function PropertyTagsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const open = useGlobalDrawerStore((state) => state.open);

  useEffect(() => {
    if (searchParams.get("action") === "create") {
      open(DRAWER_IDS.REAL_ESTATE_TAG_FORM, {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["property-tags"] }),
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
    tagFilterConfig,
    handlePaginationChange,
    handleSortingChange,
  } = usePropertyTagListTableState();

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
    queryKey: ["property-tags", queryParams.search, queryParams.page, queryParams.size, queryParams.order_by, queryParams.order_desc, queryParams.is_active, queryParams.is_public, queryParams.date_from, queryParams.date_to],
    queryFn: async () => {
      const response = await realEstateApi.getTags(queryParams);
      return response;
    },
    staleTime: 0,
    retry: 1,
  });

  const dataList: PropertyTag[] = data?.data || [];
  const pageCount = data?.pagination?.total_pages || 1;

  const {
    deleteConfirm,
    setDeleteConfirm,
    handleDeleteTag,
    handleDeleteSelected,
    handleConfirmDelete,
    handleToggleActive,
  } = usePropertyTagListActions({ setRowSelection });

  const rowActions: DataTableRowAction<PropertyTag>[] = [
    {
      label: "ویرایش",
      icon: <Edit className="h-4 w-4" />,
      onClick: (tag) => {
        open(DRAWER_IDS.REAL_ESTATE_TAG_FORM, {
          editId: tag.id,
          onSuccess: () => queryClient.invalidateQueries({ queryKey: ["property-tags"] }),
        });
      },
      permission: "real_estate.tag.update",
    },
    {
      label: "حذف",
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (tag) => handleDeleteTag(tag.id),
      isDestructive: true,
      permission: "real_estate.tag.delete",
    },
  ];

  const columns = usePropertyTagColumns(rowActions, handleToggleActive) as ColumnDef<PropertyTag>[];

  if (error) {
    showError("خطا در بارگذاری داده‌ها");
    return (
      <div className="space-y-6">
        <PageHeader title="مدیریت تگ‌های ملک" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="مدیریت تگ‌های ملک">
        <ProtectedButton
          permission="real_estate.tag.create"
          size="sm"
          onClick={() => {
            open(DRAWER_IDS.REAL_ESTATE_TAG_FORM, {
              onSuccess: () => queryClient.invalidateQueries({ queryKey: ["property-tags"] }),
            });
          }}
        >
          <Plus className="h-4 w-4 ml-2" />
          افزودن تگ
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
            permission: "real_estate.tag.delete",
            denyMessage: "اجازه حذف تگ ملک ندارید",
          }}
          filterConfig={tagFilterConfig}
        />
      </Suspense>

      <AlertDialog open={deleteConfirm.open} onOpenChange={(open) => setDeleteConfirm((prev) => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تایید حذف</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirm.isBulk
                ? getConfirm("bulkDelete", { item: "تگ ملک", count: deleteConfirm.tagIds?.length || 0 })
                : getConfirm("delete", { item: "تگ ملک" })}
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
