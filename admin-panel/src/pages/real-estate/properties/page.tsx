import { useState, useEffect, lazy, Suspense } from "react";
import { useTableFilters } from "@/components/tables/utils/useTableFilters";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader/PageHeader";
import { usePropertyColumns } from "@/components/real-estate/list/RealEstateTableColumns";
import { usePropertyFilterOptions, getPropertyFilterConfig } from "@/components/real-estate/list/RealEstateTableFilters";
import type { PropertyFilters } from "@/types/real_estate/realEstateListParams";
import { Edit, Trash2, Plus, Eye, FileText } from "lucide-react";
import { Button } from "@/components/elements/Button";
import { ProtectedButton } from "@/core/permissions";
import { showError, showSuccess, showWarning } from '@/core/toast';
import type { OnChangeFn, SortingState } from "@tanstack/react-table";
import type { TablePaginationState } from '@/types/shared/pagination';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { initSortingFromURL } from "@/components/tables/utils/tableSorting";

const DataTable = lazy(() => import("@/components/tables/DataTable").then(mod => ({ default: mod.DataTable })));
import { msg, getConfirm, getStatus } from '@/core/messages';
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

import type { Property } from "@/types/real_estate/realEstate";
import type { ColumnDef } from "@tanstack/react-table";
import { realEstateApi } from "@/api/real-estate";
import { usePropertyPrintView } from "@/hooks/real-estate/usePropertyPrintView";
import type { DataTableRowAction } from "@/types/shared/table";
import type { PropertyType } from "@/types/real_estate/type/propertyType";
import type { PropertyState } from "@/types/real_estate/state/realEstateState";
import type { CategoryItem } from "@/types/shared/table";
import { usePropertyExcelExport } from "@/hooks/real-estate/usePropertyExcelExport";
import { usePropertyPdfExport } from "@/hooks/real-estate/usePropertyPdfExport";

const convertPropertyTypesToHierarchical = (types: PropertyType[]): CategoryItem[] => {
  const rootTypes = types.filter(type => !type.parent_id);

  const buildTree = (type: PropertyType): CategoryItem => {
    const children = types.filter(t => t.parent_id === type.id);

    return {
      id: type.id,
      label: type.title,
      value: type.id.toString(),
      parent_id: type.parent_id,
      children: children.map(buildTree)
    };
  };

  return rootTypes.map(buildTree);
};

