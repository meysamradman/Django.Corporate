import { useState, useEffect, lazy, Suspense } from "react";
import { useTableFilters } from "@/components/tables/utils/useTableFilters";
import { useNavigate } from "react-router-dom";
import { useURLStateSync, parseBooleanParam, parseStringParam, parseDateRange } from "@/hooks/useURLStateSync";
import { PageHeader } from "@/components/layout/PageHeader/PageHeader";
import { useBlogColumns } from "@/components/blogs/posts/list/BlogTableColumns";
import { useBlogFilterOptions, getBlogFilterConfig } from "@/components/blogs/posts/list/BlogTableFilters";
import type { BlogFilters } from "@/types/blog/blogListParams";
import { Eye, Edit, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/elements/Button";
import { ProtectedButton } from "@/core/permissions";
import { showError, showSuccess, showWarning } from '@/core/toast';
import type { OnChangeFn, SortingState } from "@tanstack/react-table";
import type { TablePaginationState } from '@/types/shared/pagination';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { initSortingFromURL } from "@/components/tables/utils/tableSorting";
import { useExcelExport } from "@/components/blogs/hooks/useExcelExport";
import { usePdfExport } from "@/components/blogs/hooks/usePdfExport";
import { usePrintView } from "@/components/blogs/hooks/usePrintView";

const DataTable = lazy(() => import("@/components/tables/DataTable").then(mod => ({ default: mod.DataTable })));
import { msg, getConfirm } from '@/core/messages';
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

import type { Blog } from "@/types/blog/blog";
import type { ColumnDef } from "@tanstack/react-table";
import { blogApi } from "@/api/blogs/blogs";
import type { DataTableRowAction } from "@/types/shared/table";
import type { BlogCategory } from "@/types/blog/category/blogCategory";

const convertCategoriesToHierarchical = (categories: BlogCategory[]): any[] => {
  const rootCategories = categories.filter(cat => !cat.parent_id);

  const buildTree = (category: BlogCategory): any => {
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

export default function BlogPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { statusFilterOptions, booleanFilterOptions } = useBlogFilterOptions();

  const [_categories, setCategories] = useState<BlogCategory[]>([]);
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
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [searchValue, setSearchValue] = useState(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('search') || '';
    }
    return '';
  });
  const [clientFilters, setClientFilters] = useState<BlogFilters>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const filters: BlogFilters = {};
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
        filters.date_range = { from: dateFrom || undefined, to: dateTo || undefined };
      }
      if (dateFrom) filters.date_from = dateFrom;
      if (dateTo) filters.date_to = dateTo;
      return filters;
    }
    return {};
  });


  // URL State Synchronization
  useURLStateSync(
    setPagination,
    setSearchValue,
    setSorting,
    setClientFilters,
    (urlParams) => {
      const filters: BlogFilters = {};

      // Boolean filters
      filters.is_featured = parseBooleanParam(urlParams, 'is_featured');
      filters.is_public = parseBooleanParam(urlParams, 'is_public');
      filters.is_active = parseBooleanParam(urlParams, 'is_active');

      // String filters
      filters.status = parseStringParam(urlParams, 'status');
      filters.category = parseStringParam(urlParams, 'category');

      // Date filters
      Object.assign(filters, parseDateRange(urlParams));

      return filters;
    }
  );

  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    blogId?: number;
    blogIds?: number[];
    isBulk: boolean;
  }>({
    open: false,
    isBulk: false,
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await blogApi.getCategories({
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

  const { handleFilterChange } = useTableFilters<BlogFilters>(
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

  const blogFilterConfig = getBlogFilterConfig(
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
    date_from: (clientFilters.date_range?.from || clientFilters['date_from']) as string | undefined,
    date_to: (clientFilters.date_range?.to || clientFilters['date_to']) as string | undefined,
  };

  const { data: blogs, isLoading, error } = useQuery({
    queryKey: ['blogs', queryParams.search, queryParams.page, queryParams.size, queryParams.order_by, queryParams.order_desc, queryParams.status, queryParams.is_featured, queryParams.is_public, queryParams.is_active, queryParams.category, queryParams.date_from, queryParams.date_to],

    queryFn: async () => {
      const response = await blogApi.getBlogList(queryParams);
      return response;
    },
    staleTime: 0,
    retry: 1,
  });

  const data: Blog[] = blogs?.data || [];
  const pageCount = blogs?.pagination?.total_pages || 1;

  const deleteBlogMutation = useMutation({
    mutationFn: (blogId: number) => blogApi.deleteBlog(blogId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
      showSuccess(msg.crud('deleted', { item: 'بلاگ' }));
    },
    onError: (_error) => {
      showError("خطای سرور");
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (blogIds: number[]) => blogApi.bulkDeleteBlogs(blogIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
      showSuccess(msg.crud('deleted', { item: 'بلاگ' }));
      setRowSelection({});
    },
    onError: (_error) => {
      showError("خطای سرور");
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: number; is_active: boolean }) => {
      return blogApi.partialUpdateBlog(id, { is_active });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
      showSuccess(`بلاگ با موفقیت ${data.is_active ? 'فعال' : 'غیرفعال'} شد`);
    },
    onError: (_error) => {
      showError("خطا در تغییر وضعیت");
    },
  });

  const handleToggleActive = (blog: Blog) => {
    toggleActiveMutation.mutate({
      id: blog.id,
      is_active: !blog.is_active,
    });
  };

  const handleDeleteBlog = (blogId: number | string) => {
    setDeleteConfirm({
      open: true,
      blogId: Number(blogId),
      isBulk: false,
    });
  };

  const handleDeleteSelected = (selectedIds: (string | number)[]) => {
    setDeleteConfirm({
      open: true,
      blogIds: selectedIds.map(id => Number(id)),
      isBulk: true,
    });
  };

  const handleConfirmDelete = async () => {
    try {
      if (deleteConfirm.isBulk && deleteConfirm.blogIds) {
        await bulkDeleteMutation.mutateAsync(deleteConfirm.blogIds);
      } else if (!deleteConfirm.isBulk && deleteConfirm.blogId) {
        await deleteBlogMutation.mutateAsync(deleteConfirm.blogId);
      }
    } catch (error) {
    }
    setDeleteConfirm({ open: false, isBulk: false });
  };

  const rowActions: DataTableRowAction<Blog>[] = [
    {
      label: "مشاهده",
      icon: <Eye className="h-4 w-4" />,
      onClick: (blog) => navigate(`/blogs/${blog.id}/view`),
      permission: "blog.read",
    },
    {
      label: "ویرایش",
      icon: <Edit className="h-4 w-4" />,
      onClick: (blog) => navigate(`/blogs/${blog.id}/edit`),
      permission: "blog.update",
    },
    {
      label: "حذف",
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (blog) => handleDeleteBlog(blog.id),
      isDestructive: true,
      permission: "blog.delete",
    },
  ];

  const columns = useBlogColumns(rowActions, handleToggleActive) as ColumnDef<Blog>[];

  const { exportExcel, isLoading: isExcelLoading } = useExcelExport();
  const { exportBlogListPdf, isLoading: isPdfLoading } = usePdfExport();
  const { openPrintWindow } = usePrintView();

  const handleExcelExport = async (filters: BlogFilters, search: string, exportAll: boolean = false) => {
    const exportParams: any = {
      search: search || undefined,
      order_by: sorting.length > 0 ? sorting[0].id : "created_at",
      order_desc: sorting.length > 0 ? sorting[0].desc : true,
      status: filters.status,
      is_featured: filters.is_featured,
      is_public: filters.is_public,
      is_active: filters.is_active,
      categories__in: filters.categories ? filters.categories.toString() : undefined,
    };

    if (exportAll) exportParams.export_all = true;
    else {
      exportParams.page = pagination.pageIndex + 1;
      exportParams.size = pagination.pageSize;
    }

    await exportExcel(data, blogs?.pagination?.count || 0, exportParams);
  };

  const handlePdfExport = async (filters: BlogFilters, search: string, exportAll: boolean = false) => {
    const exportParams: any = {
      search: search || undefined,
      order_by: sorting.length > 0 ? sorting[0].id : "created_at",
      order_desc: sorting.length > 0 ? sorting[0].desc : true,
      status: filters.status,
      is_featured: filters.is_featured,
      is_public: filters.is_public,
      is_active: filters.is_active,
      categories__in: filters.categories ? filters.categories.toString() : undefined,
    };

    if (exportAll) exportParams.export_all = true;
    else {
      exportParams.page = pagination.pageIndex + 1;
      exportParams.size = pagination.pageSize;
    }

    exportBlogListPdf(exportParams);
  };

  const handlePrintAction = async (printAll: boolean = false) => {
    if (!printAll) {
      const selectedIds = Object.keys(rowSelection).filter(key => (rowSelection as any)[key]).map(idx => data[parseInt(idx)].id);
      if (selectedIds.length > 0) {
        openPrintWindow(selectedIds);
      } else {
        openPrintWindow(data.map(b => b.id));
      }
      return;
    }

    try {
      showWarning("در حال آماده‌سازی فایل پرینت برای تمامی موارد...");
      const response = await blogApi.getBlogList({
        ...queryParams,
        page: 1,
        size: 10000, // Fetch all reasonable amount
      });

      const allIds = response.data.map(b => b.id);
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
    navigate(url.search, { replace: true });
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
    navigate(url.search, { replace: true });
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="page-title">مدیریت بلاگ‌ها</h1>
        </div>
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
              queryClient.invalidateQueries({ queryKey: ['blogs'] });
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
      <PageHeader title="مدیریت بلاگ‌ها">
        <ProtectedButton
          size="sm"
          permission="blog.create"
          onClick={() => navigate("/blogs/create")}
        >
          <Plus className="h-4 w-4" />
          افزودن بلاگ
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
            permission: "blog.delete",
            denyMessage: "اجازه حذف بلاگ ندارید",
          }}
          exportConfigs={[
            {
              onExport: (filters, search) => handleExcelExport(filters as BlogFilters, search, false),
              buttonText: `خروجی اکسل (صفحه فعلی)${isExcelLoading ? '...' : ''}`,
              value: "excel",
            },
            {
              onExport: (filters, search) => handleExcelExport(filters as BlogFilters, search, true),
              buttonText: "خروجی اکسل (همه)",
              value: "excel_all",
            },
            {
              onExport: (filters, search) => handlePdfExport(filters as BlogFilters, search, false),
              buttonText: `خروجی PDF (صفحه فعلی)${isPdfLoading ? '...' : ''}`,
              value: "pdf",
            },
            {
              onExport: (filters, search) => handlePdfExport(filters as BlogFilters, search, true),
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
          filterConfig={blogFilterConfig}
          filterVariant="sidebar"
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
                ? getConfirm('bulkDelete', { item: 'بلاگ', count: deleteConfirm.blogIds?.length || 0 })
                : getConfirm('delete', { item: 'بلاگ' })
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