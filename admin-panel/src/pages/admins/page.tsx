import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader/PageHeader";
import { useAdminFilterOptions } from "@/components/admins/AdminTableFilters";
import { PersianDatePicker } from '@/components/elements/PersianDatePicker';
import type { AdminWithProfile, AdminListParams, AdminFilters } from "@/types/auth/admin";
import { useAuth } from "@/core/auth/AuthContext";
import { adminApi } from "@/api/admins/admins";
import { Edit, Trash2, Plus, Search, Building2, UserCog } from "lucide-react";
import { Button } from "@/components/elements/Button";
import { Input } from "@/components/elements/Input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/elements/Select";
import { ProtectedButton } from "@/components/admins/permissions";
import { showSuccess, showError } from '@/core/toast';
import type { SortingState } from "@tanstack/react-table";
import type { TablePaginationState } from '@/types/shared/pagination';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { initSortingFromURL } from "@/components/tables/utils/tableSorting";
import { CardItem, type CardItemAction } from "@/components/elements/CardItem";
import { mediaService } from "@/components/media/services";
import { formatDate } from "@/core/utils/format";
import { Mail, Phone } from "lucide-react";
import { getPermissionTranslation } from "@/core/messages/permissions";
import { PaginationControls } from "@/components/shared/Pagination";
import { Loader } from "@/components/elements/Loader";
import { DataTableSelectFilter } from "@/components/tables/DataTableSelectFilter";
import { getConfirm } from '@/core/messages';
import { Badge } from "@/components/elements/Badge";
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
  const { booleanFilterOptions, roleFilterOptions, userRoleTypeOptions } = useAdminFilterOptions();

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
    if (urlParams.get('user_role_type')) {
      const userRoleType = urlParams.get('user_role_type');
      // فقط مقادیر 'admin' و 'consultant' رو بپذیریم، نه 'all'
      if (userRoleType === 'admin' || userRoleType === 'consultant') {
        newClientFilters.user_role_type = userRoleType;
      }
    }
    if (urlParams.get('date_from')) {
      newClientFilters.date_from = urlParams.get('date_from')!;
    }
    if (urlParams.get('date_to')) {
      newClientFilters.date_to = urlParams.get('date_to')!;
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
    date_from: clientFilters.date_from as string | undefined,
    date_to: clientFilters.date_to as string | undefined,
    ...(clientFilters.user_role_type && { user_role_type: clientFilters.user_role_type }),
  };

  const { data: response, isLoading, error } = useQuery({
    queryKey: ['admins', queryParams.search, queryParams.page, queryParams.size, queryParams.order_by, queryParams.order_desc, queryParams.is_active, queryParams.is_superuser, queryParams.user_role_type, queryParams.date_from, queryParams.date_to],
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
    const adminActions: CardItemAction<AdminWithProfile>[] = [];
    
    // Add View action
    adminActions.push({
      label: "مشاهده",
      icon: <Edit className="h-4 w-4" />,
      onClick: (admin: AdminWithProfile) => {
        // چک کنیم آیا پروفایل خودش هست
        const isOwnProfile = currentUserId === admin.id;
        const isConsultant = !admin.is_superuser && (admin.user_role_type === 'consultant' || admin.has_agent_profile);
        
        if (isOwnProfile) {
          // اگه پروفایل خودشه، به ME view میریم (در حال حاضر view جدا نداریم، پس به edit میریم)
          if (isConsultant) {
            navigate('/admins/me-consultant/edit');
          } else {
            navigate('/admins/me/edit');
          }
        } else {
          // اگه پروفایل دیگران، به route معمولی view میریم
          if (isConsultant) {
            navigate(`/admins/consultants/${admin.id}/view`);
          } else {
            navigate(`/admins/${admin.id}/view`);
          }
        }
      },
    });
    
    adminActions.push({
      label: "ویرایش",
      icon: <Edit className="h-4 w-4" />,
      onClick: (admin: AdminWithProfile) => {
        // چک کنیم آیا پروفایل خودش هست
        const isOwnProfile = currentUserId === admin.id;
        const isConsultant = !admin.is_superuser && (admin.user_role_type === 'consultant' || admin.has_agent_profile);
        
        if (isOwnProfile) {
          // اگه پروفایل خودشه، به ME میریم
          if (isConsultant) {
            navigate('/admins/me-consultant/edit');
          } else {
            navigate('/admins/me/edit');
          }
        } else {
          // اگه پروفایل دیگران، به route معمولی میریم
          if (isConsultant) {
            navigate(`/admins/consultants/${admin.id}/edit`);
          } else {
            navigate(`/admins/${admin.id}/edit`);
          }
        }
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
      const actualValue = (filterId === 'user_role_type' && value === 'all') ? undefined : value;
      
      setClientFilters(prev => ({
        ...prev,
        [filterId]: actualValue as any
      }));
      setPagination(prev => ({ ...prev, pageIndex: 0 }));
      
      const url = new URL(window.location.href);
      if (actualValue !== undefined && actualValue !== null && actualValue !== 'all') {
        url.searchParams.set(String(filterKey), String(actualValue));
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
            title="نوع کاربر"
            placeholder="نوع کاربر"
            options={userRoleTypeOptions}
            value={clientFilters.user_role_type}
            onChange={(value) => handleFilterChange('user_role_type', value)}
          />

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

          <div className="flex items-center gap-2">
            <PersianDatePicker
              value={clientFilters.date_from as string || ''}
              onChange={(date) => handleFilterChange('date_from', date)}
              placeholder="از تاریخ"
              className="h-9 w-36"
            />
            <span className="text-xs text-font-s">تا</span>
            <PersianDatePicker
              value={clientFilters.date_to as string || ''}
              onChange={(date) => handleFilterChange('date_to', date)}
              placeholder="تا تاریخ"
              className="h-9 w-36"
            />
          </div>
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
          <p className="text-font-s">
            {clientFilters.user_role_type === 'consultant' 
              ? 'هیچ مشاوری یافت نشد' 
              : 'هیچ ادمینی یافت نشد'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {data.map((admin) => {
              const fullName = getAdminFullName(admin);
              const initial = getAdminInitial(admin);
              const avatarUrl = getAdminAvatarUrl(admin);
              const roleDisplay = getAdminRoleDisplay(admin);
              const createdDate = admin.created_at ? formatDate(admin.created_at) : "-";
              // سوپرادمین همیشه admin هست
              const isConsultant = !admin.is_superuser && (admin.user_role_type === 'consultant' || admin.has_agent_profile);

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
                        {isConsultant ? (
                          <Badge variant="blue" className="flex items-center gap-1 text-xs w-fit">
                            <Building2 className="size-3" />
                            مشاور املاک
                          </Badge>
                        ) : (
                          <Badge variant="purple" className="flex items-center gap-1 text-xs w-fit">
                            <UserCog className="size-3" />
                            ادمین
                          </Badge>
                        )}
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
                      {admin.mobile ? (
                        <div className="flex items-center gap-2 text-sm text-font-s">
                          <Phone className="size-4 shrink-0" />
                          <span dir="ltr">{admin.mobile}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-font-s">
                          <Phone className="size-4 shrink-0" />
                          <span>-</span>
                        </div>
                      )}
                      {admin.email ? (
                        <div className="flex items-center gap-2 text-sm text-font-s">
                          <Mail className="size-4 shrink-0" />
                          <span className="truncate" dir="ltr">{admin.email}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-font-s">
                          <Mail className="size-4 shrink-0" />
                          <span>وارد نشده</span>
                        </div>
                      )}
                    </>
                  }
                  onClick={(admin) => {
                    // چک کنیم آیا پروفایل خودش هست
                    const isOwnProfile = currentUserId === admin.id;
                    const isConsultant = !admin.is_superuser && (admin.user_role_type === 'consultant' || admin.has_agent_profile);
                    
                    if (isOwnProfile) {
                      // اگه پروفایل خودشه، به ME view میریم (در حال حاضر view جدا نداریم، پس به edit میریم)
                      if (isConsultant) {
                        navigate('/admins/me-consultant/edit');
                      } else {
                        navigate('/admins/me/edit');
                      }
                    } else {
                      // اگه پروفایل دیگران، به route معمولی view میریم
                      if (isConsultant) {
                        navigate(`/admins/consultants/${admin.id}/view`);
                      } else {
                        navigate(`/admins/${admin.id}/view`);
                      }
                    }
                  }}
                />
              );
            })}
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
