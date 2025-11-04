"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/tables/DataTable";
import { usePortfolioColumns } from "@/components/portfolios/list/PortfolioTableColumns";
import { usePortfolioFilterOptions, getPortfolioFilterConfig, PortfolioFilters } from "@/components/portfolios/list/PortfolioTableFilters";
import { Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/elements/Button";
import Link from "next/link";
import { toast } from '@/components/elements/Sonner';
import { OnChangeFn, SortingState } from "@tanstack/react-table";
import { TablePaginationState } from '@/types/shared/pagination';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usePermissionProps } from "@/components/auth/PermissionGate";
import { getConfirmMessage } from "@/core/messages/message";
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

import { Portfolio } from "@/types/portfolio/portfolio";
import { ColumnDef } from "@tanstack/react-table";
import { portfolioApi } from "@/api/portfolios/route";
import { DataTableRowAction } from "@/components/tables/DataTableRowActions";
import { PortfolioCategory } from "@/types/portfolio/category/portfolioCategory";

// تابع تبدیل دسته‌بندی‌ها به فرمت سلسله مراتبی
const convertCategoriesToHierarchical = (categories: PortfolioCategory[]): any[] => {
  // ابتدا دسته‌بندی‌های ریشه را پیدا می‌کنیم
  const rootCategories = categories.filter(cat => !cat.parent_id);
  
  // تابع بازگشتی برای ساخت درخت
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
  
  // ساخت درخت برای هر دسته‌بندی ریشه
  return rootCategories.map(buildTree);
};

