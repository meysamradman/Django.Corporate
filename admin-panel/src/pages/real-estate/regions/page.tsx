import { lazy, Suspense, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader/PageHeader";
import { realEstateApi } from "@/api/real-estate";
import { Input } from "@/components/elements/Input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/elements/Select";
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
import { useRegionColumns } from "@/components/real-estate/locations/regions/RegionTableColumns";
import { getRegionFilterConfig } from "@/components/real-estate/locations/regions/RegionTableFilters";
import type { RealEstateCity, RealEstateCityRegion } from "@/types/real_estate/location";

const DataTable = lazy(() => import("@/components/tables/DataTable").then((mod) => ({ default: mod.DataTable })));

export default function RealEstateRegionsPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; isBulk: boolean; id?: number; ids?: number[] }>({ open: false, isBulk: false });
  const [form, setForm] = useState({ name: "", code: "", city_id: "" });
  const queryClient = useQueryClient();

  const [pagination, setPagination] = useState<TablePaginationState>({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = useState<SortingState>(() => initSortingFromURL());
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [searchValue, setSearchValue] = useState("");
  const [clientFilters, setClientFilters] = useState<Record<string, unknown>>({});

  const { handleFilterChange } = useTableFilters(setClientFilters, setSearchValue, setPagination);

  const { data: cities = [] } = useQuery({
    queryKey: ["real-estate-cities-for-regions"],
    queryFn: () => realEstateApi.getCities(),
    staleTime: 60_000,
  });

  const queryParams = {
    search: searchValue,
    page: pagination.pageIndex + 1,
    size: pagination.pageSize,
    order_by: sorting.length > 0 ? sorting[0].id : "created_at",
    order_desc: sorting.length > 0 ? sorting[0].desc : true,
    city_id: clientFilters.city_id ? Number(clientFilters.city_id) : undefined,
    date_from: clientFilters.date_from as string | undefined,
    date_to: clientFilters.date_to as string | undefined,
  };

  const { data: regionsResponse, isLoading } = useQuery({
    queryKey: [
      "real-estate-regions-list",
      queryParams.search,
      queryParams.page,
      queryParams.size,
      queryParams.order_by,
      queryParams.order_desc,
      queryParams.city_id,
      queryParams.date_from,
      queryParams.date_to,
    ],
    queryFn: () => realEstateApi.getCityRegionsList(queryParams),
    staleTime: 60_000,
  });
  const regions = regionsResponse?.data || [];
  const pageCount = regionsResponse?.pagination?.total_pages || 1;

  const createMutation = useMutation({
    mutationFn: () => realEstateApi.createRegion({
      name: form.name.trim(),
      code: Number(form.code),
      city_id: Number(form.city_id),
    }),
    onSuccess: () => {
      showSuccess("منطقه با موفقیت ایجاد شد");
      setCreateOpen(false);
      setForm({ name: "", code: "", city_id: "" });
      queryClient.invalidateQueries({ queryKey: ["real-estate-regions-list"] });
      queryClient.invalidateQueries({ queryKey: ["real-estate-regions"] });
    },
    onError: (error) => showError(error),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => realEstateApi.deleteRegion(id),
    onSuccess: () => {
      showSuccess("منطقه با موفقیت حذف شد");
      setDeleteConfirm({ open: false, isBulk: false });
      setRowSelection({});
      queryClient.invalidateQueries({ queryKey: ["real-estate-regions-list"] });
      queryClient.invalidateQueries({ queryKey: ["real-estate-regions"] });
    },
    onError: (error) => showError(error),
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: number[]) => Promise.all(ids.map((id) => realEstateApi.deleteRegion(id))),
    onSuccess: () => {
      showSuccess("مناطق با موفقیت حذف شدند");
      setDeleteConfirm({ open: false, isBulk: false });
      setRowSelection({});
      queryClient.invalidateQueries({ queryKey: ["real-estate-regions-list"] });
      queryClient.invalidateQueries({ queryKey: ["real-estate-regions"] });
    },
    onError: (error) => showError(error),
  });

  const handleCreate = () => {
    if (!form.name.trim() || !form.code.trim() || !form.city_id) {
      showError("نام، کد و شهر منطقه الزامی است");
      return;
    }
    if (Number.isNaN(Number(form.code))) {
      showError("کد منطقه باید عدد باشد");
      return;
    }
    createMutation.mutate();
  };

  const rowActions: DataTableRowAction<RealEstateCityRegion>[] = [
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

  const columns = useRegionColumns(rowActions) as ColumnDef<RealEstateCityRegion>[];
  const cityOptions = cities.map((city) => ({ label: `${city.name} - ${city.province_name}`, value: String(city.id) }));
  const filterConfig = getRegionFilterConfig(cityOptions);

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
      <PageHeader title="لیست مناطق شهری">
        <ProtectedButton
          permission="real_estate.property.create"
          size="sm"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="ml-2 size-4" />
          افزودن منطقه
        </ProtectedButton>
      </PageHeader>

      <Suspense fallback={null}>
        <DataTable
          columns={columns as any}
          data={regions}
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
            denyMessage: "اجازه حذف منطقه ندارید",
          }}
          filterConfig={filterConfig}
        />
      </Suspense>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>ایجاد منطقه</DialogTitle>
            <DialogDescription>نام، کد و شهر منطقه را وارد کنید.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="نام منطقه"
            />
            <Input
              value={form.code}
              onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
              placeholder="کد منطقه (عدد)"
            />
            <Select value={form.city_id} onValueChange={(value) => setForm((prev) => ({ ...prev, city_id: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="انتخاب شهر" />
              </SelectTrigger>
              <SelectContent>
                {cities.map((city: RealEstateCity) => (
                  <SelectItem key={city.id} value={String(city.id)}>
                    {city.name} - {city.province_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>انصراف</Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>ثبت</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteConfirm.open} onOpenChange={(open) => !open && setDeleteConfirm({ open: false, isBulk: false })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف منطقه</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirm.isBulk
                ? `آیا از حذف ${deleteConfirm.ids?.length || 0} منطقه مطمئن هستید؟`
                : "آیا از حذف این منطقه مطمئن هستید؟"}
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
