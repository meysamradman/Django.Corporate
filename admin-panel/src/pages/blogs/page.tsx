import { lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader/PageHeader";
import { useBlogColumns } from "@/components/blogs/posts/list/BlogTableColumns";
import type { BlogFilters } from "@/types/blog/blogListParams";
import { Eye, Edit, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/elements/Button";
import { ProtectedButton } from "@/core/permissions";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useBlogListTableState } from "@/components/blogs/hooks/useBlogListTableState";
import { useBlogListActions } from "@/components/blogs/hooks/useBlogListActions";

const DataTable = lazy(() => import("@/components/tables/DataTable").then(mod => ({ default: mod.DataTable })));
import { getConfirm } from '@/core/messages';
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

export default function BlogPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const {
    pagination,
    sorting,
    rowSelection,
    setRowSelection,
    searchValue,
    clientFilters,
    handleFilterChange,
    blogFilterConfig,
    handlePaginationChange,
    handleSortingChange,
  } = useBlogListTableState({ navigate });

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

  const {
    deleteConfirm,
    setDeleteConfirm,
    handleDeleteBlog,
    handleDeleteSelected,
    handleConfirmDelete,
    handleToggleActive,
    handleExcelExport,
    handlePdfExport,
    handlePrintAction,
    isExcelLoading,
    isPdfLoading,
  } = useBlogListActions({
    data,
    totalCount: blogs?.pagination?.count || 0,
    pagination,
    sorting,
    rowSelection,
    setRowSelection,
    queryParams,
  });

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