import { useState, useEffect } from "react";
import { useTableFilters } from "@/components/tables/utils/useTableFilters";
import { useNavigate, Link } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader/PageHeader";
import { DataTable } from "@/components/tables/DataTable";
import { useCategoryColumns } from "@/components/portfolios/categories/list/CategoryTableColumns";
import { useCategoryFilterOptions, getCategoryFilterConfig } from "@/components/portfolios/categories/list/CategoryTableFilters";
import { Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/elements/Button";
import { ProtectedButton } from "@/core/permissions";
import { showError, showSuccess } from '@/core/toast';
import type { OnChangeFn, SortingState } from "@tanstack/react-table";
import type { TablePaginationState } from '@/types/shared/pagination';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { initSortingFromURL } from "@/components/tables/utils/tableSorting";
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

export default function CategoryPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { booleanFilterOptions } = useCategoryFilterOptions();
  const categoryFilterConfig = getCategoryFilterConfig(booleanFilterOptions);

  const [pagination, setPagination] = useState<TablePaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const [sorting, setSorting] = useState<SortingState>(() => initSortingFromURL());
  const [rowSelection, setRowSelection] = useState({});
  const [searchValue, setSearchValue] = useState("");
  const [clientFilters, setClientFilters] = useState<Record<string, unknown>>({
    is_active: undefined,
    is_public: undefined,
    date_from: undefined,
    date_to: undefined,
  });

  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    categoryId?: number;
    categoryIds?: number[];
    isBulk: boolean;
  }>({
    open: false,
    isBulk: false,
  });

  const { handleFilterChange } = useTableFilters<Record<string, unknown>>(
    setClientFilters,
    setSearchValue,
    setPagination
  );

  const queryParams: any = {
    search: searchValue,
    page: pagination.pageIndex + 1,
    size: pagination.pageSize,
    order_by: sorting.length > 0 ? sorting[0].id : "created_at",
    order_desc: sorting.length > 0 ? sorting[0].desc : true,
    is_active: clientFilters.is_active as string || undefined,
    is_public: clientFilters.is_public as string || undefined,
    date_from: clientFilters.date_from as string || undefined,
    date_to: clientFilters.date_to as string || undefined,
  };

  const { data: categories, isLoading, error } = useQuery({
    queryKey: ['portfolio-categories', queryParams.search, queryParams.page, queryParams.size, queryParams.order_by, queryParams.order_desc, queryParams.is_active, queryParams.is_public, queryParams.date_from, queryParams.date_to],
    queryFn: async () => {
      return await portfolioApi.getCategories(queryParams);
    },
    staleTime: 0,
  });

  const data: PortfolioCategory[] = Array.isArray(categories?.data) ? categories.data : [];
  const pageCount = categories?.pagination?.total_pages || 1;

  const deleteCategoryMutation = useMutation({
    mutationFn: (categoryId: number) => {
      return portfolioApi.deleteCategory(categoryId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      showSuccess("با موفقیت حذف شد");
    },
    onError: (_error) => {
      showError("خطای سرور");
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (categoryIds: number[]) => {
      return portfolioApi.bulkDeleteCategories(categoryIds);
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      showSuccess("با موفقیت حذف شد");
      setRowSelection({});
    },
    onError: (_error) => {
      showError("خطای سرور");
    },
  });

  const handleDeleteCategory = (categoryId: number | string) => {
    setDeleteConfirm({
      open: true,
      categoryId: Number(categoryId),
      isBulk: false,
    });
  };

  const handleDeleteSelected = (selectedIds: (string | number)[]) => {
    setDeleteConfirm({
      open: true,
      categoryIds: selectedIds.map(id => Number(id)),
      isBulk: true,
    });
  };

  const handleConfirmDelete = async () => {
    try {
      if (deleteConfirm.isBulk && deleteConfirm.categoryIds) {
        await bulkDeleteMutation.mutateAsync(deleteConfirm.categoryIds);
      } else if (!deleteConfirm.isBulk && deleteConfirm.categoryId) {
        await deleteCategoryMutation.mutateAsync(deleteConfirm.categoryId);
      }
    } catch (error) {
    }
    setDeleteConfirm({ open: false, isBulk: false });
  };

  const rowActions: DataTableRowAction<PortfolioCategory>[] = [
    {
      label: "ویرایش",
      icon: <Edit className="h-4 w-4" />,
      onClick: (category) => navigate(`/portfolios/categories/${category.id}/edit`),
    },
    {
      label: "حذف",
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (category) => handleDeleteCategory(category.id),
      isDestructive: true,
    },
  ];
  
  const columns = useCategoryColumns(rowActions) as ColumnDef<PortfolioCategory>[];

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    
    if (urlParams.get('page')) {
      const page = parseInt(urlParams.get('page')!, 10);
      if (!isNaN(page) && page > 0) {
        setPagination(prev => ({ ...prev, pageIndex: page - 1 }));
      }
    }
    if (urlParams.get('size')) {
      const size = parseInt(urlParams.get('size')!, 10);
      if (!isNaN(size) && size > 0) {
        setPagination(prev => ({ ...prev, pageSize: size }));
      }
    }
    
    if (urlParams.get('order_by') && urlParams.get('order_desc') !== null) {
      const orderBy = urlParams.get('order_by')!;
      const orderDesc = urlParams.get('order_desc') === 'true';
      setSorting([{ id: orderBy, desc: orderDesc }]);
    }
    
    if (urlParams.get('search')) {
      setSearchValue(urlParams.get('search')!);
    }
    
    const newClientFilters: Record<string, unknown> = {};
    if (urlParams.get('is_active') !== null) {
      newClientFilters.is_active = urlParams.get('is_active');
    }
    if (urlParams.get('is_public') !== null) {
      newClientFilters.is_public = urlParams.get('is_public');
    }
    
    if (Object.keys(newClientFilters).length > 0) {
      setClientFilters(newClientFilters);
    }
  }, []);


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
        <PageHeader title="مدیریت دسته‌بندی‌ها" />
        <div className="text-center py-8">
          <p className="text-red-1 mb-4">خطا در بارگذاری داده‌ها</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="mt-4"
          >
            تلاش مجدد
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="مدیریت دسته‌بندی‌ها">
        <ProtectedButton 
          permission="portfolio.create"
          size="sm" 
          asChild
        >
          <Link to="/portfolios/categories/create">
            <Edit className="h-4 w-4" />
            افزودن دسته‌بندی
          </Link>
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

      <AlertDialog 
        open={deleteConfirm.open} 
        onOpenChange={(open) => setDeleteConfirm(prev => ({ ...prev, open }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تایید حذف</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirm.isBulk
                ? `آیا از حذف ${deleteConfirm.categoryIds?.length || 0} دسته‌بندی انتخاب شده مطمئن هستید؟`
                : "آیا از حذف این دسته‌بندی مطمئن هستید؟"
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