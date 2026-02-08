import { useState, lazy, Suspense } from "react";
import { useTableFilters } from "@/components/tables/utils/useTableFilters";
import { useNavigate } from "react-router-dom";
import { useURLStateSync, parseBooleanParam, parseDateRange } from "@/hooks/useURLStateSync";
import { PageHeader } from "@/components/layout/PageHeader/PageHeader";
import { useUserColumns } from "@/components/users/UserTableColumns";
import { useUserFilterOptions, getUserFilterConfig } from "@/components/users/UserTableFilters";
import type { UserWithProfile } from "@/types/auth/user";
import { adminApi } from "@/api/admins/admins";
import type { Filter } from "@/types/auth/adminFilter";
import { Edit, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/elements/Button";
import { ProtectedButton } from "@/core/permissions";
import { showError, showSuccess } from '@/core/toast';
import type { OnChangeFn, SortingState } from "@tanstack/react-table";
import type { TablePaginationState } from '@/types/shared/pagination';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { initSortingFromURL } from "@/components/tables/utils/tableSorting";

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

export default function UsersPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { booleanFilterOptions } = useUserFilterOptions();
  const userFilterConfig = getUserFilterConfig(booleanFilterOptions);

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
    return { pageIndex: 0, pageSize: 10 };
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
  const [clientFilters, setClientFilters] = useState<Filter>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const filters: Filter = {};
      const isActive = urlParams.get('is_active');
      if (isActive !== null) filters.is_active = isActive === 'true';
      const isVerified = urlParams.get('is_verified');
      if (isVerified !== null) filters.is_verified = isVerified === 'true';
      if (urlParams.get('date_from')) filters.date_from = urlParams.get('date_from')!;
      if (urlParams.get('date_to')) filters.date_to = urlParams.get('date_to')!;
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
      const filters: Filter = {};

      // Boolean filters
      filters.is_active = parseBooleanParam(urlParams, 'is_active');
      filters.is_verified = parseBooleanParam(urlParams, 'is_verified');

      // Date filters
      Object.assign(filters, parseDateRange(urlParams));

      return filters;
    }
  );

  const { handleFilterChange } = useTableFilters<Filter>(
    setClientFilters,
    setSearchValue,
    setPagination
  );

  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    userId?: number;
    userIds?: number[];
    isBulk: boolean;
  }>({
    open: false,
    isBulk: false,
  });

  const queryParams: Filter = {
    search: searchValue,
    page: pagination.pageIndex + 1,
    size: pagination.pageSize,
    order_by: sorting.length > 0 ? sorting[0].id : "created_at",
    order_desc: sorting.length > 0 ? sorting[0].desc : true,
    is_active: clientFilters.is_active,
    is_verified: clientFilters.is_verified,
    date_from: clientFilters.date_from as string | undefined,
    date_to: clientFilters.date_to as string | undefined,
  };

  const { data: response, isLoading, error } = useQuery({
    queryKey: ['users', queryParams.search, queryParams.page, queryParams.size, queryParams.order_by, queryParams.order_desc, queryParams.is_active, queryParams.is_verified, queryParams.date_from, queryParams.date_to],
    queryFn: async () => {
      return await adminApi.fetchUsersList('user', queryParams);
    },
    staleTime: 0,
  });

  const data = (response?.data || []) as UserWithProfile[];
  const totalCount = response?.pagination?.count || 0;
  const pageCount = response?.pagination?.total_pages || Math.ceil(totalCount / pagination.pageSize) || 1;

  const deleteUserMutation = useMutation({
    mutationFn: (userId: number) => adminApi.deleteUserByType(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      showSuccess("با موفقیت حذف شد");
    },
    onError: (_error) => {
      showError("خطای سرور");
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (userIds: number[]) => adminApi.bulkDeleteUsersByType(userIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      showSuccess("با موفقیت حذف شد");
      setRowSelection({});
    },
    onError: (_error) => {
      showError("خطای سرور");
    },
  });

  const handleDeleteUser = (userId: number | string) => {
    setDeleteConfirm({
      open: true,
      userId: Number(userId),
      isBulk: false,
    });
  };

  const handleDeleteSelected = (selectedIds: (string | number)[]) => {
    setDeleteConfirm({
      open: true,
      userIds: selectedIds.map(id => Number(id)),
      isBulk: true,
    });
  };

  const handleConfirmDelete = async () => {
    try {
      if (deleteConfirm.isBulk && deleteConfirm.userIds) {
        await bulkDeleteMutation.mutateAsync(deleteConfirm.userIds);
      } else if (!deleteConfirm.isBulk && deleteConfirm.userId) {
        await deleteUserMutation.mutateAsync(deleteConfirm.userId);
      }
    } catch (error) {
    }
    setDeleteConfirm({ open: false, isBulk: false });
  };

  const columns = useUserColumns([
    {
      label: "ویرایش",
      icon: <Edit className="h-4 w-4" />,
      onClick: (user: UserWithProfile) => navigate(`/users/${user.id}/edit`),
      permission: "users.update",
    },
    {
      label: "حذف",
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (user: UserWithProfile) => handleDeleteUser(user.id),
      isDestructive: true,
      permission: "users.delete",
    },
  ]);

  const handlePaginationChange: OnChangeFn<TablePaginationState> = (updaterOrValue) => {
    const newPagination = typeof updaterOrValue === 'function' ? updaterOrValue(pagination) : updaterOrValue;
    setPagination(newPagination);
    const url = new URL(window.location.href);
    url.searchParams.set('page', String(newPagination.pageIndex + 1));
    url.searchParams.set('size', String(newPagination.pageSize));
    navigate(url.search, { replace: true });
  };

  const handleSortingChange: OnChangeFn<SortingState> = (updaterOrValue) => {
    const newSorting = typeof updaterOrValue === 'function' ? updaterOrValue(sorting) : updaterOrValue;
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
        <PageHeader title="مدیریت کاربران" />
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
      <PageHeader title="مدیریت کاربران">
        <ProtectedButton
          permission="users.create"
          size="sm"
          onClick={() => navigate("/users/create")}
        >
          <Plus className="h-4 w-4" />
          افزودن کاربر
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
          filterConfig={userFilterConfig}
          deleteConfig={{
            onDeleteSelected: handleDeleteSelected,
            permission: "users.delete",
            denyMessage: "اجازه حذف کاربر ندارید",
          }}
          searchValue={searchValue}
          pageSizeOptions={[10, 20, 50]}
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
                ? getConfirm('bulkDelete', { item: 'کاربر', count: deleteConfirm.userIds?.length || 0 })
                : getConfirm('delete', { item: 'کاربر' })
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
