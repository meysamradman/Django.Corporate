"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/tables/DataTable";
import { useTagColumns } from "@/components/portfolios/tags/list/TagTableColumns";
import { useTagFilterOptions, getTagFilterConfig } from "@/components/portfolios/tags/list/TagTableFilters";
import { Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/elements/Button";
import { ProtectedButton } from "@/core/permissions";
import Link from "next/link";
import { toast } from '@/components/elements/Sonner';
import { OnChangeFn, SortingState } from "@tanstack/react-table";
import { TablePaginationState } from '@/types/shared/pagination';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { initSortingFromURL } from "@/components/tables/utils/tableSorting";
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

import { PortfolioTag } from "@/types/portfolio/tags/portfolioTag";
import { ColumnDef } from "@tanstack/react-table";
import { portfolioApi } from "@/api/portfolios/route";
import type { DataTableRowAction } from "@/types/shared/table";

export default function TagPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { booleanFilterOptions } = useTagFilterOptions();
  const tagFilterConfig = getTagFilterConfig(booleanFilterOptions);

  const [pagination, setPagination] = useState<TablePaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  // ✅ FIX: Default sorting: created_at descending (newest first)
  const [sorting, setSorting] = useState<SortingState>(() => initSortingFromURL());
  const [rowSelection, setRowSelection] = useState({});
  const [searchValue, setSearchValue] = useState("");
  const [clientFilters, setClientFilters] = useState<Record<string, unknown>>({});

  // Confirm dialog states
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    tagId?: number;
    tagIds?: number[];
    isBulk: boolean;
  }>({
    open: false,
    isBulk: false,
  });

  // Build query parameters
  const queryParams = {
    search: searchValue,
    page: pagination.pageIndex + 1,
    size: pagination.pageSize,
    order_by: sorting.length > 0 ? sorting[0].id : "created_at",
    order_desc: sorting.length > 0 ? sorting[0].desc : true,
  };

  // Use React Query for data fetching
  const { data: tags, isLoading, error } = useQuery({
    queryKey: ['tags', queryParams.search, queryParams.page, queryParams.size, queryParams.order_by, queryParams.order_desc],
    queryFn: async () => {
      return await portfolioApi.getTags(queryParams);
    },
    staleTime: 0, // Always fetch fresh data
  });

  const data: PortfolioTag[] = Array.isArray(tags?.data) ? tags.data : [];
  const pageCount = tags?.pagination?.total_pages || 1;

  const deleteTagMutation = useMutation({
    mutationFn: (tagId: number) => {
      return portfolioApi.deleteTag(tagId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast.success("با موفقیت حذف شد");
    },
    onError: (error) => {
      toast.error("خطای سرور");
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (tagIds: number[]) => {
      return portfolioApi.bulkDeleteTags(tagIds);
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast.success("با موفقیت حذف شد");
      setRowSelection({});
    },
    onError: (error) => {
      toast.error("خطای سرور");
    },
  });

  // تابع حذف تگ
  const handleDeleteTag = (tagId: number | string) => {
    setDeleteConfirm({
      open: true,
      tagId: Number(tagId),
      isBulk: false,
    });
  };

  // تابع حذف دسته‌جمعی
  const handleDeleteSelected = (selectedIds: (string | number)[]) => {
    setDeleteConfirm({
      open: true,
      tagIds: selectedIds.map(id => Number(id)),
      isBulk: true,
    });
  };

  // تابع تایید حذف
  const handleConfirmDelete = async () => {
    try {
      if (deleteConfirm.isBulk && deleteConfirm.tagIds) {
        await bulkDeleteMutation.mutateAsync(deleteConfirm.tagIds);
      } else if (!deleteConfirm.isBulk && deleteConfirm.tagId) {
        await deleteTagMutation.mutateAsync(deleteConfirm.tagId);
      }
    } catch (error) {
      // Error handled by mutation
    }
    setDeleteConfirm({ open: false, isBulk: false });
  };

  // تعریف ستون‌های جدول
  const rowActions: DataTableRowAction<PortfolioTag>[] = [
    {
      label: "ویرایش",
      icon: <Edit className="h-4 w-4" />,
      onClick: (tag) => router.push(`/portfolios/tags/${tag.id}/edit`),
    },
    {
      label: "حذف",
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (tag) => handleDeleteTag(tag.id),
      isDestructive: true,
    },
  ];
  
  const columns = useTagColumns(rowActions) as ColumnDef<PortfolioTag>[];

  const handleFilterChange = (filterId: string | number, value: unknown) => {
    if (filterId === "search") {
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
        [filterId]: value
      }));
      setPagination(prev => ({ ...prev, pageIndex: 0 }));
      
      // Update URL with filter value
      const url = new URL(window.location.href);
      if (value !== undefined && value !== null) {
        url.searchParams.set(String(filterId), String(value));
      } else {
        url.searchParams.delete(String(filterId));
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

  // Show error state - but keep header visible
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="page-title">مدیریت تگ‌ها</h1>
        </div>
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">
            مدیریت تگ‌ها
          </h1>
        </div>
        <div className="flex items-center">
          <ProtectedButton 
            permission="portfolio.create"
            size="sm" 
            asChild
          >
            <Link href="/portfolios/tags/create">
              <Edit className="h-4 w-4" />
              افزودن تگ
            </Link>
          </ProtectedButton>
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
          permission: "portfolio.delete",
          denyMessage: "اجازه حذف تگ ندارید",
        }}
        filterConfig={tagFilterConfig}
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
                ? `آیا از حذف ${deleteConfirm.tagIds?.length || 0} تگ انتخاب شده مطمئن هستید؟`
                : "آیا از حذف این تگ مطمئن هستید؟"
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