export default function PropertyPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { booleanFilterOptions } = usePropertyFilterOptions();

  const [_propertyTypes, setPropertyTypes] = useState<PropertyType[]>([]);
  const [propertyTypeOptions, setPropertyTypeOptions] = useState<CategoryItem[]>([]);

  const [_states, setStates] = useState<PropertyState[]>([]);
  const [stateOptions, setStateOptions] = useState<{ label: string; value: string }[]>([]);

  const [cityOptions, setCityOptions] = useState<{ label: string; value: string }[]>([]);
  const [statusOptions, setStatusOptions] = useState<{ label: string; value: string }[]>([]);

  const [pagination, setPagination] = useState<TablePaginationState>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const page = parseInt(urlParams.get('page') || '1', 10);
      const size = parseInt(urlParams.get('size') || '10', 10);
      return {
        pageIndex: Math.max(0, page - 1),
        pageSize: size,
      };
    }
    return {
      pageIndex: 0,
      pageSize: 10,
    };
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
  const [clientFilters, setClientFilters] = useState<PropertyFilters>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const filters: PropertyFilters = {};
      if (urlParams.get('is_published')) filters.is_published = urlParams.get('is_published') === 'true';
      if (urlParams.get('is_featured')) filters.is_featured = urlParams.get('is_featured') === 'true';
      if (urlParams.get('is_active')) filters.is_active = urlParams.get('is_active') === 'true';
      if (urlParams.get('property_type')) filters.property_type = parseInt(urlParams.get('property_type') || '0');
      if (urlParams.get('state')) filters.state = parseInt(urlParams.get('state') || '0');
      if (urlParams.get('city')) filters.city = parseInt(urlParams.get('city') || '0');
      if (urlParams.get('status')) filters.status = urlParams.get('status') || undefined;
      if (urlParams.get('date_from')) filters.date_from = urlParams.get('date_from') || undefined;
      if (urlParams.get('date_to')) filters.date_to = urlParams.get('date_to') || undefined;
      return filters;
    }
    return {};
  });

  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    propertyId?: number;
    propertyIds?: number[];
    isBulk: boolean;
  }>({
    open: false,
    isBulk: false,
  });

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [typesResponse, statesResponse, citiesResponse] = await Promise.all([
          realEstateApi.getTypes({ page: 1, size: 1000, is_active: true }),
          realEstateApi.getStates({ page: 1, size: 1000, is_active: true }),
          realEstateApi.getCitiesWithProperties(),
        ]);

        setPropertyTypes(typesResponse.data);
        setPropertyTypeOptions(convertPropertyTypesToHierarchical(typesResponse.data));

        setStates(statesResponse.data);
        setStateOptions(statesResponse.data.map((s: PropertyState) => ({ label: s.title, value: s.id.toString() })));

        setCityOptions(citiesResponse.map(city => ({
          label: `${city.name} (${(city as any).property_count || 0} ملک)`,
          value: city.id.toString()
        })));

        const fieldOptions = await realEstateApi.getFieldOptions();
        if (fieldOptions.status) {
          setStatusOptions(fieldOptions.status.map(([value, label]) => ({ label, value })));
        }
      } catch (error) {
      }
    };

    fetchOptions();
  }, []);

  const { handleFilterChange } = useTableFilters<PropertyFilters>(
    setClientFilters,
    setSearchValue,
    setPagination,
    {
      property_type: (value, updateUrl) => {
        const numValue = value ? (typeof value === 'string' ? parseInt(value) : value) : undefined;
        setClientFilters(prev => ({
          ...prev,
          property_type: numValue as number | undefined
        }));
        setPagination(prev => ({ ...prev, pageIndex: 0 }));

        const url = new URL(window.location.href);
        if (numValue && numValue !== 0) {
          url.searchParams.set('property_type', String(numValue));
        } else {
          url.searchParams.delete('property_type');
        }
        updateUrl(url);
      },
      status: (value, updateUrl) => {
        const statusValue = value ? (typeof value === 'string' ? value : String(value)) : undefined;
        setClientFilters(prev => ({
          ...prev,
          status: statusValue as string | undefined
        }));
        setPagination(prev => ({ ...prev, pageIndex: 0 }));

        const url = new URL(window.location.href);
        if (statusValue && statusValue !== '') {
          url.searchParams.set('status', statusValue);
        } else {
          url.searchParams.delete('status');
        }
        updateUrl(url);
      }
    }
  );

  const propertyFilterConfig = getPropertyFilterConfig(
    booleanFilterOptions,
    propertyTypeOptions,
    stateOptions,
    cityOptions,
    statusOptions
  );

  const queryParams = {
    search: searchValue,
    page: pagination.pageIndex + 1,
    size: pagination.pageSize,
    order_by: sorting.length > 0 ? sorting[0].id : "created_at",
    order_desc: sorting.length > 0 ? sorting[0].desc : true,
    is_published: clientFilters.is_published as boolean | undefined,
    is_featured: clientFilters.is_featured as boolean | undefined,
    is_active: clientFilters.is_active as boolean | undefined,
    property_type: clientFilters.property_type,
    state: clientFilters.state,
    status: clientFilters.status as string | undefined,
    city: clientFilters.city,
    date_from: clientFilters.date_from,
    date_to: clientFilters.date_to,
  };

  const { data: properties, isLoading, error } = useQuery({
    queryKey: ['properties', queryParams.search, queryParams.page, queryParams.size, queryParams.order_by, queryParams.order_desc, queryParams.is_published, queryParams.is_featured, queryParams.is_active, queryParams.property_type, queryParams.state, queryParams.status, queryParams.city, queryParams.date_from, queryParams.date_to],
    queryFn: async () => {
      const response = await realEstateApi.getPropertyList(queryParams);
      return response;
    },
    staleTime: 0,
    retry: 1,
  });

  const data: Property[] = properties?.data || [];
  const pageCount = properties?.pagination?.total_pages || 1;

  const deletePropertyMutation = useMutation({
    mutationFn: (propertyId: number) => realEstateApi.deleteProperty(propertyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      // ✅ از msg.crud استفاده کنید
      showSuccess(msg.crud('deleted', { item: 'ملک' }));
    },
    onError: (_error) => {
      showError('خطای سرور رخ داد');
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (propertyIds: number[]) => realEstateApi.bulkDeleteProperties(propertyIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      // ✅ از msg.crud استفاده کنید
      showSuccess(msg.crud('deleted', { item: 'ملک‌ها' }));
      setRowSelection({});
    },
    onError: (_error) => {
      showError('خطای سرور رخ داد');
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: number; is_active: boolean }) => {
      return realEstateApi.partialUpdateProperty(id, { is_active });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      showSuccess(data.is_active ? getStatus('active') : getStatus('inactive'));
    },
    onError: (_error) => {
      showError(getStatus('statusChangeError'));
    },
  });

  const handleToggleActive = (property: Property) => {
    toggleActiveMutation.mutate({
      id: property.id,
      is_active: !property.is_active,
    });
  };

  const handleDeleteProperty = (propertyId: number | string) => {
    setDeleteConfirm({
      open: true,
      propertyId: Number(propertyId),
      isBulk: false,
    });
  };

  const handleDeleteSelected = (selectedIds: (string | number)[]) => {
    setDeleteConfirm({
      open: true,
      propertyIds: selectedIds.map(id => Number(id)),
      isBulk: true,
    });
  };

  const handleConfirmDelete = async () => {
    try {
      if (deleteConfirm.isBulk && deleteConfirm.propertyIds) {
        await bulkDeleteMutation.mutateAsync(deleteConfirm.propertyIds);
      } else if (!deleteConfirm.isBulk && deleteConfirm.propertyId) {
        await deletePropertyMutation.mutateAsync(deleteConfirm.propertyId);
      }
    } catch (error) {
    }
    setDeleteConfirm({ open: false, isBulk: false });
  };

  const rowActions: DataTableRowAction<Property>[] = [
    {
      label: "مشاهده",
      icon: <Eye className="h-4 w-4" />,
      onClick: (property) => navigate(`/real-estate/properties/${property.id}/view`),
      permission: "real_estate.property.read",
    },
    {
      label: "ویرایش",
      icon: <Edit className="h-4 w-4" />,
      onClick: (property) => navigate(`/real-estate/properties/${property.id}/edit`),
      permission: "real_estate.property.update",
    },
    {
      label: "حذف",
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (property) => handleDeleteProperty(property.id),
      isDestructive: true,
      permission: "real_estate.property.delete",
    },
    {
      label: "خروجی PDF",
      icon: <FileText className="h-4 w-4" />,
      onClick: (property) => exportSinglePropertyPdf(property.id),
      permission: "real_estate.property.read",
    },
  ];

  const columns = usePropertyColumns(rowActions, handleToggleActive) as ColumnDef<Property>[];

  const { exportExcel, isLoading: isExcelLoading } = usePropertyExcelExport();
  const { exportPropertyListPdf, exportSinglePropertyPdf, isLoading: isPdfLoading } = usePropertyPdfExport();
  const { openPrintWindow } = usePropertyPrintView();

  const handleExcelExport = async (filters: PropertyFilters, search: string, exportAll: boolean = false) => {
    const exportParams: any = {
      search: search || undefined,
      order_by: sorting.length > 0 ? sorting[0].id : "created_at",
      order_desc: sorting.length > 0 ? sorting[0].desc : true,
      is_published: filters.is_published,
      is_featured: filters.is_featured,
      is_active: filters.is_active,
      property_types__in: filters.property_type ? String(filters.property_type) : undefined,
      states__in: filters.state ? String(filters.state) : undefined,
      statuses__in: filters.status ? String(filters.status) : undefined,
      cities__in: filters.city ? String(filters.city) : undefined,
    };

    if (exportAll) exportParams.export_all = true;
    else {
      exportParams.page = pagination.pageIndex + 1;
      exportParams.size = pagination.pageSize;
    }

    await exportExcel(data, properties?.pagination?.count || 0, exportParams);
  };

  const handlePdfExport = async (filters: PropertyFilters, search: string, exportAll: boolean = false) => {
    const exportParams: any = {
      search: search || undefined,
      order_by: sorting.length > 0 ? sorting[0].id : "created_at",
      order_desc: sorting.length > 0 ? sorting[0].desc : true,
      is_published: filters.is_published,
      is_featured: filters.is_featured,
      is_active: filters.is_active,
      property_types__in: filters.property_type ? String(filters.property_type) : undefined,
      states__in: filters.state ? String(filters.state) : undefined,
      statuses__in: filters.status ? String(filters.status) : undefined,
      cities__in: filters.city ? String(filters.city) : undefined,
    };

    if (exportAll) exportParams.export_all = true;
    else {
      exportParams.page = pagination.pageIndex + 1;
      exportParams.size = pagination.pageSize;
    }

    exportPropertyListPdf(exportParams);
  };

  const handlePrintAction = async (printAll: boolean = false) => {
    // If not printing all, use selection or current page data
    if (!printAll) {
      const selectedIds = Object.keys(rowSelection).filter(key => (rowSelection as any)[key]).map(idx => data[parseInt(idx)].id);
      if (selectedIds.length > 0) {
        openPrintWindow(selectedIds);
      } else {
        openPrintWindow(data.map(p => p.id));
      }
      return;
    }

    // Fetch all IDs matching current filters
    try {
      showWarning("در حال آماده‌سازی فایل پرینت برای تمامی موارد...");
      const response = await realEstateApi.getPropertyList({
        ...queryParams,
        page: 1,
        size: 10000,
      });

      const allIds = response.data.map(p => p.id);
      if (allIds.length > 0) {
        openPrintWindow(allIds);
      } else {
        showError("داده‌ای برای پرینت یافت نشد");
      }
    } catch (error) {
      showError("خطا در بارگذاری داده‌ها برای پرینت");
    }
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
        <PageHeader title="مدیریت املاک" />
        <div className="text-center py-8">
          <p className="text-red-1 mb-4">خطا در بارگذاری داده‌ها</p>
          <p className="text-sm text-font-s mb-4">
            سرور با خطای 500 پاسخ داده است. لطفاً با مدیر سیستم تماس بگیرید.
          </p>
          <Button
            onClick={() => window.location.reload()}
            className="mt-4"
          >
            تلاش مجدد
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ['properties'] });
              window.location.reload();
            }}
            className="mt-4 mr-2"
          >
            پاک کردن کش و تلاش مجدد
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="مدیریت املاک">
        <ProtectedButton
          permission="real_estate.property.create"
          size="sm"
          onClick={() => navigate('/real-estate/properties/create')}
        >
          <Plus className="h-4 w-4" />
          افزودن ملک
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
          searchValue={searchValue}
          pageSizeOptions={[10, 20, 50]}
          deleteConfig={{
            onDeleteSelected: handleDeleteSelected,
            permission: "real_estate.property.delete",
            denyMessage: "اجازه حذف ملک ندارید",
          }}
          exportConfigs={[
            {
              onExport: (filters, search) => handleExcelExport(filters as PropertyFilters, search, false),
              buttonText: `خروجی اکسل (صفحه فعلی)${isExcelLoading ? '...' : ''}`,
              value: "excel",
            },
            {
              onExport: (filters, search) => handleExcelExport(filters as PropertyFilters, search, true),
              buttonText: "خروجی اکسل (همه)",
              value: "excel_all",
            },
            {
              onExport: (filters, search) => handlePdfExport(filters as PropertyFilters, search, false),
              buttonText: `خروجی PDF (صفحه فعلی)${isPdfLoading ? '...' : ''}`,
              value: "pdf",
            },
            {
              onExport: (filters, search) => handlePdfExport(filters as PropertyFilters, search, true),
              buttonText: "خروجی PDF (همه)",
              value: "pdf_all",
            },
            {
              onExport: () => handlePrintAction(false),
              buttonText: "خروجی پرینت (صفحه فعلی)",
              value: "print",
            },
            {
              onExport: () => handlePrintAction(true),
              buttonText: "خروجی پرینت (همه)",
              value: "print_all",
            },
          ]}
          filterConfig={propertyFilterConfig}
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
                ? getConfirm('bulkDelete', { item: 'ملک', count: deleteConfirm.propertyIds?.length || 0 })
                : getConfirm('delete', { item: 'ملک' })
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

