import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader/PageHeader";
import { useAdminFilterOptions } from "@/components/admins/AdminTableFilters";
import type { AdminWithProfile, AdminListParams, AdminFilters } from "@/types/auth/admin";
import type { DataTableRowAction } from "@/types/shared/table";
import { useAuth } from "@/core/auth/AuthContext";
import { adminApi } from "@/api/admins/admins";
import { Edit, Trash2, Plus, Search } from "lucide-react";
import { Button } from "@/components/elements/Button";
import { Input } from "@/components/elements/Input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/elements/Select";
import { ProtectedButton } from "@/components/admins/permissions";
import { showSuccess, showError } from '@/core/toast';
import type { SortingState } from "@tanstack/react-table";
import type { TablePaginationState } from '@/types/shared/pagination';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { initSortingFromURL } from "@/components/tables/utils/tableSorting";
import { AdminCard } from "@/components/admins/AdminCard";
import { PaginationControls } from "@/components/shared/Pagination";
import { Loader } from "@/components/elements/Loader";
import { DataTableSelectFilter } from "@/components/tables/DataTableSelectFilter";
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

export default function AdminsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { booleanFilterOptions, roleFilterOptions } = useAdminFilterOptions();

  const [pagination, setPagination] = useState<TablePaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>(() => initSortingFromURL());
  const [searchValue, setSearchValue] = useState("");
  const [clientFilters, setClientFilters] = useState<AdminFilters>({});

  useEffect(() => {
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
    onError: () => {
      showError("خطای سرور");
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (adminIds: number[]) => adminApi.bulkDeleteAdmins(adminIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins'] });
      showSuccess("با موفقیت حذف شد");
    },
    onError: () => {
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
  const isSuperAdmin = user?.is_superuser || false;

  const actions = useMemo(() => {
    const adminActions: DataTableRowAction<AdminWithProfile>[] = [];
    
    adminActions.push({
      label: "ویرایش",
      icon: <Edit className="h-4 w-4" />,
      onClick: (admin: AdminWithProfile) => {
        navigate(`/admins/${admin.id}/edit`);
      },
      isDisabled: (admin: AdminWithProfile) => {
        if (!currentUserId) return true;
        const isOwnProfile = currentUserId === admin.id;
        return !isSuperAdmin && !isOwnProfile;
      },
    });
    
    adminActions.push({
      label: "حذف",
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (admin: AdminWithProfile) => handleDeleteAdmin(admin.id),
      isDestructive: true,
      isDisabled: () => !isSuperAdmin,
    });
    
    return adminActions;
  }, [navigate, currentUserId, isSuperAdmin]);

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

  const handlePaginationChange = (updaterOrValue: TablePaginationState | ((prev: TablePaginationState) => TablePaginationState)) => {
    const newPagination = typeof updaterOrValue === 'function' 
      ? updaterOrValue(pagination) 
      : updaterOrValue;
    
    setPagination(newPagination);
    
    const url = new URL(window.location.href);
    url.searchParams.set('page', String(newPagination.pageIndex + 1));
    url.searchParams.set('size', String(newPagination.pageSize));
    window.history.replaceState({}, '', url.toString());
  };


  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="مدیریت ادمین‌ها" />
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
      <PageHeader title="مدیریت ادمین‌ها">
        <ProtectedButton 
          size="sm" 
          asChild
          permission="admin.create"
          showDenyToast
          denyMessage="شما مجوز ایجاد ادمین ندارید"
        >
          <Link to="/admins/create">
            <Plus />
            افزودن ادمین
          </Link>
        </ProtectedButton>
      </PageHeader>

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4">
        <div className="flex items-center gap-3 flex-wrap flex-1 justify-start">
          <div className="relative w-full sm:w-[240px]">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-font-s pointer-events-none" />
            <Input
              placeholder="جستجو نام، ایمیل..."
              value={searchValue}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pr-10 h-9"
            />
          </div>

          <DataTableSelectFilter
            title="وضعیت"
            placeholder="وضعیت"
            options={booleanFilterOptions}
            value={clientFilters.is_active}
            onChange={(value) => handleFilterChange('is_active', value)}
          />

          <DataTableSelectFilter
            title="نقش"
            placeholder="نقش"
            options={roleFilterOptions}
            value={clientFilters.is_superuser}
            onChange={(value) => handleFilterChange('is_superuser', value)}
          />

          <Select
            value={sorting.length > 0 ? `${sorting[0].id}_${sorting[0].desc ? 'desc' : 'asc'}` : "latest"}
            onValueChange={(value) => {
              const sortMap: Record<string, { id: string; desc: boolean }> = {
                latest: { id: "created_at", desc: true },
                oldest: { id: "created_at", desc: false },
                name_asc: { id: "full_name", desc: false },
                name_desc: { id: "full_name", desc: true },
              };
              const sort = sortMap[value];
              if (sort) {
                setSorting([sort]);
                const url = new URL(window.location.href);
                url.searchParams.set('order_by', sort.id);
                url.searchParams.set('order_desc', String(sort.desc));
                window.history.replaceState({}, '', url.toString());
              }
            }}
          >
            <SelectTrigger className="w-[120px] h-9">
              <SelectValue>
                {sorting.length === 0 ? "جدیدترین" : (
                  sorting[0].id === "created_at" 
                    ? (sorting[0].desc ? "جدیدترین" : "قدیمی‌ترین")
                    : (sorting[0].desc ? "نام (نزولی)" : "نام (صعودی)")
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">جدیدترین</SelectItem>
              <SelectItem value="oldest">قدیمی‌ترین</SelectItem>
              <SelectItem value="name_asc">نام (صعودی)</SelectItem>
              <SelectItem value="name_desc">نام (نزولی)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="text-sm font-medium text-font-p">
          {isLoading ? "در حال بارگذاری..." : `نمایش ${data.length} ادمین${response?.pagination?.count ? ` از ${response.pagination.count}` : ''}`}
        </div>
      </div>

      {/* Cards Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader />
        </div>
      ) : data.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-font-s">هیچ ادمینی یافت نشد</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {data.map((admin) => (
              <AdminCard key={admin.id} admin={admin} actions={actions} />
            ))}
          </div>

          <PaginationControls
            currentPage={pagination.pageIndex + 1}
            totalPages={pageCount}
            onPageChange={(page) => handlePaginationChange({ ...pagination, pageIndex: page - 1 })}
            pageSize={pagination.pageSize}
            onPageSizeChange={(size) => handlePaginationChange({ ...pagination, pageSize: size, pageIndex: 0 })}
            pageSizeOptions={[10, 20, 50]}
            showPageSize={true}
            showInfo={true}
            totalCount={response?.pagination?.count || data.length}
            className="mt-6"
          />
        </>
      )}

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
              className="bg-red-1 text-static-w hover:bg-red-2"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
