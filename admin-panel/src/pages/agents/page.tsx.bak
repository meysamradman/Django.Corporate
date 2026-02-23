import { useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAdminFilterOptions } from "@/components/admins/AdminTableFilters";
import { DataTableDateRangeFilter } from "@/components/tables/DataTableDateRangeFilter";
import type { AdminWithProfile, AdminListParams } from "@/types/auth/admin";
import { useAuth } from "@/core/auth/AuthContext";
import { adminApi } from "@/api/admins/admins";
import { Edit, Eye, Trash2, Plus, Search, Building2, Mail, Phone } from "lucide-react";
import { Button } from "@/components/elements/Button";
import { Input } from "@/components/elements/Input";
import { useQuery } from "@tanstack/react-query";
import { CardItem, type CardItemAction } from "@/components/elements/CardItem";
import { mediaService } from "@/components/media/services";
import { formatDate } from "@/core/utils/commonFormat";
import { getPermissionTranslation } from "@/core/messages/permissions";
import { PaginationControls } from "@/components/shared/paginations/PaginationControls";
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
import { useAgentsListTableState } from "@/components/admins/hooks/useAgentsListTableState";
import { useAgentsListActions } from "@/components/admins/hooks/useAgentsListActions";

export default function AgentsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { booleanFilterOptions, roleFilterOptions } = useAdminFilterOptions();

  const {
    pagination,
    sorting,
    searchValue,
    clientFilters,
    handleFilterChange,
    handlePaginationChange,
  } = useAgentsListTableState();

  const {
    deleteConfirm,
    setDeleteConfirm,
    handleDeleteAdmin,
    handleConfirmDelete,
  } = useAgentsListActions();

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

  const currentUserId = user?.id;
  const isSuperAdmin = user?.is_superuser || false;

  const handleEditAdmin = (admin: AdminWithProfile) => {
    const userId = user?.id ? Number(user.id) : null;
    const targetId = admin?.id ? Number(admin.id) : null;
    const isOwnProfile = userId !== null && targetId !== null && userId === targetId;

    const currentUserIsAgent = user?.user_role_type === 'consultant' || user?.has_agent_profile;

    if (isOwnProfile && currentUserIsAgent) {
      navigate('/agents/me/view');
    } else {
      navigate(`/agents/${admin.id}/edit`);
    }
  };

  const handleViewAdmin = (admin: AdminWithProfile) => {
    const userId = user?.id ? Number(user.id) : null;
    const targetId = admin?.id ? Number(admin.id) : null;
    const isOwnProfile = userId !== null && targetId !== null && userId === targetId;

    const currentUserIsAgent = user?.user_role_type === 'consultant' || user?.has_agent_profile;

    if (isOwnProfile && currentUserIsAgent) {
      navigate('/agents/me/view');
    } else {
      navigate(`/agents/${admin.id}/view`);
    }
  };

  const actions = useMemo(() => {
    const adminActions: CardItemAction<AdminWithProfile>[] = [];

    adminActions.push({
      label: "مشاهده",
      icon: <Eye className="h-4 w-4" />,
      onClick: (admin: AdminWithProfile) => {
        handleViewAdmin(admin);
      },
    });

    adminActions.push({
      label: "ویرایش",
      icon: <Edit className="h-4 w-4" />,
      onClick: (admin: AdminWithProfile) => {
        handleEditAdmin(admin);
      },
      isDisabled: (admin: AdminWithProfile) => {
        if (!currentUserId) return true;
        const isOwnProfile = Number(currentUserId) === Number(admin.id);
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
  }, [currentUserId, handleDeleteAdmin, isSuperAdmin, navigate, user]);

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
          <div className="relative w-full sm:w-60">
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
              onClick={(admin) => handleViewAdmin(admin)}
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

