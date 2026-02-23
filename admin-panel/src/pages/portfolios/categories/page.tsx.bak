import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader/PageHeader";
import { DataTable } from "@/components/tables/DataTable";
import { useCategoryColumns } from "@/components/portfolios/categories/list/CategoryTableColumns";
import { Edit, Trash2, FolderPlus } from "lucide-react";
import { Button } from "@/components/elements/Button";
import { ProtectedButton } from "@/core/permissions";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import type { PortfolioCategory } from "@/types/portfolio/category/portfolioCategory";
import type { ColumnDef } from "@tanstack/react-table";
import { portfolioApi } from "@/api/portfolios/portfolios";
import type { DataTableRowAction } from "@/types/shared/table";
import { useGlobalDrawerStore } from "@/components/shared/drawer/store";
import { DRAWER_IDS } from "@/components/shared/drawer/types";
import { usePortfolioCategoryListTableState } from "@/components/portfolios/hooks/usePortfolioCategoryListTableState";
import { usePortfolioCategoryListActions } from "@/components/portfolios/hooks/usePortfolioCategoryListActions";

export default function CategoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const open = useGlobalDrawerStore((state) => state.open);

  useEffect(() => {
    if (searchParams.get("action") === "create") {
      open(DRAWER_IDS.PORTFOLIO_CATEGORY_FORM, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["portfolio-categories"] });
          queryClient.invalidateQueries({ queryKey: ["portfolio-categories-tree"] });
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
    categoryFilterConfig,
    handlePaginationChange,
    handleSortingChange,
  } = usePortfolioCategoryListTableState();

  const queryParams: any = {
    search: searchValue,
    page: pagination.pageIndex + 1,
    size: pagination.pageSize,
    order_by: sorting.length > 0 ? sorting[0].id : "created_at",
    order_desc: sorting.length > 0 ? sorting[0].desc : true,
    is_active: (clientFilters.is_active as string) || undefined,
    is_public: (clientFilters.is_public as string) || undefined,
    date_from: (clientFilters.date_from as string) || undefined,
    date_to: (clientFilters.date_to as string) || undefined,
  };

  const { data: categories, isLoading, error } = useQuery({
    queryKey: [
      "portfolio-categories",
      queryParams.search,
      queryParams.page,
      queryParams.size,
      queryParams.order_by,
      queryParams.order_desc,
      queryParams.is_active,
      queryParams.is_public,
      queryParams.date_from,
      queryParams.date_to,
    ],
    queryFn: async () => {
      return await portfolioApi.getCategories(queryParams);
    },
    staleTime: 0,
  });

  const data: PortfolioCategory[] = Array.isArray(categories?.data) ? categories.data : [];
  const pageCount = categories?.pagination?.total_pages || 1;

  const {
    deleteConfirm,
    setDeleteConfirm,
    handleDeleteCategory,
    handleDeleteSelected,
    handleConfirmDelete,
  } = usePortfolioCategoryListActions({ setRowSelection });

  const handleEdit = (category: PortfolioCategory) => {
    open(DRAWER_IDS.PORTFOLIO_CATEGORY_FORM, {
      editId: category.id,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["portfolio-categories"] });
        queryClient.invalidateQueries({ queryKey: ["portfolio-categories-tree"] });
      },
    });
  };

  const rowActions: DataTableRowAction<PortfolioCategory>[] = [
    {
      label: "ویرایش",
      icon: <Edit className="h-4 w-4" />,
      onClick: (category) => handleEdit(category),
    },
    {
      label: "حذف",
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (category) => handleDeleteCategory(category.id),
      isDestructive: true,
    },
  ];

  const columns = useCategoryColumns(rowActions, (id) =>
    open(DRAWER_IDS.PORTFOLIO_CATEGORY_FORM, {
      editId: id,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["portfolio-categories"] });
        queryClient.invalidateQueries({ queryKey: ["portfolio-categories-tree"] });
      },
    })
  ) as ColumnDef<PortfolioCategory>[];

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="مدیریت دسته‌بندی‌ها" />
        <div className="text-center py-8">
          <p className="text-red-1 mb-4">خطا در بارگذاری داده‌ها</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            تلاش مجدد
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="مدیریت دسته‌بندی‌ها">
        <ProtectedButton permission="portfolio.create" size="sm" asChild>
          <Button
            onClick={() =>
              open(DRAWER_IDS.PORTFOLIO_CATEGORY_FORM, {
                onSuccess: () => {
                  queryClient.invalidateQueries({ queryKey: ["portfolio-categories"] });
                  queryClient.invalidateQueries({ queryKey: ["portfolio-categories-tree"] });
                },
              })
            }
            size="sm"
          >
            <FolderPlus className="h-4 w-4 ml-2" />
            افزودن دسته‌بندی
          </Button>
        </ProtectedButton>
      </PageHeader>

      <DataTable
        columns={columns}
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
          permission: "portfolio.delete",
          denyMessage: "اجازه حذف دسته‌بندی ندارید",
        }}
        filterConfig={categoryFilterConfig}
      />

      <AlertDialog open={deleteConfirm.open} onOpenChange={(open) => setDeleteConfirm((prev) => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تایید حذف</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirm.isBulk
                ? `آیا از حذف ${deleteConfirm.categoryIds?.length || 0} دسته‌بندی انتخاب شده مطمئن هستید؟`
                : "آیا از حذف این دسته‌بندی مطمئن هستید؟"}
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
