import { useState, useEffect, useMemo } from "react";
import { useTableFilters } from "@/components/tables/utils/useTableFilters";
import { useNavigate, Link } from "react-router-dom";
import { useAdminFilterOptions } from "@/components/admins/AdminTableFilters";
import { DataTableDateRangeFilter } from "@/components/tables/DataTableDateRangeFilter";
import type { AdminWithProfile, AdminListParams, AdminFilters } from "@/types/auth/admin";
import { useAuth } from "@/core/auth/AuthContext";
import { adminApi } from "@/api/admins/admins";
import { Edit, Trash2, Plus, Search, Building2, Mail, Phone } from "lucide-react";
import { Button } from "@/components/elements/Button";
import { Input } from "@/components/elements/Input";
import { showSuccess, showError } from '@/core/toast';
import type { SortingState } from "@tanstack/react-table";
import type { TablePaginationState } from '@/types/shared/pagination';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { initSortingFromURL } from "@/components/tables/utils/tableSorting";
import { CardItem, type CardItemAction } from "@/components/elements/CardItem";
import { mediaService } from "@/components/media/services";
import { formatDate } from "@/core/utils/format";
import { getPermissionTranslation } from "@/core/messages/permissions";
import { PaginationControls } from "@/components/shared/Pagination";
import { DataTableFacetedFilterSimple } from "@/components/tables/DataTableFacetedFilterSimple";
import { getConfirm } from '@/core/messages';
import { Badge } from "@/components/elements/Badge";
import { CardListLayout } from "@/components/templates/CardListLayout";
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

