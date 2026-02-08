import { useState, useEffect, useMemo } from "react";
import { useTableFilters } from "@/components/tables/utils/useTableFilters";
import { useNavigate, Link } from "react-router-dom";
import { useAdminFilterOptions } from "@/components/admins/AdminTableFilters";
import { DataTableDateRangeFilter } from "@/components/tables/DataTableDateRangeFilter";
import { realEstateApi } from "@/api/real-estate/properties";
import { showSuccess, showError } from '@/core/toast';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Edit, Trash2, Plus, Search, Building2, Phone } from "lucide-react";
import { Button } from "@/components/elements/Button";
import { Input } from "@/components/elements/Input";
import { ProtectedButton } from "@/core/permissions";
import { CardItem, type CardItemAction } from "@/components/elements/CardItem";
import { mediaService } from "@/components/media/services";
import { formatDate } from "@/core/utils/commonFormat";
import { PaginationControls } from "@/components/shared/paginations/PaginationControls";
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
import { getConfirm } from '@/core/messages';
import type { SortingState } from "@tanstack/react-table";
import type { TablePaginationState } from '@/types/shared/pagination';
import { initSortingFromURL } from "@/components/tables/utils/tableSorting";
import { DataTableFacetedFilterSimple } from "@/components/tables/DataTableFacetedFilterSimple";

interface AgencyFilters {
  search?: string;
  is_active?: boolean;
  date_from?: string;
  date_to?: string;
  date_range?: { from?: string; to?: string };
  [key: string]: unknown;
}

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
    const dateFrom = urlParams.get('date_from');
    const dateTo = urlParams.get('date_to');
    if (dateFrom || dateTo) {
      newClientFilters.date_from = dateFrom || undefined;
      newClientFilters.date_to = dateTo || undefined;
      (newClientFilters as any).date_range = { from: dateFrom || undefined, to: dateTo || undefined };
    }

    if (Object.keys(newClientFilters).length > 0) {
      setClientFilters(newClientFilters);
    }
  }, []);

  const { handleFilterChange: baseHandleFilterChange } = useTableFilters<AgencyFilters>(
    setClientFilters,
    setSearchValue,
    setPagination
  );

  const handleFilterChange = (filterId: keyof AgencyFilters, value: unknown) => {
    baseHandleFilterChange(filterId as string, value);
  };

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
    date_from: (clientFilters.date_range as any)?.from || clientFilters.date_from,
    date_to: (clientFilters.date_range as any)?.to || clientFilters.date_to,
  };

  const { data: response, isLoading, error } = useQuery({
    queryKey: ['agencies', queryParams.search, queryParams.page, queryParams.size, queryParams.order_by, queryParams.order_desc, queryParams.is_active, queryParams.date_from, queryParams.date_to, (clientFilters as any).date_range],
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

  const handleDeleteAgency = (agencyId: number | string) => {
    setDeleteConfirm({
      open: true,
      agencyId: Number(agencyId),
      isBulk: false,
    });
  };

  const handleConfirmDelete = async () => {
    try {
      if (deleteConfirm.agencyId) {
        await deleteAgencyMutation.mutateAsync(deleteConfirm.agencyId);
      }
    } catch (error) {
    }
    setDeleteConfirm({ open: false, isBulk: false });
  };

  const actions = useMemo(() => {
    const agencyActions: CardItemAction<any>[] = [];

    agencyActions.push({
      label: "مشاهده",
      icon: <Search className="h-4 w-4" />,
      onClick: (agency: any) => {
        navigate(`/admins/agencies/${agency.id}/view`);
      },
    });

    agencyActions.push({
      label: "ویرایش",
      icon: <Edit className="h-4 w-4" />,
      onClick: (agency: any) => {
        navigate(`/admins/agencies/${agency.id}/edit`);
      },
    });

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

  const handlePaginationChange = (updaterOrValue: TablePaginationState | ((prev: TablePaginationState) => TablePaginationState)) => {
    const newPagination = typeof updaterOrValue === 'function' ? updaterOrValue(pagination) : updaterOrValue;
    setPagination(newPagination);
    const url = new URL(window.location.href);
    url.searchParams.set('page', String(newPagination.pageIndex + 1));
    url.searchParams.set('size', String(newPagination.pageSize));
    window.history.replaceState({}, '', url.toString());
  };

  if (error) {
    return (
      <CardListLayout title="مدیریت آژانس‌ها">
        <div className="text-center py-8">
          <p className="text-red-1 mb-4">خطا در بارگذاری داده‌ها</p>
          <Button onClick={() => window.location.reload()}>تلاش مجدد</Button>
        </div>
      </CardListLayout>
    );
  }

  return (
    <CardListLayout
      title="مدیریت آژانس‌ها"
      description="لیست آژانس‌های همکار"
      headerActions={
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
      }
      filters={
        <>
          <div className="relative w-full sm:w-[240px]">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-font-s pointer-events-none" />
            <Input
              placeholder="جستجو نام آژانس، شهر..."
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

          <DataTableDateRangeFilter
            title="بازه تاریخ"
            value={(clientFilters as any).date_range || { from: clientFilters.date_from || undefined, to: clientFilters.date_to || undefined }}
            onChange={(range) => {
              handleFilterChange('date_range', range);
              handleFilterChange('date_from', range.from);
              handleFilterChange('date_to', range.to);
            }}
            placeholder="انتخاب بازه تاریخ"
          />
        </>
      }
      stats={!isLoading && `نمایش ${data.length} آژانس${response?.pagination?.count ? ` از ${response.pagination.count}` : ''}`}
      isLoading={isLoading}
      isEmpty={!isLoading && data.length === 0}
      emptyMessage="هیچ آژانسی یافت نشد"
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
                  <div className="flex items-center gap-2 text-sm text-font-s">
                    <Building2 className="size-4 shrink-0" />
                    <span>{agency.city_name || "شهر مشخص نشده"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-font-s">
                    <Phone className="size-4 shrink-0" />
                    <span dir="ltr">{agency.phone || "تلفن ثبت نشده"}</span>
                  </div>
                </>
              }
              onClick={(agency) => {
                navigate(`/admins/agencies/${agency.id}/view`);
              }}
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
              {getConfirm('delete', { item: 'آژانس' })}
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

