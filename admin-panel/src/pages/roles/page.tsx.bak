import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader/PageHeader";
import { DataTable } from "@/components/tables/DataTable";
import { useRoleColumns } from "@/components/roles/RoleTableColumns";
import { useRoleFilterOptions, getRoleFilterConfig } from "@/components/roles/RoleTableFilters";
import type { Role } from "@/types/auth/permission";
import { useRoles } from "@/core/permissions";
import { Edit, Trash2, Eye, Plus } from "lucide-react";
import { Button } from "@/components/elements/Button";
import { ProtectedButton } from "@/core/permissions";
import { getConfirm } from '@/core/messages';
import type { DataTableRowAction } from "@/types/shared/table";
import { useRolesListTableState } from "@/components/roles/hooks/useRolesListTableState";
import { useRolesListActions } from "@/components/roles/hooks/useRolesListActions";
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

export default function RolesPage() {
  const { roleTypeFilterOptions } = useRoleFilterOptions();
  const roleFilterConfig = getRoleFilterConfig(roleTypeFilterOptions);
  const navigate = useNavigate();

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
  } = useRolesListTableState();

  const queryParams = useMemo(() => ({
    search: searchValue,
    page: pagination.pageIndex + 1,
    size: pagination.pageSize,
    order_by: sorting.length > 0 ? sorting[0].id : "created_at",
    order_desc: sorting.length > 0 ? sorting[0].desc : true,
    is_active: clientFilters.is_active,
    is_system_role: clientFilters.is_system_role,
    date_from: clientFilters.date_from as string | undefined,
    date_to: clientFilters.date_to as string | undefined,
  }), [
    searchValue,
    pagination.pageIndex,
    pagination.pageSize,
    sorting,
    clientFilters.is_active,
    clientFilters.is_system_role,
    clientFilters.date_from,
    clientFilters.date_to,
  ]);

  const { data: response, isLoading, error } = useRoles(queryParams);

  const data = response?.data || [];
  const pageCount = response?.pagination?.total_pages || 1;

  const {
    deleteConfirm,
    setDeleteConfirm,
    handleDeleteRole,
    handleDeleteSelected,
    handleConfirmDelete,
  } = useRolesListActions({
    data,
    setRowSelection,
  });

  const rowActions: DataTableRowAction<Role>[] = [
    {
      label: "مشاهده",
      icon: <Eye className="h-4 w-4" />,
      onClick: (role: Role) => {
        navigate(`/roles/${role.id}`);
      },
      permission: "role.read",
    },
    {
      label: "ویرایش",
      icon: <Edit className="h-4 w-4" />,
      onClick: (role: Role) => {
        navigate(`/roles/${role.id}/edit`);
      },
      permission: "role.update",
    },
    {
      label: "حذف",
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (role: Role) => {
        handleDeleteRole(role.id);
      },
      isDestructive: true,
      permission: "role.delete",
    },
  ];

  const columns = useRoleColumns(rowActions);

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="مدیریت نقش‌ها" />
        <div className="text-center py-8">
          <p className="text-red-1">خطا در بارگیری داده‌ها</p>
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
      <PageHeader title="مدیریت نقش‌ها">
        <ProtectedButton
          permission="admin.create"
          size="sm"
          asChild
        >
          <Link to="/roles/create">
            <Plus />
            ایجاد نقش
          </Link>
        </ProtectedButton>
      </PageHeader>

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

        filterConfig={roleFilterConfig}
        deleteConfig={{
          onDeleteSelected: handleDeleteSelected,
          permission: "admin.delete",
          denyMessage: "اجازه حذف نقش ندارید",
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
                ? getConfirm('bulkDelete', { item: 'نقش', count: deleteConfirm.roleIds?.length || 0 })
                : getConfirm('delete', { item: 'نقش' })
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