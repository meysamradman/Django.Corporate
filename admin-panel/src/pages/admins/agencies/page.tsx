import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader/PageHeader";
import { useAdminFilterOptions } from "@/components/admins/AdminTableFilters";
import { PersianDatePicker } from '@/components/elements/PersianDatePicker';

interface AgencyFilters {
  search?: string;
  is_active?: boolean;
  date_from?: string;
  date_to?: string;
}
import { realEstateApi } from "@/api/real-estate/properties";
import { showSuccess, showError } from '@/core/toast';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Edit, Trash2, Plus, Search, Building2 } from "lucide-react";
import { Button } from "@/components/elements/Button";
import { Input } from "@/components/elements/Input";
import { ProtectedButton } from "@/components/admins/permissions";
import { CardItem, type CardItemAction } from "@/components/elements/CardItem";
import { mediaService } from "@/components/media/services";
import { formatDate } from "@/core/utils/format";
import { PaginationControls } from "@/components/shared/Pagination";
import { Loader } from "@/components/elements/Loader";
import { Badge } from "@/components/elements/Badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/components/elements/AlertDialog";
import { getConfirm } from '@/core/messages';
import type { SortingState } from "@tanstack/react-table";
import type { TablePaginationState } from '@/types/shared/pagination';
import { initSortingFromURL } from "@/components/tables/utils/tableSorting";
import { DataTableSelectFilter } from "@/components/tables/DataTableSelectFilter";

