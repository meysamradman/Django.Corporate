import { lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader/PageHeader";
import { useUserColumns } from "@/components/users/UserTableColumns";
import { useUserFilterOptions, getUserFilterConfig } from "@/components/users/UserTableFilters";
import type { UserWithProfile } from "@/types/auth/user";
import { adminApi } from "@/api/admins/admins";
import type { Filter } from "@/types/auth/adminFilter";
import { Edit, Eye, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/elements/Button";
import { ProtectedButton } from "@/core/permissions";
import { useQuery } from "@tanstack/react-query";

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
import { useUsersListTableState } from "@/components/users/hooks/useUsersListTableState";
import { useUsersListActions } from "@/components/users/hooks/useUsersListActions";

export default function UsersPage() {
  const navigate = useNavigate();
  const { booleanFilterOptions } = useUserFilterOptions();
  const userFilterConfig = getUserFilterConfig(booleanFilterOptions);

  const {
    pagination,
    sorting,
    rowSelection,
    setRowSelection,
    searchValue,
    clientFilters,
    handleFilterChange,
    handlePaginationChange,
    handleSortingChange,
  } = useUsersListTableState({ navigate });

  const {
    deleteConfirm,
    setDeleteConfirm,
    handleDeleteUser,
    handleDeleteSelected,
    handleConfirmDelete,
  } = useUsersListActions({ setRowSelection });

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

  const columns = useUserColumns([
    {
      label: "مشاهده",
      icon: <Eye className="h-4 w-4" />,
      onClick: (user: UserWithProfile) => navigate(`/users/${user.id}/view`),
      permission: "users.read",
    },
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
