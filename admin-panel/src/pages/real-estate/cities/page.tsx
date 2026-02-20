import { lazy, Suspense, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader/PageHeader";
import { realEstateApi } from "@/api/real-estate";
import { ProtectedButton } from "@/core/permissions";
import { showError, showSuccess } from "@/core/toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/elements/AlertDialog";
import type { OnChangeFn, SortingState } from "@tanstack/react-table";
import type { TablePaginationState } from "@/types/shared/pagination";
import type { DataTableRowAction } from "@/types/shared/table";
import type { ColumnDef } from "@tanstack/react-table";
import { useTableFilters } from "@/components/tables/utils/useTableFilters";
import { initSortingFromURL } from "@/components/tables/utils/tableSorting";
import { useCityColumns } from "@/components/real-estate/locations/cities/CityTableColumns";
import { getCityFilterConfig } from "@/components/real-estate/locations/cities/CityTableFilters";
import type { RealEstateCity } from "@/types/real_estate/location";
import { useGlobalDrawerStore } from "@/components/shared/drawer/store";
import { DRAWER_IDS } from "@/components/shared/drawer/types";

const DataTable = lazy(() => import("@/components/tables/DataTable").then((mod) => ({ default: mod.DataTable })));

export default function RealEstateCitiesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; isBulk: boolean; id?: number; ids?: number[] }>({ open: false, isBulk: false });
  const queryClient = useQueryClient();
  const open = useGlobalDrawerStore((state) => state.open);

  useEffect(() => {
    if (searchParams.get("action") === "create") {
      open(DRAWER_IDS.REAL_ESTATE_CITY_FORM, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["real-estate-cities-list"] });
          queryClient.invalidateQueries({ queryKey: ["real-estate-cities"] });
          queryClient.invalidateQueries({ queryKey: ["real-estate-cities-for-regions"] });
        },
      });
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("action");
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams, open, queryClient]);

  const [pagination, setPagination] = useState<TablePaginationState>({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = useState<SortingState>(() => initSortingFromURL());
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [searchValue, setSearchValue] = useState("");
  const [clientFilters, setClientFilters] = useState<Record<string, unknown>>({});

  const { handleFilterChange } = useTableFilters(setClientFilters, setSearchValue, setPagination);

  const { data: provinces = [] } = useQuery({
    queryKey: ["real-estate-provinces"],
    queryFn: realEstateApi.getProvinces,
    staleTime: 60_000,
  });

  const booleanFilterOptions = [
    { label: "بله", value: true },
    { label: "خیر", value: false },
  ];

  const isActiveFilter =
    typeof clientFilters.is_active === "boolean"
      ? clientFilters.is_active
      : clientFilters.is_active === "true"
        ? true
        : clientFilters.is_active === "false"
          ? false
          : undefined;

  const queryParams = {
    search: searchValue,
    page: pagination.pageIndex + 1,
    size: pagination.pageSize,
    order_by: sorting.length > 0 ? sorting[0].id : "created_at",
    order_desc: sorting.length > 0 ? sorting[0].desc : true,
    is_active: isActiveFilter,
    province_id: clientFilters.province_id ? Number(clientFilters.province_id) : undefined,
    date_from: clientFilters.date_from as string | undefined,
    date_to: clientFilters.date_to as string | undefined,
  };

  const { data: citiesResponse, isLoading } = useQuery({
    queryKey: [
      "real-estate-cities-list",
      queryParams.search,
      queryParams.page,
      queryParams.size,
      queryParams.order_by,
      queryParams.order_desc,
      queryParams.is_active,
      queryParams.province_id,
      queryParams.date_from,
      queryParams.date_to,
    ],
    queryFn: () => realEstateApi.getCitiesList(queryParams),
    staleTime: 60_000,
  });
  const cities = citiesResponse?.data || [];
  const pageCount = citiesResponse?.pagination?.total_pages || 1;

  const deleteMutation = useMutation({
    mutationFn: (id: number) => realEstateApi.deleteCity(id),
    onSuccess: () => {
      showSuccess("شهر با موفقیت حذف شد");
      setDeleteConfirm({ open: false, isBulk: false });
      setRowSelection({});
      queryClient.invalidateQueries({ queryKey: ["real-estate-cities-list"] });
      queryClient.invalidateQueries({ queryKey: ["real-estate-cities"] });
      queryClient.invalidateQueries({ queryKey: ["real-estate-cities-for-regions"] });
    },
    onError: (error) => showError(error),
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: number[]) => Promise.all(ids.map((id) => realEstateApi.deleteCity(id))),
    onSuccess: () => {
      showSuccess("شهرها با موفقیت حذف شدند");
      setDeleteConfirm({ open: false, isBulk: false });
      setRowSelection({});
      queryClient.invalidateQueries({ queryKey: ["real-estate-cities-list"] });
      queryClient.invalidateQueries({ queryKey: ["real-estate-cities"] });
      queryClient.invalidateQueries({ queryKey: ["real-estate-cities-for-regions"] });
    },
    onError: (error) => showError(error),
  });

  const rowActions: DataTableRowAction<RealEstateCity>[] = [
    {
      label: "ویرایش",
      icon: <Edit className="h-4 w-4" />,
      onClick: (item) => {
        open(DRAWER_IDS.REAL_ESTATE_CITY_FORM, {
          editId: item.id,
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["real-estate-cities-list"] });
            queryClient.invalidateQueries({ queryKey: ["real-estate-cities"] });
            queryClient.invalidateQueries({ queryKey: ["real-estate-cities-for-regions"] });
          },
        });
      },
      permission: "real_estate.property.update",
    },
    {
      label: "حذف",
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (item) => setDeleteConfirm({ open: true, isBulk: false, id: item.id }),
      isDestructive: true,
      permission: "real_estate.property.delete",
    },
  ];

  const columns = useCityColumns(rowActions) as ColumnDef<RealEstateCity>[];
  const provinceOptions = provinces.map((province) => ({ label: province.name, value: String(province.id) }));
  const filterConfig = getCityFilterConfig(booleanFilterOptions, provinceOptions);

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
      <PageHeader title="لیست شهرها">
        <ProtectedButton
          permission="real_estate.property.create"
          size="sm"
          onClick={() => {
            open(DRAWER_IDS.REAL_ESTATE_CITY_FORM, {
              onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ["real-estate-cities-list"] });
                queryClient.invalidateQueries({ queryKey: ["real-estate-cities"] });
                queryClient.invalidateQueries({ queryKey: ["real-estate-cities-for-regions"] });
              },
            });
          }}
        >
          <Plus className="ml-2 size-4" />
          افزودن شهر
        </ProtectedButton>
      </PageHeader>

      <Suspense fallback={null}>
        <DataTable
          columns={columns as any}
          data={cities}
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
            denyMessage: "اجازه حذف شهر ندارید",
          }}
          filterConfig={filterConfig}
        />
      </Suspense>

      <AlertDialog open={deleteConfirm.open} onOpenChange={(open) => !open && setDeleteConfirm({ open: false, isBulk: false })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف شهر</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirm.isBulk
                ? `آیا از حذف ${deleteConfirm.ids?.length || 0} شهر مطمئن هستید؟`
                : "آیا از حذف این شهر مطمئن هستید؟"}
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
