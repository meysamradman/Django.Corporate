"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useAdminColumns } from "@/components/admins/AdminTableColumns";
import { useAdminFilterOptions, getAdminFilterConfig } from "@/components/admins/AdminTableFilters";
import { AdminWithProfile, AdminListParams, AdminFilters } from "@/types/auth/admin";
import type { DataTableRowAction } from "@/types/shared/table";
import { useAuth } from "@/core/auth/AuthContext";
import { adminApi } from "@/api/admins/route";
import { Edit, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/elements/Button";
import { ProtectedButton } from "@/core/permissions";
import Link from "next/link";
import { showSuccess, showError } from '@/core/toast';
import { OnChangeFn, SortingState } from "@tanstack/react-table";
import { TablePaginationState } from '@/types/shared/pagination';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { initSortingFromURL } from "@/components/tables/utils/tableSorting";

const DataTable = dynamic(
  () => import("@/components/tables/DataTable").then(mod => ({ default: mod.DataTable })),
  { 
    ssr: false, 
    loading: () => (
      <div className="rounded-md border">
        <div className="p-4 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-muted rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }
);
import { getConfirm, getCrud } from '@/core/messages';
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

export default function AdminsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { booleanFilterOptions, roleFilterOptions } = useAdminFilterOptions();
  const adminFilterConfig = getAdminFilterConfig(booleanFilterOptions, roleFilterOptions);

  const [pagination, setPagination] = useState<TablePaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>(() => initSortingFromURL());
  const [rowSelection, setRowSelection] = useState({});
  const [searchValue, setSearchValue] = useState("");
  const [clientFilters, setClientFilters] = useState<AdminFilters>({});

  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    
    if (urlParams.get('page')) {
      const page = parseInt(urlParams.get('page')!, 10);
      setPagination(prev => ({ ...prev, pageIndex: page - 1 }));
    }
    if (urlParams.get('size')) {
      const size = parseInt(urlParams.get('size')!, 10);
      setPagination(prev => ({ ...prev, pageSize: size }));
    }
    
    if (urlParams.get('order_by') && urlParams.get('order_desc') !== null) {
      const orderBy = urlParams.get('order_by')!;
      const orderDesc = urlParams.get('order_desc') === 'true';
      setSorting([{ id: orderBy, desc: orderDesc }]);
    } else {
      setSorting(initSortingFromURL());
    }
    
    if (urlParams.get('search')) {
      setSearchValue(urlParams.get('search')!);
    }
    
    const newClientFilters: typeof clientFilters = {};
    if (urlParams.get('is_active') !== null) {
      newClientFilters.is_active = urlParams.get('is_active') === 'true';
    }
    if (urlParams.get('is_superuser') !== null) {
      newClientFilters.is_superuser = urlParams.get('is_superuser') === 'true';
    }
    
    if (Object.keys(newClientFilters).length > 0) {
      setClientFilters(newClientFilters);
    }
  }, []);

  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    adminId?: number;
    adminIds?: number[];
    isBulk: boolean;
  }>({
    open: false,
    isBulk: false,
  });

  const queryParams: AdminListParams = {
    search: searchValue,
    page: pagination.pageIndex + 1,
    size: pagination.pageSize,
    order_by: sorting.length > 0 ? sorting[0].id : "created_at",
    order_desc: sorting.length > 0 ? sorting[0].desc : true,
    is_active: clientFilters.is_active,
    is_superuser: clientFilters.is_superuser,
  };

  const { data: response, isLoading, error } = useQuery({
    queryKey: ['admins', queryParams.search, queryParams.page, queryParams.size, queryParams.order_by, queryParams.order_desc, queryParams.is_active, queryParams.is_superuser],
    queryFn: async () => {
      return await adminApi.getAdminList(queryParams);
    },
    staleTime: 0,
  });

  const data = response?.data || [];
  const pageCount = response?.pagination?.total_pages || 1;

  const deleteAdminMutation = useMutation({
    mutationFn: (adminId: number) => adminApi.deleteAdmin(adminId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins'] });
      showSuccess("با موفقیت حذف شد");
    },
    onError: (error) => {
      showError("خطای سرور");
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (adminIds: number[]) => adminApi.bulkDeleteAdmins(adminIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins'] });
      showSuccess("با موفقیت حذف شد");
      setRowSelection({});
    },
    onError: (error) => {
      showError("خطای سرور");
    },
  });

  const handleDeleteAdmin = (adminId: number | string) => {
    setDeleteConfirm({
      open: true,
      adminId: Number(adminId),
      isBulk: false,
    });
  };

  const handleDeleteSelected = (selectedIds: (string | number)[]) => {
    setDeleteConfirm({
      open: true,
      adminIds: selectedIds.map(id => Number(id)),
      isBulk: true,
    });
  };

  const handleConfirmDelete = async () => {
    try {
      if (deleteConfirm.isBulk && deleteConfirm.adminIds) {
        await bulkDeleteMutation.mutateAsync(deleteConfirm.adminIds);
      } else if (!deleteConfirm.isBulk && deleteConfirm.adminId) {
        await deleteAdminMutation.mutateAsync(deleteConfirm.adminId);
      }
    } catch (error) {
    }
    setDeleteConfirm({ open: false, isBulk: false });
  };

  const currentUserId = user?.id;
  const isSuperAdmin = user?.is_superuser || user?.is_admin_full;

  const columns = useAdminColumns(
    React.useMemo(() => {
      const actions: DataTableRowAction<AdminWithProfile>[] = [];
      
      actions.push({
        label: "ویرایش",
        icon: <Edit className="h-4 w-4" />,
        onClick: (admin: AdminWithProfile) => {
          router.push(`/admins/${admin.id}/edit`);
        },
        isDisabled: (admin: AdminWithProfile) => {
          if (!currentUserId) return true;
          const isOwnProfile = currentUserId === admin.id;
          return !isSuperAdmin && !isOwnProfile;
        },
      });
      
      actions.push({
        label: "حذف",
        icon: <Trash2 className="h-4 w-4" />,
        onClick: (admin: AdminWithProfile) => handleDeleteAdmin(admin.id),
        isDestructive: true,
        isDisabled: () => !isSuperAdmin,
      });
      
      return actions;
    }, [router, currentUserId, isSuperAdmin])
  );

  const handleFilterChange = (filterId: keyof AdminFilters, value: unknown) => {
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
      const filterKey = filterId;
      
      setClientFilters(prev => ({
        ...prev,
        [filterId]: value as boolean | undefined
      }));
      setPagination(prev => ({ ...prev, pageIndex: 0 }));
      
      const url = new URL(window.location.href);
      if (value !== undefined && value !== null) {
        url.searchParams.set(String(filterKey), String(value));
      } else {
        url.searchParams.delete(String(filterKey));
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
          <h1 className="page-title">مدیریت ادمین‌ها</h1>
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
            مدیریت ادمین‌ها
          </h1>
        </div>
        <div className="flex items-center">
          <ProtectedButton 
            size="sm" 
            asChild
            permission="admin.create"
            showDenyToast
            denyMessage="شما مجوز ایجاد ادمین ندارید"
          >
            <Link href="/admins/create">
              <Plus />
              افزودن ادمین
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

        filterConfig={adminFilterConfig}
        deleteConfig={{
          onDeleteSelected: handleDeleteSelected,
          permission: "admin.delete",
          denyMessage: "اجازه حذف ادمین ندارید",
        }}
        searchValue={searchValue}
        pageSizeOptions={[10, 20, 50]}
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
                ? getConfirm('bulkDelete', { item: 'ادمین', count: deleteConfirm.adminIds?.length || 0 })
                : getConfirm('delete', { item: 'ادمین' })
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
