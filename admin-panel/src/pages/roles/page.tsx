import { useState, useMemo } from "react";
import { useTableFilters } from "@/components/tables/utils/useTableFilters";
import { Link, useNavigate } from "react-router-dom";
import { useURLStateSync, parseBooleanParam, parseDateRange } from "@/hooks/useURLStateSync";
import { PageHeader } from "@/components/layout/PageHeader/PageHeader";
import { DataTable } from "@/components/tables/DataTable";
import { useRoleColumns } from "@/components/roles/RoleTableColumns";
import { useRoleFilterOptions, getRoleFilterConfig } from "@/components/roles/RoleTableFilters";
import type { Role } from "@/types/auth/permission";
import { useRoles, useDeleteRole, useBulkDeleteRoles } from "@/core/permissions";
import { Edit, Trash2, Eye, Plus } from "lucide-react";
import { Button } from "@/components/elements/Button";
import { ProtectedButton } from "@/core/permissions";
import { showWarning } from "@/core/toast";
import type { SortingState, OnChangeFn } from "@tanstack/react-table";
import type { TablePaginationState } from '@/types/shared/pagination';
import { getConfirm } from '@/core/messages';
import { initSortingFromURL } from "@/components/tables/utils/tableSorting";
import type { DataTableRowAction } from "@/types/shared/table";
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

  const [pagination, setPagination] = useState<TablePaginationState>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const page = parseInt(urlParams.get('page') || '1', 10);
      const size = parseInt(urlParams.get('size') || '10', 10);
      return { pageIndex: Math.max(0, page - 1), pageSize: size };
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
  const [clientFilters, setClientFilters] = useState<{
    is_active?: boolean;
    is_system_role?: boolean;
    date_from?: string;
    date_to?: string;
  }>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const filters: {
        is_active?: boolean;
        is_system_role?: boolean;
        date_from?: string;
        date_to?: string;
      } = {};
      const isActive = urlParams.get('is_active');
      if (isActive !== null) filters.is_active = isActive === 'true';
      const isSystemRole = urlParams.get('is_system_role');
      if (isSystemRole !== null) filters.is_system_role = isSystemRole === 'true';
      if (urlParams.get('date_from')) filters.date_from = urlParams.get('date_from') as string;
      if (urlParams.get('date_to')) filters.date_to = urlParams.get('date_to') as string;
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
      const filters: {
        is_active?: boolean;
        is_system_role?: boolean;
        date_from?: string;
        date_to?: string;
      } = {};

      // Boolean filters
      filters.is_active = parseBooleanParam(urlParams, 'is_active');
      filters.is_system_role = parseBooleanParam(urlParams, 'is_system_role');

      // Date filters
      Object.assign(filters, parseDateRange(urlParams));

      return filters;
    }
  );

  const navigate = useNavigate();
  const { handleFilterChange } = useTableFilters<typeof clientFilters>(
    setClientFilters,
    setSearchValue,
    setPagination
  );

  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    roleId?: number;
    roleIds?: number[];
    isBulk: boolean;
  }>({
    open: false,
    isBulk: false,
  });

  const queryParams = useMemo(() => {
    const params = {
      search: searchValue,
      page: pagination.pageIndex + 1,
      size: pagination.pageSize,
      order_by: sorting.length > 0 ? sorting[0].id : "created_at",
      order_desc: sorting.length > 0 ? sorting[0].desc : true,
      is_active: clientFilters.is_active,
      is_system_role: clientFilters.is_system_role,
      date_from: clientFilters.date_from as string | undefined,
      date_to: clientFilters.date_to as string | undefined,
    };

    return params;
  }, [searchValue, pagination.pageIndex, pagination.pageSize, sorting, clientFilters.is_active, clientFilters.is_system_role, clientFilters.date_from, clientFilters.date_to]);

  const { data: response, isLoading, error } = useRoles(queryParams);

  const data = response?.data || [];
  const pageCount = response?.pagination?.total_pages || 1;

  const deleteRoleMutation = useDeleteRole();
  const bulkDeleteMutation = useBulkDeleteRoles();

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

  const handleDeleteRole = (roleId: number) => {
    const role = data.find(r => r.id === roleId);
    if (role?.is_system_role) {
      showWarning('نقش‌های سیستمی قابل حذف نیستند');
      return;
    }

    setDeleteConfirm({
      open: true,
      roleId: roleId,
      isBulk: false,
    });
  };

  const handleDeleteSelected = (selectedIds: (string | number)[]) => {
    const numericSelectedIds = selectedIds.map(id => Number(id));
    const selectedRoles = data.filter(role => numericSelectedIds.includes(Number(role.id)));
    const deletableRoles = selectedRoles.filter(role => !role.is_system_role);

    if (deletableRoles.length === 0) {
      showWarning('نقش‌های سیستمی قابل حذف نیستند');
      return;
    }

    if (deletableRoles.length < selectedRoles.length) {
      showWarning(`تنها ${deletableRoles.length} نقش غیرسیستمی حذف خواهد شد`);
    }

    setDeleteConfirm({
      open: true,
      roleIds: deletableRoles.map(role => role.id),
      isBulk: true,
    });
  };

  const handleConfirmDelete = async () => {
    try {
      if (deleteConfirm.isBulk && deleteConfirm.roleIds) {
        await bulkDeleteMutation.mutateAsync(deleteConfirm.roleIds);
        setRowSelection({});
      } else if (!deleteConfirm.isBulk && deleteConfirm.roleId) {
        await deleteRoleMutation.mutateAsync(deleteConfirm.roleId);
      }
    } catch (error: any) {
    }
    setDeleteConfirm({ open: false, isBulk: false });
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