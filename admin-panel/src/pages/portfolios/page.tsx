import { useState, useEffect, lazy, Suspense } from "react";
import { useTableFilters } from "@/components/tables/utils/useTableFilters";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader/PageHeader";
import { usePortfolioColumns } from "@/components/portfolios/projects/list/PortfolioTableColumns";
import { usePortfolioFilterOptions, getPortfolioFilterConfig } from "@/components/portfolios/projects/list/PortfolioTableFilters";
import type { PortfolioFilters } from "@/types/portfolio/portfolioListParams";
import { Eye, Edit, Trash2, Plus, FileText } from "lucide-react";
import { Button } from "@/components/elements/Button";
import { ProtectedButton } from "@/core/permissions";
import { showError, showSuccess, showWarning } from '@/core/toast';
import type { OnChangeFn, SortingState } from "@tanstack/react-table";
import type { TablePaginationState } from '@/types/shared/pagination';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { initSortingFromURL } from "@/components/tables/utils/tableSorting";

const DataTable = lazy(() => import("@/components/tables/DataTable").then(mod => ({ default: mod.DataTable })));
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

import type { Portfolio } from "@/types/portfolio/portfolio";
import type { ColumnDef } from "@tanstack/react-table";
import { portfolioApi } from "@/api/portfolios/portfolios";
import type { DataTableRowAction } from "@/types/shared/table";
import type { PortfolioCategory } from "@/types/portfolio/category/portfolioCategory";
import { usePortfolioExcelExport } from "@/components/portfolios/hooks/usePortfolioExcelExport";
import { usePortfolioPdfExport } from "@/components/portfolios/hooks/usePortfolioPdfExport";
import { usePortfolioPrintView } from "@/components/portfolios/hooks/usePortfolioPrintView";

const convertCategoriesToHierarchical = (categories: PortfolioCategory[]): any[] => {
  const rootCategories = categories.filter(cat => !cat.parent_id);

  const buildTree = (category: PortfolioCategory): any => {
    const children = categories.filter(cat => cat.parent_id === category.id);

    return {
      id: category.id,
      label: category.name,
      value: category.id.toString(),
      parent_id: category.parent_id,
      children: children.map(buildTree)
    };
  };

  return rootCategories.map(buildTree);
};

