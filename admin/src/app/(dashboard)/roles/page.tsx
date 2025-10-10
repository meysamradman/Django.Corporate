"use client";

import React, { useState } from "react";
import { DataTable } from "@/components/tables/DataTable";
import { useRoleColumns } from "@/components/roles/RoleTableColumns";
import { useRoleFilterOptions, getRoleFilterConfig } from "@/components/roles/RoleTableFilters";
import { Role } from "@/types/auth/permission";
import { useRoles, useDeleteRole, useBulkDeleteRoles } from "@/components/auth/hooks/useRoles";
import { Edit, Trash2, Eye, Plus } from "lucide-react";
import { Button } from "@/components/elements/Button";
import { toast } from "@/components/elements/Sonner";
import Link from "next/link";
import { PaginationState, SortingState, OnChangeFn } from "@tanstack/react-table";
import { useMutation } from "@tanstack/react-query";
import { PermissionGate, usePermissionProps } from "@/components/auth/PermissionGate";
import { getConfirmMessage } from "@/core/messages/message";
import { DataTableRowAction } from "@/components/tables/DataTableRowActions";
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
  const { getCRUDProps } = usePermissionProps();
  const rolesAccess = getCRUDProps('admin.roles');
  const { roleTypeFilterOptions } = useRoleFilterOptions();
  const roleFilterConfig = getRoleFilterConfig(roleTypeFilterOptions);

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState({});
  const [searchValue, setSearchValue] = useState("");
  const [clientFilters, setClientFilters] = useState<{
    is_active?: boolean;
    is_system_role?: boolean;
  }>({});

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
    if (urlParams.get('is_system_role') !== null) {
      newClientFilters.is_system_role = urlParams.get('is_system_role') === 'true';
    }
    
    if (Object.keys(newClientFilters).length > 0) {
      setClientFilters(newClientFilters);
    }
  }, []);

  // Confirm dialog states
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    roleId?: number;
    roleIds?: number[];
    isBulk: boolean;
  }>({
    open: false,
    isBulk: false,
  });

  // Build query parameters
  const queryParams = React.useMemo(() => ({
    search: searchValue,
    page: pagination.pageIndex + 1,
    size: pagination.pageSize,
    order_by: sorting.length > 0 ? sorting[0].id : "created_at",
    order_desc: sorting.length > 0 ? sorting[0].desc : true,
    is_active: clientFilters.is_active,
    is_system_role: clientFilters.is_system_role,
  }), [searchValue, pagination.pageIndex, pagination.pageSize, sorting, clientFilters.is_active, clientFilters.is_system_role]);

  // Use React Query for data fetching
  const { data: response, isLoading, error, refetch } = useRoles(queryParams);

  const data = response?.data || [];
  const pageCount = response?.pagination?.total_pages || Math.ceil((response?.pagination?.count || 0) / pagination.pageSize) || 1;

  const deleteRoleMutation = useDeleteRole();
  const bulkDeleteMutation = useBulkDeleteRoles();
  


  // Debug log to see what we're getting
  React.useEffect(() => {
    if (data.length > 0) {
      console.log('🔍 Total roles loaded:', data.length);
    }
  }, [data]);

  // Row actions for each role
  const rowActions: DataTableRowAction<Role>[] = [
    {
      label: "مشاهده",
      icon: <Eye className="h-4 w-4" />,
      onClick: (role: Role) => {
        window.location.href = `/roles/${role.id}`;
      },
    },
    {
      label: "ویرایش", 
      icon: <Edit className="h-4 w-4" />,
      onClick: (role: Role) => {
        window.location.href = `/roles/${role.id}/edit`;
      },
    },
    {
      label: "حذف",
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (role: Role) => {
        handleDeleteRole(role.id);
      },
    },
  ];

  // Define table columns
  const columns = useRoleColumns(rowActions);

  // Delete role function
  const handleDeleteRole = (roleId: number) => {
    // Check if it's a system role
    const role = data.find(r => r.id === roleId);
    if (role?.is_system_role) {
      toast.warning('نقش‌های سیستمی قابل حذف نیستند');
      return;
    }
    
    setDeleteConfirm({
      open: true,
      roleId: roleId,
      isBulk: false,
    });
  };

  // Bulk delete function - filter out system roles
  const handleDeleteSelected = (selectedIds: (string | number)[]) => {
    // Convert all IDs to numbers for proper comparison
    const numericSelectedIds = selectedIds.map(id => Number(id));
    const selectedRoles = data.filter(role => numericSelectedIds.includes(Number(role.id)));
    const deletableRoles = selectedRoles.filter(role => !role.is_system_role);
    
    if (deletableRoles.length === 0) {
      toast.warning('نقش‌های سیستمی قابل حذف نیستند');
      return;
    }
    
    // If some system roles were selected, warn user
    if (deletableRoles.length < selectedRoles.length) {
      toast.warning(`تنها ${deletableRoles.length} نقش غیرسیستمی حذف خواهد شد`);
    }
    
    setDeleteConfirm({
      open: true,
      roleIds: deletableRoles.map(role => role.id),
      isBulk: true,
    });
  };

  // Confirm delete function
  const handleConfirmDelete = async () => {
    try {
      if (deleteConfirm.isBulk && deleteConfirm.roleIds) {
        await bulkDeleteMutation.mutateAsync(deleteConfirm.roleIds);
        setRowSelection({});
      } else if (!deleteConfirm.isBulk && deleteConfirm.roleId) {
        await deleteRoleMutation.mutateAsync(deleteConfirm.roleId);
      }
    } catch (error) {
      console.error("Delete error:", error);
    }
    setDeleteConfirm({ open: false, isBulk: false });
  };

  // Handle filter changes
  const handleFilterChange = (filterId: string, value: unknown) => {
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
        url.searchParams.set(filterId, String(value));
      } else {
        url.searchParams.delete(filterId);
      }
      url.searchParams.set('page', '1');
      window.history.replaceState({}, '', url.toString());
    }
  };

  // Handle pagination change with URL sync
  const handlePaginationChange: OnChangeFn<PaginationState> = (updaterOrValue) => {
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

  // Show error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="page-title">مدیریت نقش‌ها</h1>
        </div>
        <div className="text-center py-8">
          <p className="text-red-500">خطا در بارگیری داده‌ها</p>
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
            مدیریت نقش‌ها
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" asChild>
            <Link href="/roles/create">
              <Plus />
              ایجاد نقش
            </Link>
          </Button>
        </div>
      </div>

      {/* Data Table */}
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
                ? getConfirmMessage('bulkDeleteRoles', { count: deleteConfirm.roleIds?.length || 0 })
                : getConfirmMessage('deleteRole')
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              لغو
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
