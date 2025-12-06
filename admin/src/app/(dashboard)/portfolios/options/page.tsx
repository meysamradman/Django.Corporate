"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/tables/DataTable";
import { useOptionColumns } from "@/components/portfolios/options/list/OptionTableColumns";
import { useOptionFilterOptions, getOptionFilterConfig } from "@/components/portfolios/options/list/OptionTableFilters";
import { Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/elements/Button";
import { ProtectedButton } from "@/core/permissions";
import Link from "next/link";
import { toast } from '@/components/elements/Sonner';
import { OnChangeFn, SortingState } from "@tanstack/react-table";
import { TablePaginationState } from '@/types/shared/pagination';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { initSortingFromURL } from "@/components/tables/utils/tableSorting";
import { msg } from '@/core/messages';
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

import { PortfolioOption } from "@/types/portfolio/options/portfolioOption";
import { ColumnDef } from "@tanstack/react-table";
import { portfolioApi } from "@/api/portfolios/route";
import type { DataTableRowAction } from "@/types/shared/table";

export default function OptionPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { booleanFilterOptions } = useOptionFilterOptions();
  const optionFilterConfig = getOptionFilterConfig(booleanFilterOptions);

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
  });

  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    optionId?: number;
    optionIds?: number[];
    isBulk: boolean;
  }>({
    open: false,
    isBulk: false,
  });

  const queryParams: any = {
    search: searchValue,
    page: pagination.pageIndex + 1,
    size: pagination.pageSize,
    order_by: sorting.length > 0 ? sorting[0].id : "created_at",
    order_desc: sorting.length > 0 ? sorting[0].desc : true,
    is_active: clientFilters.is_active as string || undefined,
    is_public: clientFilters.is_public as string || undefined,
  };

  const { data: options, isLoading, error } = useQuery({
    queryKey: ['options', queryParams.search, queryParams.page, queryParams.size, queryParams.order_by, queryParams.order_desc, queryParams.is_active, queryParams.is_public],
    queryFn: async () => {
      return await portfolioApi.getOptions(queryParams);
    },
    staleTime: 0,
  });

  const data: PortfolioOption[] = Array.isArray(options?.data) ? options.data : [];
  const pageCount = options?.pagination?.total_pages || 1;

  const deleteOptionMutation = useMutation({
    mutationFn: (optionId: number) => {
      return portfolioApi.deleteOption(optionId);
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
    mutationFn: (optionIds: number[]) => {
      return portfolioApi.bulkDeleteOptions(optionIds);
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

  const handleDeleteOption = (optionId: number | string) => {
    setDeleteConfirm({
      open: true,
      optionId: Number(optionId),
      isBulk: false,
    });
  };

  const handleDeleteSelected = (selectedIds: (string | number)[]) => {
    setDeleteConfirm({
      open: true,
      optionIds: selectedIds.map(id => Number(id)),
      isBulk: true,
    });
  };

  const handleConfirmDelete = async () => {
    try {
      if (deleteConfirm.isBulk && deleteConfirm.optionIds) {
        await bulkDeleteMutation.mutateAsync(deleteConfirm.optionIds);
      } else if (!deleteConfirm.isBulk && deleteConfirm.optionId) {
        await deleteOptionMutation.mutateAsync(deleteConfirm.optionId);
      }
    } catch (error) {
    }
    setDeleteConfirm({ open: false, isBulk: false });
  };

  const rowActions: DataTableRowAction<PortfolioOption>[] = [
    {
      label: "ویرایش",
      icon: <Edit className="h-4 w-4" />,
      onClick: (option) => router.push(`/portfolios/options/${option.id}/edit`),
    },
    {
      label: "حذف",
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (option) => handleDeleteOption(option.id),
      isDestructive: true,
    },
  ];
  
  const columns = useOptionColumns(rowActions) as ColumnDef<PortfolioOption>[];

  React.useEffect(() => {
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

  const handleFilterChange = (filterId: string | number, value: unknown) => {
    if (filterId === "search") {
      setSearchValue(typeof value === 'string' ? value : '');
      setPagination(prev => ({ ...prev, pageIndex: 0 }));
      
      const url = new URL(window.location.href);
      if (value && typeof value === 'string') {
        url.searchParams.set('search', value);
      } else {
        url.searchParams.delete('search');
      }
      url.searchParams.set('page', '1');
      window.history.replaceState({}, '', url.toString());
    } else {
      setClientFilters(prev => ({
        ...prev,
        [filterId]: value
      }));
      setPagination(prev => ({ ...prev, pageIndex: 0 }));
      
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
        <div className="flex items-center justify-between">
          <h1 className="page-title">مدیریت گزینه‌ها</h1>
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">
            مدیریت گزینه‌ها
          </h1>
        </div>
        <div className="flex items-center">
          <ProtectedButton 
            permission="portfolio.create"
            size="sm" 
            asChild
          >
            <Link href="/portfolios/options/create">
              <Edit className="h-4 w-4" />
              افزودن گزینه
            </Link>
          </ProtectedButton>
        </div>
      </div>

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
          denyMessage: "اجازه حذف گزینه ندارید",
        }}
        filterConfig={optionFilterConfig}
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
                ? `آیا از حذف ${deleteConfirm.optionIds?.length || 0} گزینه انتخاب شده مطمئن هستید؟`
                : "آیا از حذف این گزینه مطمئن هستید؟"
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