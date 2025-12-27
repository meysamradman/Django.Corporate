import { useState, useEffect, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader/PageHeader";
import { usePropertyColumns } from "@/components/real-estate/list/PropertyTableColumns";
import { usePropertyFilterOptions, getPropertyFilterConfig } from "@/components/real-estate/list/PropertyTableFilters";
import type { PropertyFilters } from "@/types/real_estate/realEstateListParams";
import { Edit, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/elements/Button";
import { ProtectedButton } from "@/components/admins/permissions";
import { showError, showSuccess, showWarning } from '@/core/toast';
import type { OnChangeFn, SortingState } from "@tanstack/react-table";
import type { TablePaginationState } from '@/types/shared/pagination';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { initSortingFromURL } from "@/components/tables/utils/tableSorting";

const DataTable = lazy(() => import("@/components/tables/DataTable").then(mod => ({ default: mod.DataTable })));
import { getCrud, getConfirm, getStatus } from '@/core/messages';
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
import { exportProperties } from "@/api/real-estate/export";
import type { DataTableRowAction } from "@/types/shared/table";
import type { PropertyType } from "@/types/real_estate/type/propertyType";
import type { PropertyState } from "@/types/real_estate/state/realEstateState";
import { env } from '@/core/config/environment';

export default function PropertyPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { booleanFilterOptions } = usePropertyFilterOptions();
  
  const [_propertyTypes, setPropertyTypes] = useState<PropertyType[]>([]);
  const [propertyTypeOptions, setPropertyTypeOptions] = useState<{ label: string; value: string }[]>([]);
  
  const [_states, setStates] = useState<PropertyState[]>([]);
  const [stateOptions, setStateOptions] = useState<{ label: string; value: string }[]>([]);
  
  const [cityOptions] = useState<{ label: string; value: string }[]>([]);
  
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
      if (urlParams.get('is_verified')) filters.is_verified = urlParams.get('is_verified') === 'true';
      if (urlParams.get('is_active')) filters.is_active = urlParams.get('is_active') === 'true';
      if (urlParams.get('property_type')) filters.property_type = parseInt(urlParams.get('property_type') || '0');
      if (urlParams.get('state')) filters.state = parseInt(urlParams.get('state') || '0');
      if (urlParams.get('city')) filters.city = parseInt(urlParams.get('city') || '0');
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
        const [typesResponse, statesResponse] = await Promise.all([
          realEstateApi.getTypes({ page: 1, size: 1000, is_active: true }),
          realEstateApi.getStates({ page: 1, size: 1000, is_active: true }),
        ]);
        
        setPropertyTypes(typesResponse.data);
        setPropertyTypeOptions(typesResponse.data.map((t: PropertyType) => ({ label: t.title, value: t.id.toString() })));
        
        setStates(statesResponse.data);
        setStateOptions(statesResponse.data.map((s: PropertyState) => ({ label: s.title, value: s.id.toString() })));
      } catch (error) {
      }
    };
    
    fetchOptions();
  }, []);

  const propertyFilterConfig = getPropertyFilterConfig(
    booleanFilterOptions,
    propertyTypeOptions,
    stateOptions,
    cityOptions
  );

  const queryParams = {
    search: searchValue,
    page: pagination.pageIndex + 1,
    size: pagination.pageSize,
    order_by: sorting.length > 0 ? sorting[0].id : "created_at",
    order_desc: sorting.length > 0 ? sorting[0].desc : true,
    is_published: clientFilters.is_published as boolean | undefined,
    is_featured: clientFilters.is_featured as boolean | undefined,
    is_verified: clientFilters.is_verified as boolean | undefined,
    is_active: clientFilters.is_active as boolean | undefined,
    property_type: clientFilters.property_type,
    state: clientFilters.state,
    city: clientFilters.city,
  };

  const { data: properties, isLoading, error } = useQuery({
    queryKey: ['properties', queryParams.search, queryParams.page, queryParams.size, queryParams.order_by, queryParams.order_desc, queryParams.is_published, queryParams.is_featured, queryParams.is_verified, queryParams.is_active, queryParams.property_type, queryParams.state, queryParams.city],
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
      showSuccess(getCrud('deleted', { item: 'ملک' }));
    },
    onError: (_error) => {
      showError('خطای سرور رخ داد');
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (propertyIds: number[]) => realEstateApi.bulkDeleteProperties(propertyIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      showSuccess(getCrud('deleted', { item: 'ملک‌ها' }));
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
  ];
  
  const columns = usePropertyColumns(rowActions, handleToggleActive) as ColumnDef<Property>[];

  const handleExportExcel = async (filters: PropertyFilters, search: string, exportAll: boolean = false) => {
    try {
      const exportParams: any = {
        search: search || undefined,
        order_by: sorting.length > 0 ? sorting[0].id : "created_at",
        order_desc: sorting.length > 0 ? sorting[0].desc : true,
        is_published: filters.is_published as boolean | undefined,
        is_featured: filters.is_featured as boolean | undefined,
        is_verified: filters.is_verified as boolean | undefined,
        is_active: filters.is_active as boolean | undefined,
        property_type: filters.property_type,
        state: filters.state,
        city: filters.city,
      };
      
      if (exportAll) {
        exportParams.export_all = true;
      } else {
        exportParams.page = pagination.pageIndex + 1;
        exportParams.size = pagination.pageSize;
      }
      
      await exportProperties(exportParams, 'excel');
      showSuccess(exportAll ? "فایل اکسل (همه آیتم‌ها) با موفقیت دانلود شد" : "فایل اکسل (صفحه فعلی) با موفقیت دانلود شد");
    } catch (error: any) {
      const errorMessage = error?.response?.message || error?.message || "خطا در دانلود فایل اکسل";
      showError(errorMessage);
    }
  };

  const handleExportPDF = async (filters: PropertyFilters, search: string, exportAll: boolean = false) => {
    try {
      const exportParams: any = {
        search: search || undefined,
        order_by: sorting.length > 0 ? sorting[0].id : "created_at",
        order_desc: sorting.length > 0 ? sorting[0].desc : true,
        is_published: filters.is_published as boolean | undefined,
        is_featured: filters.is_featured as boolean | undefined,
        is_verified: filters.is_verified as boolean | undefined,
        is_active: filters.is_active as boolean | undefined,
        property_type: filters.property_type,
        state: filters.state,
        city: filters.city,
      };
      
      if (exportAll) {
        exportParams.export_all = true;
      } else {
        exportParams.page = pagination.pageIndex + 1;
        exportParams.size = pagination.pageSize;
      }
      
      await exportProperties(exportParams, 'pdf');
      showSuccess(exportAll ? "فایل PDF (همه آیتم‌ها) با موفقیت دانلود شد" : "فایل PDF (صفحه فعلی) با موفقیت دانلود شد");
    } catch (error: any) {
      const errorMessage = error?.response?.message || error?.message || "خطا در دانلود فایل PDF";
      showError(errorMessage);
    }
  };

  const handlePrint = async (printAll: boolean = false) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showError("لطفاً popup blocker را غیرفعال کنید");
      return;
    }

    let printData = data;
    const MAX_PRINT_ITEMS = env.REAL_ESTATE_EXPORT_PRINT_MAX_ITEMS;
    if (printAll) {
      try {
        const allParams = {
          search: searchValue || undefined,
          page: 1,
          size: MAX_PRINT_ITEMS,
          order_by: sorting.length > 0 ? sorting[0].id : "created_at",
          order_desc: sorting.length > 0 ? sorting[0].desc : true,
          is_published: clientFilters.is_published as boolean | undefined,
          is_featured: clientFilters.is_featured as boolean | undefined,
          is_verified: clientFilters.is_verified as boolean | undefined,
          is_active: clientFilters.is_active as boolean | undefined,
          property_type: clientFilters.property_type,
          state: clientFilters.state,
          city: clientFilters.city,
        };
        const response = await realEstateApi.getPropertyList(allParams);
        printData = response.data;
        const totalCount = response.pagination?.count || 0;
        if (totalCount > MAX_PRINT_ITEMS) {
          showWarning(`فقط ${MAX_PRINT_ITEMS} آیتم اول از ${totalCount} آیتم پرینت شد. لطفاً فیلترهای بیشتری اعمال کنید.`);
        }
      } catch (error: any) {
        const errorMessage = error?.response?.message || error?.message || "خطا در دریافت داده‌ها برای پرینت";
        showError(errorMessage);
        printWindow.close();
        return;
      }
    }

    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      const year = date.getFullYear() - 621;
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
    };

    const tableRows = printData.map((property) => {
      const propertyType = property.property_type?.title || '-';
      const state = property.state?.title || '-';
      const city = property.city_name || '-';
      const price = property.price || property.sale_price || property.pre_sale_price || property.monthly_rent || '-';
      const currency = property.currency || 'تومان';
      const priceText = price !== '-' ? `${new Intl.NumberFormat('fa-IR').format(price)} ${currency}` : '-';
      const createdDate = property.created_at ? formatDate(property.created_at) : '-';
      
      return `
        <tr>
          <td style="text-align: right; padding: 8px; border-bottom: 0.5px solid #e2e8f0;">${property.is_active ? 'بله' : 'خیر'}</td>
          <td style="text-align: right; padding: 8px; border-bottom: 0.5px solid #e2e8f0;">${property.is_verified ? 'بله' : 'خیر'}</td>
          <td style="text-align: right; padding: 8px; border-bottom: 0.5px solid #e2e8f0;">${property.is_featured ? 'بله' : 'خیر'}</td>
          <td style="text-align: right; padding: 8px; border-bottom: 0.5px solid #e2e8f0;">${property.is_published ? 'بله' : 'خیر'}</td>
          <td style="text-align: right; padding: 8px; border-bottom: 0.5px solid #e2e8f0;">${createdDate}</td>
          <td style="text-align: right; padding: 8px; border-bottom: 0.5px solid #e2e8f0;">${priceText}</td>
          <td style="text-align: right; padding: 8px; border-bottom: 0.5px solid #e2e8f0;">${city}</td>
          <td style="text-align: right; padding: 8px; border-bottom: 0.5px solid #e2e8f0;">${state}</td>
          <td style="text-align: right; padding: 8px; border-bottom: 0.5px solid #e2e8f0;">${propertyType}</td>
          <td style="text-align: center; padding: 8px; border-bottom: 0.5px solid #e2e8f0;">${property.id}</td>
          <td style="text-align: right; padding: 8px; border-bottom: 0.5px solid #e2e8f0;">${property.title || '-'}</td>
        </tr>
      `;
    }).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl">
        <head>
          <meta charset="utf-8">
          <title>پرینت لیست املاک ${printAll ? '(همه)' : '(صفحه فعلی)'}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              direction: rtl;
              background: white;
              padding: 20px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
              font-size: 10px;
            }
            th {
              background-color: #f8fafc;
              color: #0f172a;
              font-weight: bold;
              padding: 8px;
              text-align: right;
              border-bottom: 1px solid #e2e8f0;
              font-size: 11px;
            }
            td {
              padding: 8px;
              color: #0f172a;
              border-bottom: 0.5px solid #e2e8f0;
              word-wrap: break-word;
            }
            tr:nth-child(even) {
              background-color: #f8fafc;
            }
            tr:nth-child(odd) {
              background-color: white;
            }
            @media print {
              @page {
                size: A4 landscape;
                margin: 1cm;
              }
              body {
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <table>
            <thead>
              <tr>
                <th>فعال</th>
                <th>تایید شده</th>
                <th>ویژه</th>
                <th>منتشر شده</th>
                <th>تاریخ ایجاد</th>
                <th>قیمت</th>
                <th>شهر</th>
                <th>وضعیت</th>
                <th>نوع ملک</th>
                <th>ID</th>
                <th>عنوان</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() {
                window.close();
              }, 100);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handleFilterChange = (filterId: string | number, value: unknown) => {
    const filterKey = filterId as string;
    
    if (filterKey === "search") {
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
      setClientFilters(prev => ({
        ...prev,
        [filterKey]: value as string | boolean | number | undefined
      }));
      setPagination(prev => ({ ...prev, pageIndex: 0 }));
      
      const url = new URL(window.location.href);
      if (value !== undefined && value !== null) {
        if (typeof value === 'boolean') {
          url.searchParams.set(filterKey, value.toString());
        } else {
          url.searchParams.set(filterKey, String(value));
        }
      } else {
        url.searchParams.delete(filterKey);
      }
      url.searchParams.set('page', '1');
      window.history.replaceState({}, '', url.toString());
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
              onExport: (filters, search) => handleExportExcel(filters as PropertyFilters, search, false),
              buttonText: "خروجی اکسل (صفحه فعلی)",
              value: "excel",
              variant: "outline",
            },
            {
              onExport: (filters, search) => handleExportExcel(filters as PropertyFilters, search, true),
              buttonText: "خروجی اکسل (همه)",
              value: "excel_all",
              variant: "outline",
            },
            {
              onExport: (filters, search) => handleExportPDF(filters as PropertyFilters, search, false),
              buttonText: "خروجی PDF (صفحه فعلی)",
              value: "pdf",
              variant: "outline",
            },
            {
              onExport: (filters, search) => handleExportPDF(filters as PropertyFilters, search, true),
              buttonText: "خروجی PDF (همه)",
              value: "pdf_all",
              variant: "outline",
            },
            {
              onExport: async () => {
                await handlePrint(true);
              },
              buttonText: "پرینت (همه)",
              value: "print_all",
              variant: "outline",
            },
          ]}
          onPrint={() => handlePrint(false)}
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

