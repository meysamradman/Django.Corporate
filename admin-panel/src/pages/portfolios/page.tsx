import { useState, useEffect, lazy, Suspense } from "react";
import { useTableFilters } from "@/components/tables/utils/useTableFilters";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader/PageHeader";
import { usePortfolioColumns } from "@/components/portfolios/list/PortfolioTableColumns";
import { usePortfolioFilterOptions, getPortfolioFilterConfig } from "@/components/portfolios/list/PortfolioTableFilters";
import type { PortfolioFilters } from "@/types/portfolio/portfolioListParams";
import { Edit, Trash2, Plus } from "lucide-react";
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
import { exportPortfolios } from "@/api/portfolios/export";
import type { DataTableRowAction } from "@/types/shared/table";
import type { PortfolioCategory } from "@/types/portfolio/category/portfolioCategory";
import { env } from '@/core/config/environment';

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
      // ✅ از msg.crud استفاده کنید
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
      // ✅ از msg.crud استفاده کنید
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
  ];

  const columns = usePortfolioColumns(rowActions, handleToggleActive) as ColumnDef<Portfolio>[];

  const handleExportExcel = async (filters: PortfolioFilters, search: string, exportAll: boolean = false) => {
    try {
      const exportParams: any = {
        search: search || undefined,
        order_by: sorting.length > 0 ? sorting[0].id : "created_at",
        order_desc: sorting.length > 0 ? sorting[0].desc : true,
        status: filters.status as string | undefined,
        is_featured: filters.is_featured as boolean | undefined,
        is_public: filters.is_public as boolean | undefined,
        is_active: filters.is_active as boolean | undefined,
        categories__in: filters.categories ? filters.categories.toString() : undefined,
      };

      if (exportAll) {
        exportParams.export_all = true;
      } else {
        exportParams.page = pagination.pageIndex + 1;
        exportParams.size = pagination.pageSize;
      }

      await exportPortfolios(exportParams, 'excel');
      showSuccess(exportAll ? "فایل اکسل (همه آیتم‌ها) با موفقیت دانلود شد" : "فایل اکسل (صفحه فعلی) با موفقیت دانلود شد");
    } catch (error: any) {
      const errorMessage = error?.response?.message || error?.message || "خطا در دانلود فایل اکسل";
      showError(errorMessage);
    }
  };

  const handleExportPDF = async (filters: PortfolioFilters, search: string, exportAll: boolean = false) => {
    try {
      const exportParams: any = {
        search: search || undefined,
        order_by: sorting.length > 0 ? sorting[0].id : "created_at",
        order_desc: sorting.length > 0 ? sorting[0].desc : true,
        status: filters.status as string | undefined,
        is_featured: filters.is_featured as boolean | undefined,
        is_public: filters.is_public as boolean | undefined,
        is_active: filters.is_active as boolean | undefined,
        categories__in: filters.categories ? filters.categories.toString() : undefined,
      };

      if (exportAll) {
        exportParams.export_all = true;
      } else {
        exportParams.page = pagination.pageIndex + 1;
        exportParams.size = pagination.pageSize;
      }

      await exportPortfolios(exportParams, 'pdf');
      showSuccess(exportAll ? "فایل PDF (همه آیتم‌ها) با موفقیت دانلود شد" : "فایل PDF (صفحه فعلی) با موفقیت دانلود شد");
    } catch (error: any) {
      const errorMessage = error?.response?.message || error?.message || "خطا در دانلود فایل PDF";
      showError(errorMessage);
    }
  };

  const handlePrint = async (printAll: boolean = false) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showError("لطفاً popup blocker را غیرفعال کنید");
      return;
    }

    let printData = data;
    const MAX_PRINT_ITEMS = env.PORTFOLIO_EXPORT_PRINT_MAX_ITEMS;
    if (printAll) {
      try {
        const allParams = {
          search: searchValue || undefined,
          page: 1,
          size: MAX_PRINT_ITEMS,
          order_by: sorting.length > 0 ? sorting[0].id : "created_at",
          order_desc: sorting.length > 0 ? sorting[0].desc : true,
          status: clientFilters.status as string | undefined,
          is_featured: clientFilters.is_featured as boolean | undefined,
          is_public: clientFilters.is_public as boolean | undefined,
          is_active: clientFilters.is_active as boolean | undefined,
          categories__in: clientFilters.categories ? clientFilters.categories.toString() : undefined,
        };
        const response = await portfolioApi.getPortfolioList(allParams);
        printData = response.data;
        const totalCount = response.pagination?.count || 0;
        if (totalCount > MAX_PRINT_ITEMS) {
          showWarning(`فقط ${MAX_PRINT_ITEMS} آیتم اول از ${totalCount} آیتم پرینت شد. لطفاً فیلترهای بیشتری اعمال کنید.`);
        }
      } catch (error: any) {
        const errorMessage = error?.response?.message || error?.message || "خطا در دریافت داده‌ها برای پرینت";
        showError(errorMessage);
        printWindow.close();
        return;
      }
    }

    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      const year = date.getFullYear() - 621;
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
    };

    const getStatusText = (status: string) => {
      if (status === 'published') return 'منتشر شده';
      if (status === 'draft') return 'پیش‌نویس';
      if (status === 'archived') return 'بایگانی شده';
      return status;
    };

    const tableRows = printData.map((portfolio) => {
      const categories = portfolio.categories?.map(c => c.name).join(', ') || '-';
      const tags = portfolio.tags?.map(t => t.name).join(', ') || '-';
      const options = portfolio.options?.map(o => o.name + (o.description ? ` (${o.description})` : '')).join(', ') || '-';
      const statusText = getStatusText(portfolio.status);
      const createdDate = portfolio.created_at ? formatDate(portfolio.created_at) : '-';

      return `
        <tr>
          <td style="text-align: right; padding: 8px; border-bottom: 0.5px solid #e2e8f0;">${statusText}</td>
          <td style="text-align: right; padding: 8px; border-bottom: 0.5px solid #e2e8f0;">${createdDate}</td>
          <td style="text-align: right; padding: 8px; border-bottom: 0.5px solid #e2e8f0;">${options}</td>
          <td style="text-align: right; padding: 8px; border-bottom: 0.5px solid #e2e8f0;">${tags}</td>
          <td style="text-align: right; padding: 8px; border-bottom: 0.5px solid #e2e8f0;">${categories}</td>
          <td style="text-align: center; padding: 8px; border-bottom: 0.5px solid #e2e8f0;">${portfolio.is_active ? 'بله' : 'خیر'}</td>
          <td style="text-align: center; padding: 8px; border-bottom: 0.5px solid #e2e8f0;">${portfolio.is_public ? 'بله' : 'خیر'}</td>
          <td style="text-align: center; padding: 8px; border-bottom: 0.5px solid #e2e8f0;">${portfolio.is_featured ? 'بله' : 'خیر'}</td>
          <td style="text-align: center; padding: 8px; border-bottom: 0.5px solid #e2e8f0;">${portfolio.id}</td>
          <td style="text-align: right; padding: 8px; border-bottom: 0.5px solid #e2e8f0;">${portfolio.title || '-'}</td>
        </tr>
      `;
    }).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl">
        <head>
          <meta charset="utf-8">
          <title>پرینت لیست نمونه‌کارها ${printAll ? '(همه)' : '(صفحه فعلی)'}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              direction: rtl;
              background: white;
              padding: 20px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
              font-size: 10px;
            }
            th {
              background-color: #f8fafc;
              color: #0f172a;
              font-weight: bold;
              padding: 8px;
              text-align: right;
              border-bottom: 1px solid #e2e8f0;
              font-size: 11px;
            }
            td {
              padding: 8px;
              color: #0f172a;
              border-bottom: 0.5px solid #e2e8f0;
              word-wrap: break-word;
            }
            tr:nth-child(even) {
              background-color: #f8fafc;
            }
            tr:nth-child(odd) {
              background-color: white;
            }
            @media print {
              @page {
                size: A4 landscape;
                margin: 1cm;
              }
              body {
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <table>
            <thead>
              <tr>
                <th>وضعیت</th>
                <th>تاریخ ایجاد</th>
                <th>گزینه‌ها</th>
                <th>تگ‌ها</th>
                <th>دسته‌بندی‌ها</th>
                <th>فعال</th>
                <th>عمومی</th>
                <th>ویژه</th>
                <th>ID</th>
                <th>عنوان</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() {
                window.close();
              }, 100);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
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
              onExport: (filters, search) => handleExportExcel(filters as PortfolioFilters, search, false),
              buttonText: "خروجی اکسل (صفحه فعلی)",
              value: "excel",
              variant: "outline",
            },
            {
              onExport: (filters, search) => handleExportExcel(filters as PortfolioFilters, search, true),
              buttonText: "خروجی اکسل (همه)",
              value: "excel_all",
              variant: "outline",
            },
            {
              onExport: (filters, search) => handleExportPDF(filters as PortfolioFilters, search, false),
              buttonText: "خروجی PDF (صفحه فعلی)",
              value: "pdf",
              variant: "outline",
            },
            {
              onExport: (filters, search) => handleExportPDF(filters as PortfolioFilters, search, true),
              buttonText: "خروجی PDF (همه)",
              value: "pdf_all",
              variant: "outline",
            },
            {
              onExport: async () => {
                await handlePrint(true);
              },
              buttonText: "پرینت (همه)",
              value: "print_all",
              variant: "outline",
            },
          ]}
          onPrint={() => handlePrint(false)}
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