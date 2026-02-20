import { lazy, Suspense, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader/PageHeader";
import { realEstateApi } from "@/api/real-estate";
import { Input } from "@/components/elements/Input";
import { Button } from "@/components/elements/Button";
import { ProtectedButton } from "@/core/permissions";
import { showError, showSuccess } from "@/core/toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/elements/Dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/elements/AlertDialog";
import type { OnChangeFn, SortingState } from "@tanstack/react-table";
import type { TablePaginationState } from "@/types/shared/pagination";
import type { DataTableRowAction } from "@/types/shared/table";
import type { ColumnDef } from "@tanstack/react-table";
import { useTableFilters } from "@/components/tables/utils/useTableFilters";
import { initSortingFromURL } from "@/components/tables/utils/tableSorting";
import { useProvinceColumns } from "@/components/real-estate/locations/provinces/ProvinceTableColumns";
import { getProvinceFilterConfig } from "@/components/real-estate/locations/provinces/ProvinceTableFilters";
import type { RealEstateProvince } from "@/types/real_estate/location";

const DataTable = lazy(() => import("@/components/tables/DataTable").then((mod) => ({ default: mod.DataTable })));

export default function RealEstateProvincesPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; isBulk: boolean; id?: number; ids?: number[] }>({
    open: false,
    isBulk: false,
  });
  const [form, setForm] = useState({ name: "", code: "" });
  const queryClient = useQueryClient();

  const [pagination, setPagination] = useState<TablePaginationState>({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = useState<SortingState>(() => initSortingFromURL());
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [searchValue, setSearchValue] = useState("");
  const [clientFilters, setClientFilters] = useState<Record<string, unknown>>({});

  const { handleFilterChange } = useTableFilters(setClientFilters, setSearchValue, setPagination);

  const queryParams = {
    search: searchValue,
    page: pagination.pageIndex + 1,
    size: pagination.pageSize,
    order_by: sorting.length > 0 ? sorting[0].id : "created_at",
    order_desc: sorting.length > 0 ? sorting[0].desc : true,
    date_from: clientFilters.date_from as string | undefined,
    date_to: clientFilters.date_to as string | undefined,
  };

  const { data: provincesResponse, isLoading } = useQuery({
    queryKey: [
      "real-estate-provinces-list",
      queryParams.search,
      queryParams.page,
      queryParams.size,
      queryParams.order_by,
      queryParams.order_desc,
      queryParams.date_from,
      queryParams.date_to,
    ],
    queryFn: () => realEstateApi.getProvincesList(queryParams),
    staleTime: 60_000,
  });
  const data = provincesResponse?.data || [];
  const pageCount = provincesResponse?.pagination?.total_pages || 1;

  const createMutation = useMutation({
    mutationFn: () => realEstateApi.createProvince({
      name: form.name.trim(),
      code: form.code.trim(),
    }),
    onSuccess: () => {
      showSuccess("استان با موفقیت ایجاد شد");
      setCreateOpen(false);
      setForm({ name: "", code: "" });
      queryClient.invalidateQueries({ queryKey: ["real-estate-provinces-list"] });
      queryClient.invalidateQueries({ queryKey: ["real-estate-provinces"] });
    },
    onError: (error) => showError(error),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => realEstateApi.deleteProvince(id),
    onSuccess: () => {
      showSuccess("استان با موفقیت حذف شد");
      setDeleteConfirm({ open: false, isBulk: false });
      setRowSelection({});
      queryClient.invalidateQueries({ queryKey: ["real-estate-provinces-list"] });
      queryClient.invalidateQueries({ queryKey: ["real-estate-provinces"] });
    },
    onError: (error) => showError(error),
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: number[]) => Promise.all(ids.map((id) => realEstateApi.deleteProvince(id))),
    onSuccess: () => {
      showSuccess("استان‌ها با موفقیت حذف شدند");
      setDeleteConfirm({ open: false, isBulk: false });
      setRowSelection({});
      queryClient.invalidateQueries({ queryKey: ["real-estate-provinces-list"] });
      queryClient.invalidateQueries({ queryKey: ["real-estate-provinces"] });
    },
    onError: (error) => showError(error),
  });

  const handleCreate = () => {
    if (!form.name.trim() || !form.code.trim()) {
      showError("نام و کد استان الزامی است");
      return;
    }
    createMutation.mutate();
  };

  const rowActions: DataTableRowAction<RealEstateProvince>[] = [
    {
      label: "ویرایش",
      icon: <Edit className="h-4 w-4" />,
      onClick: () => {},
      permission: "real_estate.property.update",
      isDisabled: () => true,
    },
    {
      label: "حذف",
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (item) => setDeleteConfirm({ open: true, isBulk: false, id: item.id }),
      isDestructive: true,
      permission: "real_estate.property.delete",
    },
  ];

  const columns = useProvinceColumns(rowActions) as ColumnDef<RealEstateProvince>[];
  const filterConfig = getProvinceFilterConfig();

  const handleDeleteSelected = (selectedIds: (string | number)[]) => {
    setDeleteConfirm({ open: true, isBulk: true, ids: selectedIds.map((id) => Number(id)) });
  };

  const handleConfirmDelete = () => {
    if (deleteConfirm.isBulk) {
      if (deleteConfirm.ids?.length) bulkDeleteMutation.mutate(deleteConfirm.ids);
      return;
    }
    if (deleteConfirm.id) deleteMutation.mutate(deleteConfirm.id);
  };

  const handlePaginationChange: OnChangeFn<TablePaginationState> = (updaterOrValue) => {
    const newPagination = typeof updaterOrValue === "function" ? updaterOrValue(pagination) : updaterOrValue;
    setPagination(newPagination);
  };

  const handleSortingChange: OnChangeFn<SortingState> = (updaterOrValue) => {
    const newSorting = typeof updaterOrValue === "function" ? updaterOrValue(sorting) : updaterOrValue;
    setSorting(newSorting);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="لیست استان‌ها">
        <ProtectedButton
          permission="real_estate.property.create"
          size="sm"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="ml-2 size-4" />
          افزودن استان
        </ProtectedButton>
      </PageHeader>

      <Suspense fallback={null}>
        <DataTable
          columns={columns as any}
          data={data}
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
            permission: "real_estate.property.delete",
            denyMessage: "اجازه حذف استان ندارید",
          }}
          filterConfig={filterConfig}
        />
      </Suspense>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>ایجاد استان</DialogTitle>
            <DialogDescription>نام و کد استان را وارد کنید.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="نام استان"
            />
            <Input
              value={form.code}
              onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
              placeholder="کد استان"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>انصراف</Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              ثبت
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteConfirm.open} onOpenChange={(open) => !open && setDeleteConfirm({ open: false, isBulk: false })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف استان</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirm.isBulk
                ? `آیا از حذف ${deleteConfirm.ids?.length || 0} استان مطمئن هستید؟`
                : "آیا از حذف این استان مطمئن هستید؟"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-static-w hover:bg-destructive/90"
              onClick={handleConfirmDelete}
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
