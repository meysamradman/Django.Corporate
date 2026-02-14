import { lazy, Suspense, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader/PageHeader";
import { usePropertyColumns } from "@/components/real-estate/properties/list/RealEstateTableColumns";
import type { PropertyFilters } from "@/types/real_estate/realEstateListParams";
import { Edit, Trash2, Plus, Eye, FileText, BadgeCheck } from "lucide-react";
import { Button } from "@/components/elements/Button";
import { ProtectedButton } from "@/core/permissions";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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

import type { Property } from "@/types/real_estate/realEstate";
import type { ColumnDef } from "@tanstack/react-table";
import { realEstateApi } from "@/api/real-estate";
import type { DataTableRowAction } from "@/types/shared/table";
import { usePropertyListTableState } from "@/components/real-estate/hooks/usePropertyListTableState";
import { usePropertyListActions } from "@/components/real-estate/hooks/usePropertyListActions";
import { FinalizeDealDialog } from "@/components/real-estate/properties/view/actions/FinalizeDealDialog";

const DataTable = lazy(() => import("@/components/tables/DataTable").then((mod) => ({ default: mod.DataTable })));

export default function PropertyPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [finalizeProperty, setFinalizeProperty] = useState<Property | null>(null);

  const {
    pagination,
    sorting,
    rowSelection,
    setRowSelection,
    searchValue,
    clientFilters,
    handleFilterChange,
    propertyFilterConfig,
    handlePaginationChange,
    handleSortingChange,
  } = usePropertyListTableState({ navigate });

  const queryParams = {
    search: searchValue,
    page: pagination.pageIndex + 1,
    size: pagination.pageSize,
    order_by: sorting.length > 0 ? sorting[0].id : "created_at",
    order_desc: sorting.length > 0 ? sorting[0].desc : true,
    is_published: clientFilters.is_published as boolean | undefined,
    is_featured: clientFilters.is_featured as boolean | undefined,
    is_active: clientFilters.is_active as boolean | undefined,
    property_type: clientFilters.property_type,
    state: clientFilters.state,
    status: clientFilters.status as string | undefined,
    city: clientFilters.city,
    date_from: clientFilters.date_from,
    date_to: clientFilters.date_to,
  };

  const { data: properties, isLoading, error } = useQuery({
    queryKey: [
      "properties",
      queryParams.search,
      queryParams.page,
      queryParams.size,
      queryParams.order_by,
      queryParams.order_desc,
      queryParams.is_published,
      queryParams.is_featured,
      queryParams.is_active,
      queryParams.property_type,
      queryParams.state,
      queryParams.status,
      queryParams.city,
      queryParams.date_from,
      queryParams.date_to,
    ],
    queryFn: async () => {
      const response = await realEstateApi.getPropertyList(queryParams);
      return response;
    },
    staleTime: 0,
    retry: 1,
  });

  const data: Property[] = properties?.data || [];
  const pageCount = properties?.pagination?.total_pages || 1;

  const {
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
  } = usePropertyListActions({
    data,
    totalCount: properties?.pagination?.count || 0,
    pagination,
    sorting,
    rowSelection,
    setRowSelection,
    queryParams,
  });

  const rowActions: DataTableRowAction<Property>[] = [
    {
      label: "مشاهده",
      icon: <Eye className="h-4 w-4" />,
      onClick: (property) => navigate(`/real-estate/properties/${property.id}/view`),
      permission: "real_estate.property.read",
    },
    {
      label: "ویرایش",
      icon: <Edit className="h-4 w-4" />,
      onClick: (property) => navigate(`/real-estate/properties/${property.id}/edit`),
      permission: "real_estate.property.update",
    },
    {
      label: "نهایی‌سازی معامله",
      icon: <BadgeCheck className="h-4 w-4" />,
      onClick: (property) => setFinalizeProperty(property),
      isDisabled: (property) => property.status === "sold" || property.status === "rented",
      permission: "real_estate.property.update",
    },
    {
      label: "حذف",
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (property) => handleDeleteProperty(property.id),
      isDestructive: true,
      permission: "real_estate.property.delete",
    },
    {
      label: "خروجی PDF",
      icon: <FileText className="h-4 w-4" />,
      onClick: (property) => exportSinglePropertyPdf(property.id),
      permission: "real_estate.property.read",
    },
  ];

  const columns = usePropertyColumns(rowActions, handleToggleActive) as ColumnDef<Property>[];

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="مدیریت املاک" />
        <div className="text-center py-8">
          <p className="text-red-1 mb-4">خطا در بارگذاری داده‌ها</p>
          <p className="text-sm text-font-s mb-4">
            سرور با خطای 500 پاسخ داده است. لطفاً با مدیر سیستم تماس بگیرید.
          </p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            تلاش مجدد
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ["properties"] });
              window.location.reload();
            }}
            className="mt-4 mr-2"
          >
            پاک کردن کش و تلاش مجدد
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="مدیریت املاک">
        <ProtectedButton
          permission="real_estate.property.create"
          size="sm"
          onClick={() => navigate("/real-estate/properties/create")}
        >
          <Plus className="h-4 w-4" />
          افزودن ملک
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
          state={{
            pagination,
            sorting,
            rowSelection,
          }}
          searchValue={searchValue}
          pageSizeOptions={[10, 20, 50]}
          deleteConfig={{
            onDeleteSelected: handleDeleteSelected,
            permission: "real_estate.property.delete",
            denyMessage: "اجازه حذف ملک ندارید",
          }}
          exportConfigs={[
            {
              onExport: (filters, search) => handleExcelExport(filters as PropertyFilters, search, false),
              buttonText: `خروجی اکسل (صفحه فعلی)${isExcelLoading ? "..." : ""}`,
              value: "excel",
            },
            {
              onExport: (filters, search) => handleExcelExport(filters as PropertyFilters, search, true),
              buttonText: "خروجی اکسل (همه)",
              value: "excel_all",
            },
            {
              onExport: (filters, search) => handlePdfExport(filters as PropertyFilters, search, false),
              buttonText: `خروجی PDF (صفحه فعلی)${isPdfLoading ? "..." : ""}`,
              value: "pdf",
            },
            {
              onExport: (filters, search) => handlePdfExport(filters as PropertyFilters, search, true),
              buttonText: "خروجی PDF (همه)",
              value: "pdf_all",
            },
            {
              onExport: () => handlePrintAction(false),
              buttonText: "خروجی پرینت (صفحه فعلی)",
              value: "print",
            },
            {
              onExport: () => handlePrintAction(true),
              buttonText: "خروجی پرینت (همه)",
              value: "print_all",
            },
          ]}
          filterConfig={propertyFilterConfig}
          filterVariant="sidebar"
        />
      </Suspense>

      <AlertDialog open={deleteConfirm.open} onOpenChange={(open) => setDeleteConfirm((prev) => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تایید حذف</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirm.isBulk
                ? getConfirm("bulkDelete", { item: "ملک", count: deleteConfirm.propertyIds?.length || 0 })
                : getConfirm("delete", { item: "ملک" })}
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

      {finalizeProperty ? (
        <FinalizeDealDialog
          open={!!finalizeProperty}
          onOpenChange={(open) => {
            if (!open) setFinalizeProperty(null);
          }}
          property={finalizeProperty}
          onSuccess={async () => {
            setFinalizeProperty(null);
            await queryClient.invalidateQueries({ queryKey: ["properties"] });
            await queryClient.invalidateQueries({ queryKey: ["property-statistics"] });
          }}
        />
      ) : null}
    </div>
  );
}