export default function AdminsAgenciesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { booleanFilterOptions } = useAdminFilterOptions();

  const [pagination, setPagination] = useState<TablePaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>(() => initSortingFromURL());
  const [searchValue, setSearchValue] = useState("");
  const [clientFilters, setClientFilters] = useState<AgencyFilters>({});

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
    agencyId?: number;
    agencyIds?: number[];
    isBulk: boolean;
  }>({
    open: false,
    isBulk: false,
  });

  const queryParams = {
    search: searchValue,
    page: pagination.pageIndex + 1,
    size: pagination.pageSize,
    order_by: sorting.length > 0 ? sorting[0].id : "created_at",
    order_desc: sorting.length > 0 ? sorting[0].desc : true,
    is_active: clientFilters.is_active,
    date_from: clientFilters.date_from,
    date_to: clientFilters.date_to,
  };

  const { data: response, isLoading, error } = useQuery({
    queryKey: ['agencies', queryParams.search, queryParams.page, queryParams.size, queryParams.order_by, queryParams.order_desc, queryParams.is_active, queryParams.date_from, queryParams.date_to],
    queryFn: async () => {
      return await realEstateApi.getAgencies(queryParams);
    },
    staleTime: 0,
  });

  const data = response?.data || [];
  const pageCount = response?.pagination?.total_pages || 1;

  const deleteAgencyMutation = useMutation({
    mutationFn: (agencyId: number) => realEstateApi.deleteAgency(agencyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agencies'] });
      showSuccess("با موفقیت حذف شد");
    },
    onError: () => {
      showError("خطای سرور");
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (agencyIds: number[]) => Promise.all(agencyIds.map(id => realEstateApi.deleteAgency(id))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agencies'] });
      showSuccess("با موفقیت حذف شد");
    },
    onError: () => {
      showError("خطای سرور");
    },
  });

  const handleDeleteAgency = (agencyId: number | string) => {
    setDeleteConfirm({
      open: true,
      agencyId: Number(agencyId),
      isBulk: false,
    });
  };

  const handleConfirmDelete = async () => {
    try {
      if (deleteConfirm.isBulk && deleteConfirm.agencyIds) {
        await bulkDeleteMutation.mutateAsync(deleteConfirm.agencyIds);
      } else if (!deleteConfirm.isBulk && deleteConfirm.agencyId) {
        await deleteAgencyMutation.mutateAsync(deleteConfirm.agencyId);
      }
    } catch (error) {
    }
    setDeleteConfirm({ open: false, isBulk: false });
  };

  const actions = useMemo(() => {
    const agencyActions: CardItemAction<any>[] = [];

    // Add View action
    agencyActions.push({
      label: "مشاهده",
      icon: <Edit className="h-4 w-4" />,
      onClick: (agency: any) => {
        navigate(`/admins/agencies/${agency.id}/view`);
      },
    });

    // Add Edit action
    agencyActions.push({
      label: "ویرایش",
      icon: <Edit className="h-4 w-4" />,
      onClick: (agency: any) => {
        navigate(`/admins/agencies/${agency.id}/edit`);
      },
    });

    // Add Delete action
    agencyActions.push({
      label: "حذف",
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (agency: any) => handleDeleteAgency(agency.id),
      isDestructive: true,
    });

    return agencyActions;
  }, [navigate]);

  const getAgencyFullName = (agency: any) => {
    return agency.name || "";
  };

  const getAgencyInitial = (agency: any) => {
    const name = agency.name || "";
    return name ? name.charAt(0).toUpperCase() : "آ";
  };

  const getAgencyAvatarUrl = (agency: any) => {
    return agency.logo
      ? mediaService.getMediaUrlFromObject(agency.logo)
      : null;
  };

  const handleFilterChange = (filterId: keyof AgencyFilters, value: unknown) => {
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
      const actualValue = value;

      setClientFilters(prev => ({
        ...prev,
        [filterId]: actualValue
      }));
      setPagination(prev => ({ ...prev, pageIndex: 0 }));

      const url = new URL(window.location.href);
      if (actualValue !== undefined && actualValue !== null) {
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
        <PageHeader title="مدیریت آژانس‌ها" />
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
      <PageHeader title="مدیریت آژانس‌ها">
        <ProtectedButton
          size="sm"
          asChild
          permission="real-estate-agency.create"
          showDenyToast
          denyMessage="شما مجوز ایجاد آژانس ندارید"
        >
          <Link to="/admins/agencies/create">
            <Plus />
            افزودن آژانس
          </Link>
        </ProtectedButton>
      </PageHeader>

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4">
        <div className="flex items-center gap-3 flex-wrap flex-1 justify-start">
          <div className="relative w-full sm:w-[240px]">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-font-s pointer-events-none" />
            <Input
              placeholder="جستجو نام آژانس، شهر..."
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

          <div className="flex items-center gap-2">
            <PersianDatePicker
              value={clientFilters.date_from || ''}
              onChange={(date) => handleFilterChange('date_from', date)}
              placeholder="از تاریخ"
              className="h-9 w-36"
            />
            <span className="text-xs text-font-s">تا</span>
            <PersianDatePicker
              value={clientFilters.date_to || ''}
              onChange={(date) => handleFilterChange('date_to', date)}
              placeholder="تا تاریخ"
              className="h-9 w-36"
            />
          </div>
        </div>

        <div className="text-sm font-medium text-font-p">
          {isLoading ? "در حال بارگذاری..." : `نمایش ${data.length} آژانس${response?.pagination?.count ? ` از ${response.pagination.count}` : ''}`}
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
            هیچ آژانسی یافت نشد
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {data.map((agency) => {
              const fullName = getAgencyFullName(agency);
              const initial = getAgencyInitial(agency);
              const avatarUrl = getAgencyAvatarUrl(agency);
              const createdDate = agency.created_at ? formatDate(agency.created_at) : "-";

              return (
                <CardItem
                  key={agency.id}
                  item={agency}
                  avatar={{
                    src: avatarUrl || undefined,
                    fallback: initial,
                    alt: fullName,
                  }}
                  title={fullName}
                  status={{
                    label: agency.is_active ? "فعال" : "غیرفعال",
                    variant: agency.is_active ? "green" : "red",
                  }}
                  actions={actions}
                  content={
                    <>
                      <div className="mb-3">
                        <Badge variant="blue" className="flex items-center gap-1 text-xs w-fit">
                          <Building2 className="size-3" />
                          آژانس املاک
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div className="text-right">
                          <p className="text-xs text-font-s mb-1">رتبه</p>
                          <p className="text-sm font-medium text-font-p">
                            {agency.rating ? `${agency.rating}/5` : "-"}
                          </p>
                        </div>
                        <div className="text-left">
                          <p className="text-xs text-font-s mb-1">تاریخ ثبت</p>
                          <p className="text-sm font-medium text-font-p">{createdDate}</p>
                        </div>
                      </div>
                    </>
                  }
                  footer={
                    <>
                      {agency.city_name ? (
                        <div className="flex items-center gap-2 text-sm text-font-s">
                          <Building2 className="size-4 shrink-0" />
                          <span>{agency.city_name}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-font-s">
                          <Building2 className="size-4 shrink-0" />
                          <span>شهر مشخص نشده</span>
                        </div>
                      )}
                      {agency.phone ? (
                        <div className="flex items-center gap-2 text-sm text-font-s">
                          <span dir="ltr">{agency.phone}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-font-s">
                          <span>تلفن ثبت نشده</span>
                        </div>
                      )}
                    </>
                  }
                  onClick={(agency) => {
                    navigate(`/admins/agencies/${agency.id}/view`);
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
          <AlertDialogTitle>تایید حذف</AlertDialogTitle>
          <AlertDialogDescription>
            {deleteConfirm.isBulk
              ? getConfirm('bulkDelete', { item: 'آژانس', count: deleteConfirm.agencyIds?.length || 0 })
              : getConfirm('delete', { item: 'آژانس' })
            }
          </AlertDialogDescription>
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