export default function AgentsPage() {
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
  const [clientFilters, setClientFilters] = useState<AdminFilters>({
    user_role_type: 'consultant', // فقط مشاورین
  });

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

    const newClientFilters: typeof clientFilters = {
      user_role_type: 'consultant', // همیشه مشاور
    };
    if (urlParams.get('is_active') !== null) {
      newClientFilters.is_active = urlParams.get('is_active') === 'true';
    }
    if (urlParams.get('is_superuser') !== null) {
      newClientFilters.is_superuser = urlParams.get('is_superuser') === 'true';
    }
    const dateFrom = urlParams.get('date_from');
    const dateTo = urlParams.get('date_to');
    if (dateFrom || dateTo) {
      newClientFilters.date_from = dateFrom || undefined;
      newClientFilters.date_to = dateTo || undefined;
      (newClientFilters as any).date_range = { from: dateFrom || undefined, to: dateTo || undefined };
    }

    setClientFilters(newClientFilters);
  }, []);

  const { handleFilterChange: baseHandleFilterChange } = useTableFilters<AdminFilters>(
    setClientFilters,
    setSearchValue,
    setPagination
  );

  const handleFilterChange = (filterId: keyof AdminFilters, value: unknown) => {
    if (filterId === 'user_role_type') {
      return;
    } else {
      baseHandleFilterChange(filterId as string, value);
    }
  };

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
    date_from: ((clientFilters as any).date_range?.from || clientFilters.date_from) as string | undefined,
    date_to: ((clientFilters as any).date_range?.to || clientFilters.date_to) as string | undefined,
    user_role_type: 'consultant', // همیشه مشاور
  };

  const { data: response, isLoading, error } = useQuery({
    queryKey: ['agents', queryParams.search, queryParams.page, queryParams.size, queryParams.order_by, queryParams.order_desc, queryParams.is_active, queryParams.is_superuser, queryParams.date_from, queryParams.date_to, (clientFilters as any).date_range],
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
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      queryClient.invalidateQueries({ queryKey: ['admins'] });
      showSuccess("با موفقیت حذف شد");
    },
    onError: () => {
      showError("خطای سرور");
    },
  });

  const handleConfirmDelete = async () => {
    try {
      if (deleteConfirm.adminId) {
        await deleteAdminMutation.mutateAsync(deleteConfirm.adminId);
      }
    } catch (error) {
    }
    setDeleteConfirm({ open: false, isBulk: false });
  };

  const currentUserId = user?.id;
  const isSuperAdmin = user?.is_superuser || false;

  const handleEditAdmin = (admin: AdminWithProfile) => {
    const userId = user?.id ? Number(user.id) : null;
    const targetId = admin?.id ? Number(admin.id) : null;
    const isOwnProfile = userId !== null && targetId !== null && userId === targetId;

    const currentUserIsAgent = user?.user_role_type === 'consultant' || user?.has_agent_profile;

    if (isOwnProfile && currentUserIsAgent) {
      navigate('/agents/me/edit');
    } else {
      navigate(`/agents/${admin.id}/edit`);
    }
  };

  const actions = useMemo(() => {
    const adminActions: CardItemAction<AdminWithProfile>[] = [];

    adminActions.push({
      label: "ویرایش",
      icon: <Edit className="h-4 w-4" />,
      onClick: (admin: AdminWithProfile) => {
        handleEditAdmin(admin);
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
      onClick: (admin: AdminWithProfile) => {
        setDeleteConfirm({
          open: true,
          adminId: Number(admin.id),
          isBulk: false,
        });
      },
      isDestructive: true,
      isDisabled: () => !isSuperAdmin,
    });

    return adminActions;
  }, [navigate, currentUserId, isSuperAdmin]);

  const getAdminFullName = (admin: AdminWithProfile) => {
    const profile = admin.profile;
    return admin.full_name ||
      `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() ||
      admin.email ||
      admin.mobile ||
      '';
  };

  const getAdminInitial = (admin: AdminWithProfile) => {
    const profile = admin.profile;
    const firstName = profile?.first_name || "";
    const lastName = profile?.last_name || "";
    return (!firstName && !lastName) ? "؟" : `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getAdminAvatarUrl = (admin: AdminWithProfile) => {
    const profile = admin.profile;
    return profile?.profile_picture
      ? mediaService.getMediaUrlFromObject(profile.profile_picture)
      : null;
  };

  const getAdminRoleDisplay = (admin: AdminWithProfile) => {
    if (admin.is_superuser) {
      return getPermissionTranslation('super_admin', 'role') || "سوپر ادمین";
    }
    const roles = admin.roles || [];
    if (roles.length > 0) {
      const roleNames = roles.map((role: any) => {
        if (typeof role === 'string') {
          return getPermissionTranslation(role, 'role') || role;
        }
        if (role.is_system_role) {
          return getPermissionTranslation(role.name, 'role') || role.display_name || role.name;
        }
        return role.display_name || role.name;
      });
      return roleNames.join(", ");
    }
    return null;
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
      <CardListLayout title="مدیریت مشاورین املاک">
        <div className="text-center py-8">
          <p className="text-red-1 mb-4">خطا در بارگذاری داده‌ها</p>
          <Button onClick={() => window.location.reload()}>تلاش مجدد</Button>
        </div>
      </CardListLayout>
    );
  }

  return (
    <CardListLayout
      title="مدیریت مشاورین املاک"
      description="لیست مشاورین املاک فعال در سیستم"
      headerActions={isSuperAdmin && (
        <Button size="sm" asChild>
          <Link to="/admins/create">
            <Plus />
            افزودن مشاور
          </Link>
        </Button>
      )}
      filters={
        <>
          <div className="relative w-full sm:w-[240px]">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-font-s pointer-events-none" />
            <Input
              placeholder="جستجو نام، ایمیل..."
              value={searchValue}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pr-10 h-9"
            />
          </div>

          <DataTableFacetedFilterSimple
            title="وضعیت"
            options={booleanFilterOptions}
            value={clientFilters.is_active}
            onChange={(value) => handleFilterChange('is_active', value)}
            multiSelect={false}
            showSearch={false}
          />

          <DataTableFacetedFilterSimple
            title="نقش"
            options={roleFilterOptions}
            value={clientFilters.is_superuser}
            onChange={(value) => handleFilterChange('is_superuser', value)}
            multiSelect={false}
            showSearch={false}
          />

          <DataTableDateRangeFilter
            title="بازه تاریخ"
            value={(clientFilters as any).date_range || { from: clientFilters.date_from as string || undefined, to: clientFilters.date_to as string || undefined }}
            onChange={(range) => {
              handleFilterChange('date_range', range);
              handleFilterChange('date_from', range.from);
              handleFilterChange('date_to', range.to);
            }}
            placeholder="انتخاب بازه تاریخ"
          />
        </>
      }
      stats={!isLoading && `نمایش ${data.length} مشاور${response?.pagination?.count ? ` از ${response.pagination.count}` : ''}`}
      isLoading={isLoading}
      isEmpty={!isLoading && data.length === 0}
      emptyMessage="هیچ مشاوری یافت نشد"
      pagination={
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
        />
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {data.map((admin) => {
          const fullName = getAdminFullName(admin);
          const initial = getAdminInitial(admin);
          const avatarUrl = getAdminAvatarUrl(admin);
          const roleDisplay = getAdminRoleDisplay(admin);
          const createdDate = admin.created_at ? formatDate(admin.created_at) : "-";

          return (
            <CardItem
              key={admin.id}
              item={admin}
              avatar={{
                src: avatarUrl || undefined,
                fallback: initial,
                alt: fullName,
              }}
              title={fullName}
              status={{
                label: admin.is_active ? "فعال" : "مرخصی",
                variant: admin.is_active ? "green" : "red",
              }}
              actions={actions}
              content={
                <>
                  <div className="mb-3">
                    <Badge variant="blue" className="flex items-center gap-1 text-xs w-fit">
                      <Building2 className="size-3" />
                      مشاور املاک
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div className="text-right">
                      <p className="text-xs text-font-s mb-1">نقش</p>
                      <p className="text-sm font-medium text-font-p">{roleDisplay || "بدون نقش"}</p>
                    </div>
                    <div className="text-left">
                      <p className="text-xs text-font-s mb-1">تاریخ استخدام</p>
                      <p className="text-sm font-medium text-font-p">{createdDate}</p>
                    </div>
                  </div>
                </>
              }
              footer={
                <>
                  <div className="flex items-center gap-2 text-sm text-font-s">
                    <Phone className="size-4 shrink-0" />
                    <span dir="ltr">{admin.mobile || "-"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-font-s">
                    <Mail className="size-4 shrink-0" />
                    <span className="truncate" dir="ltr">{admin.email || "وارد نشده"}</span>
                  </div>
                </>
              }
              onClick={(admin) => handleEditAdmin(admin)}
            />
          );
        })}
      </div>

      <AlertDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm(prev => ({ ...prev, open }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تایید حذف</AlertDialogTitle>
            <AlertDialogDescription>
              {getConfirm('delete', { item: 'مشاور' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>لغو</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-0 text-red-1 border border-red-1 hover:bg-red-1 hover:text-wt transition-colors"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </CardListLayout>
  );
}

