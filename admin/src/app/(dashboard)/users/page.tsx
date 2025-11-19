"use client";

import React, { useState } from "react";
import { DataTable } from "@/components/tables/DataTable";
import { useUserColumns } from "@/components/users/UserTableColumns";
import { useUserFilterOptions, getUserFilterConfig } from "@/components/users/UserTableFilters";
import { UserWithProfile } from "@/types/auth/user";
import { adminApi, Filter } from "@/api/admins/route";
import { Edit, Trash2, Eye, Plus } from "lucide-react";
import { Button } from "@/components/elements/Button";
import { ProtectedButton } from "@/core/permissions";
import Link from "next/link";
import { toast } from '@/components/elements/Sonner';
import { OnChangeFn, SortingState } from "@tanstack/react-table";
import { TablePaginationState } from '@/types/shared/pagination';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

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

export default function UsersPage() {
  const queryClient = useQueryClient();
  const { booleanFilterOptions } = useUserFilterOptions();
  const userFilterConfig = getUserFilterConfig(booleanFilterOptions);

  const [pagination, setPagination] = useState<TablePaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState({});
  const [searchValue, setSearchValue] = useState("");
  const [clientFilters, setClientFilters] = useState<Filter>({});

  // Load filters from URL on initial load
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Load pagination from URL
    if (urlParams.get('page')) {
      const page = parseInt(urlParams.get('page')!, 10);
      setPagination(prev => ({ ...prev, pageIndex: page - 1 }));
    }
    if (urlParams.get('size')) {
      const size = parseInt(urlParams.get('size')!, 10);
      setPagination(prev => ({ ...prev, pageSize: size }));
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
    const newClientFilters: typeof clientFilters = {};
    if (urlParams.get('is_active') !== null) {
      newClientFilters.is_active = urlParams.get('is_active') === 'true';
    }
    if (urlParams.get('is_verified') !== null) {
      newClientFilters.is_verified = urlParams.get('is_verified') === 'true';
    }
    
    if (Object.keys(newClientFilters).length > 0) {
      setClientFilters(newClientFilters);
    }
  }, []);

  // Confirm dialog states
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    userId?: number;
    userIds?: number[];
    isBulk: boolean;
  }>({
    open: false,
    isBulk: false,
  });

  // Build query parameters
  const queryParams: Filter = {
    search: searchValue,
    page: pagination.pageIndex + 1,
    size: pagination.pageSize,
    order_by: sorting.length > 0 ? sorting[0].id : "created_at",
    order_desc: sorting.length > 0 ? sorting[0].desc : true,
    is_active: clientFilters.is_active,
    is_verified: clientFilters.is_verified,
  };

  // Use React Query for data fetching
  const { data: response, isLoading, error } = useQuery({
    queryKey: ['users', queryParams.search, queryParams.page, queryParams.size, queryParams.order_by, queryParams.order_desc, queryParams.is_active, queryParams.is_verified],
    queryFn: async () => {
      return await adminApi.fetchUsersList('user', queryParams);
    },
    staleTime: 0, // Always fetch fresh data
  });

  const data = (response?.data || []) as UserWithProfile[];
  const totalCount = response?.pagination?.count || 0;
  const pageCount = response?.pagination?.total_pages || Math.ceil(totalCount / pagination.pageSize) || 1;

  // Delete mutations
  const deleteUserMutation = useMutation({
    mutationFn: (userId: number) => adminApi.deleteUserByType(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success("با موفقیت حذف شد");
    },
    onError: (error) => {
      toast.error("خطای سرور");
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (userIds: number[]) => adminApi.bulkDeleteUsersByType(userIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success("با موفقیت حذف شد");
      setRowSelection({});
    },
    onError: (error) => {
      toast.error("خطای سرور");
    },
  });

  // تابع حذف کاربر
  const handleDeleteUser = (userId: number | string) => {
    setDeleteConfirm({
      open: true,
      userId: Number(userId),
      isBulk: false,
    });
  };

  // تابع حذف دسته‌جمعی
  const handleDeleteSelected = (selectedIds: (string | number)[]) => {
    setDeleteConfirm({
      open: true,
      userIds: selectedIds.map(id => Number(id)),
      isBulk: true,
    });
  };

  // تابع تایید حذف
  const handleConfirmDelete = async () => {
    try {
      if (deleteConfirm.isBulk && deleteConfirm.userIds) {
        await bulkDeleteMutation.mutateAsync(deleteConfirm.userIds);
      } else if (!deleteConfirm.isBulk && deleteConfirm.userId) {
        await deleteUserMutation.mutateAsync(deleteConfirm.userId);
      }
    } catch (error) {
      // Error in delete
    }
    setDeleteConfirm({ open: false, isBulk: false });
  };

  // تعریف ستون‌های جدول
  const columns = useUserColumns([
    {
      label: "ویرایش",
      icon: <Edit className="h-4 w-4" />,
      onClick: (user: UserWithProfile) => {
        window.location.href = `/users/${user.id}/edit`;
      },
    },
    {
      label: "حذف",
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (user: UserWithProfile) => handleDeleteUser(user.id),
      isDestructive: true,
    },
  ]);

  const handleFilterChange = (filterId: keyof Filter, value: unknown) => {
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
      setClientFilters(prev => ({
        ...prev,
        [filterId]: value as boolean | undefined
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
          <h1 className="page-title">مدیریت کاربران</h1>
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
            مدیریت کاربران
          </h1>
        </div>
        <div className="flex items-center">
          {/* ✅ دکمه navigation به صفحه ایجاد - با Toast */}
          <ProtectedButton
            permission="users.create"
            size="sm"
            asChild
            showDenyToast={true}
            denyMessage="اجازه ایجاد کاربر ندارید"
          >
            <Link href="/users/create">
              <Plus />
              افزودن کاربر
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
        filterConfig={userFilterConfig}
        deleteConfig={{
          onDeleteSelected: handleDeleteSelected,
          permission: "users.delete",
          denyMessage: "اجازه حذف کاربر ندارید",
        }}
        searchValue={searchValue}
        pageSizeOptions={[10, 20, 50]}
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
                ? getConfirmMessage('bulkDeleteUsers', { count: deleteConfirm.userIds?.length || 0 })
                : getConfirmMessage('deleteUser')
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