export default function PortfolioPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { getCRUDProps } = usePermissionProps();
  const portfolioAccess = getCRUDProps('portfolio');
  const { statusFilterOptions, booleanFilterOptions } = usePortfolioFilterOptions();
  
  // استیت برای دسته‌بندی‌ها
  const [categories, setCategories] = useState<PortfolioCategory[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<any[]>([]);
  
  const [pagination, setPagination] = useState<TablePaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState({});
  const [searchValue, setSearchValue] = useState("");
  const [clientFilters, setClientFilters] = useState<PortfolioFilters>({});

  // Confirm dialog states
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    portfolioId?: number;
    portfolioIds?: number[];
    isBulk: boolean;
  }>({
    open: false,
    isBulk: false,
  });

  // دریافت دسته‌بندی‌ها
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await portfolioApi.getCategories({
          page: 1,
          size: 1000, // دریافت همه دسته‌بندی‌ها
          is_active: true,
          is_public: true
        });
        
        setCategories(response.data);
        setCategoryOptions(convertCategoriesToHierarchical(response.data));
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    
    fetchCategories();
  }, []);

  // ساخت کانفیگ فیلترها
  const portfolioFilterConfig = getPortfolioFilterConfig(
    statusFilterOptions, 
    booleanFilterOptions,
    categoryOptions
  );

  // Build query parameters
  const queryParams = {
    search: searchValue,
    page: pagination.pageIndex + 1, // Convert zero-based to one-based indexing
    size: pagination.pageSize,
    order_by: sorting.length > 0 ? sorting[0].id : "created_at",
    order_desc: sorting.length > 0 ? sorting[0].desc : true,
    // Add filter parameters
    status: clientFilters.status as string,
    is_featured: clientFilters.is_featured as boolean | undefined,
    is_public: clientFilters.is_public as boolean | undefined,
    is_active: clientFilters.is_active as boolean | undefined, // اضافه کردن فیلتر فعال بودن
    categories__in: clientFilters.categories ? clientFilters.categories.toString() : undefined, // تبدیل دسته‌بندی به رشته
  };

  // Use React Query for data fetching
  const { data: portfolios, isLoading, error } = useQuery({
    queryKey: ['portfolios', queryParams.search, queryParams.page, queryParams.size, queryParams.order_by, queryParams.order_desc, queryParams.status, queryParams.is_featured, queryParams.is_public, queryParams.is_active, queryParams.categories__in],
    queryFn: async () => {
      const response = await portfolioApi.getPortfolioList(queryParams);
      return response;
    },
    staleTime: 0, // Always fetch fresh data
    retry: 1, // Retry once on failure
  });

  const data: Portfolio[] = portfolios?.data || [];
  const pageCount = portfolios?.pagination?.total_pages || 1;

  const deletePortfolioMutation = useMutation({
    mutationFn: (portfolioId: number) => portfolioApi.deletePortfolio(portfolioId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolios'] });
      toast.success("با موفقیت حذف شد");
    },
    onError: (error) => {
      toast.error("خطای سرور");
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (portfolioIds: number[]) => portfolioApi.bulkDeletePortfolios(portfolioIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolios'] });
      toast.success("با موفقیت حذف شد");
      setRowSelection({});
    },
    onError: (error) => {
      toast.error("خطای سرور");
      console.error("Bulk delete portfolio error:", error);
    },
  });

  // Toggle active status mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: number; is_active: boolean }) => {
      return portfolioApi.partialUpdatePortfolio(id, { is_active });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['portfolios'] });
      toast.success(`نمونه‌کار با موفقیت ${data.is_active ? 'فعال' : 'غیرفعال'} شد`);
    },
    onError: (error) => {
      toast.error("خطا در تغییر وضعیت");
      console.error("Toggle active status error:", error);
    },
  });

  // Handle toggle active status
  const handleToggleActive = (portfolio: Portfolio) => {
    toggleActiveMutation.mutate({
      id: portfolio.id,
      is_active: !portfolio.is_active,
    });
  };

  // تابع حذف نمونه‌کار
  const handleDeletePortfolio = (portfolioId: number | string) => {
    setDeleteConfirm({
      open: true,
      portfolioId: Number(portfolioId),
      isBulk: false,
    });
  };

  // تابع حذف دسته‌جمعی
  const handleDeleteSelected = (selectedIds: (string | number)[]) => {
    setDeleteConfirm({
      open: true,
      portfolioIds: selectedIds.map(id => Number(id)),
      isBulk: true,
    });
  };

  // تابع تایید حذف
  const handleConfirmDelete = async () => {
    try {
      if (deleteConfirm.isBulk && deleteConfirm.portfolioIds) {
        await bulkDeleteMutation.mutateAsync(deleteConfirm.portfolioIds);
      } else if (!deleteConfirm.isBulk && deleteConfirm.portfolioId) {
        await deletePortfolioMutation.mutateAsync(deleteConfirm.portfolioId);
      }
    } catch (error) {
      console.error("Delete error:", error);
    }
    setDeleteConfirm({ open: false, isBulk: false });
  };

  // تعریف ستون‌های جدول
  const rowActions: DataTableRowAction<Portfolio>[] = [
    {
      label: "ویرایش",
      icon: <Edit className="h-4 w-4" />,
      onClick: (portfolio) => router.push(`/portfolios/${portfolio.id}/edit`),
    },
    {
      label: "حذف",
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (portfolio) => handleDeletePortfolio(portfolio.id),
      isDestructive: true,
    },
  ];
  
  const columns = usePortfolioColumns(rowActions, handleToggleActive) as ColumnDef<Portfolio>[];

  const handleExportExcel = async (filters: PortfolioFilters, search: string) => {
    try {
      const exportParams = {
        search: search || undefined,
        order_by: sorting.length > 0 ? sorting[0].id : "created_at",
        order_desc: sorting.length > 0 ? sorting[0].desc : true,
        status: filters.status as string | undefined,
        is_featured: filters.is_featured as boolean | undefined,
        is_public: filters.is_public as boolean | undefined,
        is_active: filters.is_active as boolean | undefined,
        categories__in: filters.categories ? filters.categories.toString() : undefined,
      };
      
      await portfolioApi.exportPortfolios(exportParams, 'excel');
      toast.success("فایل اکسل با موفقیت دانلود شد");
    } catch (error) {
      toast.error("خطا در دانلود فایل اکسل");
      console.error("Export error:", error);
    }
  };

  const handleExportPDF = async (filters: PortfolioFilters, search: string) => {
    try {
      const exportParams = {
        search: search || undefined,
        order_by: sorting.length > 0 ? sorting[0].id : "created_at",
        order_desc: sorting.length > 0 ? sorting[0].desc : true,
        status: filters.status as string | undefined,
        is_featured: filters.is_featured as boolean | undefined,
        is_public: filters.is_public as boolean | undefined,
        is_active: filters.is_active as boolean | undefined,
        categories__in: filters.categories ? filters.categories.toString() : undefined,
      };
      
      await portfolioApi.exportPortfolios(exportParams, 'pdf');
      toast.success("فایل PDF با موفقیت دانلود شد");
    } catch (error) {
      toast.error("خطا در دانلود فایل PDF");
      console.error("Export error:", error);
    }
  };

  const handlePrint = () => {
    // Find the table element
    const tableCard = document.querySelector('[data-table="portfolio-table"]');
    if (!tableCard) {
      window.print();
      return;
    }
    
    // Clone the table structure
    const clonedCard = tableCard.cloneNode(true) as HTMLElement;
    
    // Remove buttons and non-printable elements
    const buttons = clonedCard.querySelectorAll('button, .no-print');
    buttons.forEach(btn => btn.remove());
    
    // Remove search and filters
    const searchInputs = clonedCard.querySelectorAll('input[type="text"], input[type="search"]');
    searchInputs.forEach(input => input.remove());
    
    // Create print window
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl">
        <head>
          <meta charset="utf-8">
          <title>پرینت لیست نمونه‌کارها</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              padding: 20px;
              direction: rtl;
              background: white;
            }
            h1 {
              text-align: center;
              margin-bottom: 20px;
              color: #1f2937;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
              font-size: 12px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: right;
            }
            th {
              background-color: #f3f4f6;
              font-weight: bold;
              color: #111827;
            }
            tr:nth-child(even) {
              background-color: #f9fafb;
            }
            @media print {
              @page {
                margin: 1cm;
                size: A4 landscape;
              }
              body {
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <h1>لیست نمونه‌کارها</h1>
          ${clonedCard.innerHTML}
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
    `);
    printWindow.document.close();
  };

  const handleFilterChange = (filterId: string | number, value: unknown) => {
    const filterKey = filterId as string;
    
    if (filterKey === "search") {
      setSearchValue(typeof value === 'string' ? value : '');
      setPagination(prev => ({ ...prev, pageIndex: 0 }));
      
      // Update URL with search value
      const url = new URL(window.location.href);
      if (value && typeof value === 'string') {
        url.searchParams.set('search', value);
      } else {
        url.searchParams.delete('search');
      }
      url.searchParams.set('page', '1');
      window.history.replaceState({}, '', url.toString());
    } else {
      // Handle other filters
      setClientFilters(prev => ({
        ...prev,
        [filterKey]: value as string | boolean | number | undefined
      }));
      setPagination(prev => ({ ...prev, pageIndex: 0 }));
      
      // Update URL with filter value
      const url = new URL(window.location.href);
      if (value !== undefined && value !== null) {
        // For boolean values, convert to string
        if (typeof value === 'boolean') {
          url.searchParams.set(filterKey, value.toString());
        } else if (filterKey === 'categories' && value !== undefined) {
          // For categories, we need to handle the value correctly
          if (value === 'all' || value === '') {
            url.searchParams.delete('categories');
          } else {
            url.searchParams.set(filterKey, String(value));
          }
        } else {
          url.searchParams.set(filterKey, String(value));
        }
      } else {
        url.searchParams.delete(filterKey);
      }
      url.searchParams.set('page', '1');
      window.history.replaceState({}, '', url.toString());
    }
  };

  // Handle pagination change with URL sync
  const handlePaginationChange: OnChangeFn<TablePaginationState> = (updaterOrValue) => {
    const newPagination = typeof updaterOrValue === 'function' 
      ? updaterOrValue(pagination) 
      : updaterOrValue;
    
    setPagination(newPagination);
    
    // Update URL with pagination
    const url = new URL(window.location.href);
    url.searchParams.set('page', String(newPagination.pageIndex + 1));
    url.searchParams.set('size', String(newPagination.pageSize));
    window.history.replaceState({}, '', url.toString());
  };

  // Handle sorting change with URL sync
  const handleSortingChange: OnChangeFn<SortingState> = (updaterOrValue) => {
    const newSorting = typeof updaterOrValue === 'function' 
      ? updaterOrValue(sorting) 
      : updaterOrValue;
    
    setSorting(newSorting);
    
    // Update URL with sorting
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

  // Load filters from URL on initial load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Load pagination from URL
    if (urlParams.get('page')) {
      const page = parseInt(urlParams.get('page')!, 10);
      if (!isNaN(page) && page > 0) {
        setPagination(prev => ({ ...prev, pageIndex: page - 1 })); // Convert one-based to zero-based indexing
      }
    }
    if (urlParams.get('size')) {
      const size = parseInt(urlParams.get('size')!, 10);
      if (!isNaN(size) && size > 0) {
        setPagination(prev => ({ ...prev, pageSize: size }));
      }
    }
    
    // Load sorting from URL
    if (urlParams.get('order_by') && urlParams.get('order_desc') !== null) {
      const orderBy = urlParams.get('order_by')!;
      const orderDesc = urlParams.get('order_desc') === 'true';
      setSorting([{ id: orderBy, desc: orderDesc }]);
    }
    
    // Load search from URL
    if (urlParams.get('search')) {
      setSearchValue(urlParams.get('search')!);
    }
    
    // Load filters from URL
    const newClientFilters: PortfolioFilters = {};
    if (urlParams.get('status')) {
      newClientFilters.status = urlParams.get('status')!;
    }
    if (urlParams.get('is_featured') !== null) {
      newClientFilters.is_featured = urlParams.get('is_featured') === 'true';
    }
    if (urlParams.get('is_public') !== null) {
      newClientFilters.is_public = urlParams.get('is_public') === 'true';
    }
    if (urlParams.get('is_active') !== null) { // اضافه کردن فیلتر فعال بودن
      newClientFilters.is_active = urlParams.get('is_active') === 'true';
    }
    if (urlParams.get('categories')) {
      // Convert to number if it's a valid number, otherwise keep as string
      const categoriesValue = urlParams.get('categories')!;
      const numValue = parseInt(categoriesValue, 10);
      newClientFilters.categories = isNaN(numValue) ? categoriesValue : numValue;
    }
    
    if (Object.keys(newClientFilters).length > 0) {
      setClientFilters(newClientFilters);
    }
  }, []);

  // Show error state - but keep header visible
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="page-title">مدیریت نمونه‌کارها</h1>
        </div>
        <div className="text-center py-8">
          <p className="text-red-500 mb-4">خطا در بارگذاری داده‌ها</p>
          <p className="text-sm text-gray-500 mb-4">
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
              // Clear any cached data and retry
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">
            مدیریت نمونه‌کارها
          </h1>
        </div>
        <div className="flex items-center">
          <Button size="sm" asChild>
            <Link href="/portfolios/create">
              <Edit className="h-4 w-4 me-2" />
              افزودن نمونه‌کار
            </Link>
          </Button>
        </div>
      </div>

      {/* Content Area */}
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
        }}
        exportConfigs={[
          {
            onExport: handleExportExcel,
            buttonText: "خروجی اکسل",
            variant: "outline",
          },
          {
            onExport: handleExportPDF,
            buttonText: "خروجی PDF",
            variant: "outline",
          },
        ]}
        onPrint={handlePrint}
        filterConfig={portfolioFilterConfig}
      />

      {/* Confirm Delete Dialog */}
      <AlertDialog 
        open={deleteConfirm.open} 
        onOpenChange={(open) => setDeleteConfirm(prev => ({ ...prev, open }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تایید حذف</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirm.isBulk
                ? getConfirmMessage('bulkDeleteAdmins', { count: deleteConfirm.portfolioIds?.length || 0 })
                : getConfirmMessage('deleteAdmin')
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              لغو
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}