export default function PortfolioPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { statusFilterOptions, booleanFilterOptions } = usePortfolioFilterOptions();

  const [_categories, setCategories] = useState<PortfolioCategory[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<any[]>([]);

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
  const [clientFilters, setClientFilters] = useState<PortfolioFilters>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const filters: PortfolioFilters = {};
      if (urlParams.get('status')) filters.status = urlParams.get('status') as string;
      if (urlParams.get('is_featured')) filters.is_featured = urlParams.get('is_featured') === 'true';
      if (urlParams.get('is_public')) filters.is_public = urlParams.get('is_public') === 'true';
      if (urlParams.get('is_active')) filters.is_active = urlParams.get('is_active') === 'true';
      if (urlParams.get('category')) {
        filters.category = urlParams.get('category') as string;
      }
      const dateFrom = urlParams.get('date_from');
      const dateTo = urlParams.get('date_to');
      if (dateFrom || dateTo) {
        (filters as any).date_range = { from: dateFrom || undefined, to: dateTo || undefined };
        filters.date_from = dateFrom || undefined;
        filters.date_to = dateTo || undefined;
      }
      return filters;
    }
    return {};
  });

  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    portfolioId?: number;
    portfolioIds?: number[];
    isBulk: boolean;
  }>({
    open: false,
    isBulk: false,
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await portfolioApi.getCategories({
          page: 1,
          size: 1000,
          is_active: true,
          is_public: true
        });

        setCategories(response.data);
        setCategoryOptions(convertCategoriesToHierarchical(response.data));
      } catch (error) {
      }
    };

    fetchCategories();
  }, []);

  const { handleFilterChange } = useTableFilters<PortfolioFilters>(
    setClientFilters,
    setSearchValue,
    setPagination,
    {
      categories: (value, updateUrl) => {
        setClientFilters(prev => ({
          ...prev,
          category: value as string | undefined
        }));
        setPagination(prev => ({ ...prev, pageIndex: 0 }));

        const url = new URL(window.location.href);
        if (value && value !== 'all' && value !== '') {
          url.searchParams.set('category', String(value));
        } else {
          url.searchParams.delete('category');
        }
        updateUrl(url);
      }
    }
  );

  const portfolioFilterConfig = getPortfolioFilterConfig(
    statusFilterOptions,
    booleanFilterOptions,
    categoryOptions
  );

  const queryParams = {
    search: searchValue,
    page: pagination.pageIndex + 1,
    size: pagination.pageSize,
    order_by: sorting.length > 0 ? sorting[0].id : "created_at",
    order_desc: sorting.length > 0 ? sorting[0].desc : true,
    status: clientFilters.status as string,
    is_featured: clientFilters.is_featured as boolean | undefined,
    is_public: clientFilters.is_public as boolean | undefined,
    is_active: clientFilters.is_active as boolean | undefined,
    category: clientFilters.category,
    date_from: ((clientFilters as any).date_range?.from || clientFilters['date_from']) as string | undefined,
    date_to: ((clientFilters as any).date_range?.to || clientFilters['date_to']) as string | undefined,
  };

  const { data: portfolios, isLoading, error } = useQuery({
    queryKey: ['portfolios', queryParams.search, queryParams.page, queryParams.size, queryParams.order_by, queryParams.order_desc, queryParams.status, queryParams.is_featured, queryParams.is_public, queryParams.is_active, queryParams.category, queryParams.date_from, queryParams.date_to],
    queryFn: async () => {
      const response = await portfolioApi.getPortfolioList(queryParams);
      return response;
    },
    staleTime: 0,
    retry: 1,
  });

  const data: Portfolio[] = portfolios?.data || [];
  const pageCount = portfolios?.pagination?.total_pages || 1;

  const deletePortfolioMutation = useMutation({
    mutationFn: (portfolioId: number) => portfolioApi.deletePortfolio(portfolioId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolios'] });
      showSuccess(msg.crud('deleted', { item: 'نمونه‌کار' }));
    },
    onError: (_error) => {
      showError('خطای سرور رخ داد');
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (portfolioIds: number[]) => portfolioApi.bulkDeletePortfolios(portfolioIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolios'] });
      showSuccess(msg.crud('deleted', { item: 'نمونه‌کارها' }));
      setRowSelection({});
    },
    onError: (_error) => {
      showError('خطای سرور رخ داد');
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: number; is_active: boolean }) => {
      return portfolioApi.partialUpdatePortfolio(id, { is_active });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['portfolios'] });
      showSuccess(data.is_active ? getStatus('active') : getStatus('inactive'));
    },
    onError: (_error) => {
      showError(getStatus('statusChangeError'));
    },
  });

  const handleToggleActive = (portfolio: Portfolio) => {
    toggleActiveMutation.mutate({
      id: portfolio.id,
      is_active: !portfolio.is_active,
    });
  };

  const handleDeletePortfolio = (portfolioId: number | string) => {
    setDeleteConfirm({
      open: true,
      portfolioId: Number(portfolioId),
      isBulk: false,
    });
  };

  const handleDeleteSelected = (selectedIds: (string | number)[]) => {
    setDeleteConfirm({
      open: true,
      portfolioIds: selectedIds.map(id => Number(id)),
      isBulk: true,
    });
  };

  const handleConfirmDelete = async () => {
    try {
      if (deleteConfirm.isBulk && deleteConfirm.portfolioIds) {
        await bulkDeleteMutation.mutateAsync(deleteConfirm.portfolioIds);
      } else if (!deleteConfirm.isBulk && deleteConfirm.portfolioId) {
        await deletePortfolioMutation.mutateAsync(deleteConfirm.portfolioId);
      }
    } catch (error) {
    }
    setDeleteConfirm({ open: false, isBulk: false });
  };

  const rowActions: DataTableRowAction<Portfolio>[] = [
    {
      label: "مشاهده",
      icon: <Eye className="h-4 w-4" />,
      onClick: (portfolio) => navigate(`/portfolios/${portfolio.id}/view`),
      permission: "portfolio.read",
    },
    {
      label: "ویرایش",
      icon: <Edit className="h-4 w-4" />,
      onClick: (portfolio) => navigate(`/portfolios/${portfolio.id}/edit`),
      permission: "portfolio.update",
    },
    {
      label: "حذف",
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (portfolio) => handleDeletePortfolio(portfolio.id),
      isDestructive: true,
      permission: "portfolio.delete",
    },
    {
      label: "خروجی PDF",
      icon: <FileText className="h-4 w-4" />,
      onClick: (portfolio) => exportSinglePortfolioPdf(portfolio.id),
      permission: "portfolio.read",
    },
  ];

  const columns = usePortfolioColumns(rowActions, handleToggleActive) as ColumnDef<Portfolio>[];

  const { exportExcel, isLoading: isExcelLoading } = usePortfolioExcelExport();
  const { exportPortfolioListPdf, exportSinglePortfolioPdf, isLoading: isPdfLoading } = usePortfolioPdfExport();
  const { openPrintWindow } = usePortfolioPrintView();

  const handleExcelExport = async (filters: PortfolioFilters, search: string, exportAll: boolean = false) => {
    const exportParams: any = {
      search: search || undefined,
      order_by: sorting.length > 0 ? sorting[0].id : "created_at",
      order_desc: sorting.length > 0 ? sorting[0].desc : true,
      status: filters.status,
      is_featured: filters.is_featured,
      is_public: filters.is_public,
      is_active: filters.is_active,
      categories__in: filters.category ? filters.category.toString() : undefined,
    };

    if (exportAll) exportParams.export_all = true;
    else {
      exportParams.page = pagination.pageIndex + 1;
      exportParams.size = pagination.pageSize;
    }

    await exportExcel(data, portfolios?.pagination?.count || 0, exportParams);
  };

  const handlePdfExport = async (filters: PortfolioFilters, search: string, exportAll: boolean = false) => {
    const exportParams: any = {
      search: search || undefined,
      order_by: sorting.length > 0 ? sorting[0].id : "created_at",
      order_desc: sorting.length > 0 ? sorting[0].desc : true,
      status: filters.status,
      is_featured: filters.is_featured,
      is_public: filters.is_public,
      is_active: filters.is_active,
      categories__in: filters.category ? filters.category.toString() : undefined,
    };

    if (exportAll) exportParams.export_all = true;
    else {
      exportParams.page = pagination.pageIndex + 1;
      exportParams.size = pagination.pageSize;
    }

    exportPortfolioListPdf(exportParams);
  };

  const handlePrintAction = async (printAll: boolean = false) => {
    if (!printAll) {
      const selectedIds = Object.keys(rowSelection).filter(key => (rowSelection as any)[key]).map(idx => data[parseInt(idx)].id);
      if (selectedIds.length > 0) {
        openPrintWindow(selectedIds);
      } else {
        openPrintWindow(data.map(p => p.id));
      }
      return;
    }

    try {
      showWarning("در حال آماده‌سازی فایل پرینت برای تمامی موارد...");
      const response = await portfolioApi.getPortfolioList({
        ...queryParams,
        page: 1,
        size: 10000, // Fetch all reasonable amount
      });

      const allIds = response.data.map(p => p.id);
      if (allIds.length > 0) {
        openPrintWindow(allIds);
      } else {
        showError("داده‌ای برای پرینت یافت نشد");
      }
    } catch (error) {
      showError("خطا در بارگذاری داده‌ها برای پرینت");
    }
  };

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
        <PageHeader title="مدیریت نمونه‌کارها" />
        <div className="text-center py-8">
          <p className="text-red-1 mb-4">خطا در بارگذاری داده‌ها</p>
          <p className="text-sm text-font-s mb-4">
            سرور با خطای 500 پاسخ داده است. لطفاً با مدیر سیستم تماس بگیرید.
          </p>
          <Button
            onClick={() => window.location.reload()}
            className="mt-4"
          >
            تلاش مجدد
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ['portfolios'] });
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
      <PageHeader title="مدیریت نمونه‌کارها">
        <ProtectedButton
          permission="portfolio.create"
          size="sm"
          onClick={() => navigate('/portfolios/create')}
        >
          <Plus className="h-4 w-4" />
          افزودن نمونه‌کار
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
            permission: "portfolio.delete",
            denyMessage: "اجازه حذف نمونه‌کار ندارید",
          }}
          exportConfigs={[
            {
              onExport: (filters, search) => handleExcelExport(filters as PortfolioFilters, search, false),
              buttonText: `خروجی اکسل (صفحه فعلی)${isExcelLoading ? '...' : ''}`,
              value: "excel",
            },
            {
              onExport: (filters, search) => handleExcelExport(filters as PortfolioFilters, search, true),
              buttonText: "خروجی اکسل (همه)",
              value: "excel_all",
            },
            {
              onExport: (filters, search) => handlePdfExport(filters as PortfolioFilters, search, false),
              buttonText: `خروجی PDF (صفحه فعلی)${isPdfLoading ? '...' : ''}`,
              value: "pdf",
            },
            {
              onExport: (filters, search) => handlePdfExport(filters as PortfolioFilters, search, true),
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
          filterConfig={portfolioFilterConfig}
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
                ? getConfirm('bulkDelete', { item: 'نمونه‌کار', count: deleteConfirm.portfolioIds?.length || 0 })
                : getConfirm('delete', { item: 'نمونه‌کار' })
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