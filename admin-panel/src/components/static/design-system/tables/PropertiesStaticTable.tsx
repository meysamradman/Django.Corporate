import { useEffect, useMemo, useState } from "react";
import type { OnChangeFn, SortingState } from "@tanstack/react-table";
import { Eye, Edit, Trash2, FileText, BadgeCheck } from "lucide-react";
import { DataTable } from "@/components/tables/DataTable";
import { usePropertyColumns } from "@/components/real-estate/properties/list/RealEstateTableColumns";
import {
  getPropertyFilterConfig,
  usePropertyFilterOptions,
} from "@/components/real-estate/properties/list/RealEstateTableFilters";
import type { PropertyFilters } from "@/types/real_estate/realEstateListParams";
import type { Property } from "@/types/real_estate/realEstate";
import type { DataTableRowAction } from "@/types/shared/table";
import type { TablePaginationState } from "@/types/shared/pagination";

const INITIAL_PROPERTIES = [
  {
    id: 101,
    title: "آپارتمان ۲۱۰ متری زعفرانیه",
    slug: "apartment-zaferanieh-101",
    short_description: "آپارتمان لوکس با نور عالی",
    description: "نمونه استاتیک برای جدول املاک",
    is_published: true,
    is_featured: true,
    is_public: true,
    is_active: true,
    status: "active",
    created_at: "2026-02-20T09:30:00Z",
    updated_at: "2026-02-20T09:30:00Z",
    labels: [],
    tags: [],
    features: [],
    property_type: { id: 1, title: "آپارتمان" } as any,
    state: { id: 1, title: "آماده تحویل" } as any,
    city: 1,
    city_name: "تهران",
    province: 1,
    region: 11,
    agent: { id: 12, full_name: "آرمان کریمی" } as any,
    price: 48500000000,
    currency: "تومان",
  },
  {
    id: 102,
    title: "ویلای دوبلکس لواسان",
    slug: "villa-lavasan-102",
    short_description: "ویلا با حیاط و استخر",
    description: "نمونه استاتیک برای جدول املاک",
    is_published: false,
    is_featured: false,
    is_public: true,
    is_active: true,
    status: "pending",
    created_at: "2026-02-18T14:00:00Z",
    updated_at: "2026-02-18T14:00:00Z",
    labels: [],
    tags: [],
    features: [],
    property_type: { id: 2, title: "ویلا" } as any,
    state: { id: 2, title: "در حال معامله" } as any,
    city: 2,
    city_name: "لواسان",
    province: 1,
    region: 22,
    agent: { id: 14, full_name: "نیلوفر رضایی" } as any,
    sale_price: 92000000000,
    currency: "تومان",
  },
  {
    id: 103,
    title: "پنت‌هاوس نیاوران",
    slug: "penthouse-niavaran-103",
    short_description: "پنت‌هاوس فول امکانات",
    description: "نمونه استاتیک برای جدول املاک",
    is_published: true,
    is_featured: true,
    is_public: true,
    is_active: false,
    status: "sold",
    created_at: "2026-02-15T08:20:00Z",
    updated_at: "2026-02-15T08:20:00Z",
    labels: [],
    tags: [],
    features: [],
    property_type: { id: 1, title: "آپارتمان" } as any,
    state: { id: 3, title: "فروخته شده" } as any,
    city: 1,
    city_name: "تهران",
    province: 1,
    region: 13,
    agent: { id: 15, full_name: "پویا صادقی" } as any,
    price: 67500000000,
    currency: "تومان",
  },
  {
    id: 104,
    title: "دفتر اداری سعادت‌آباد",
    slug: "office-saadatabad-104",
    short_description: "اداری نوساز با دسترسی عالی",
    description: "نمونه استاتیک برای جدول املاک",
    is_published: true,
    is_featured: false,
    is_public: true,
    is_active: true,
    status: "rented",
    created_at: "2026-02-12T11:10:00Z",
    updated_at: "2026-02-12T11:10:00Z",
    labels: [],
    tags: [],
    features: [],
    property_type: { id: 3, title: "اداری" } as any,
    state: { id: 4, title: "اجاره داده شده" } as any,
    city: 1,
    city_name: "تهران",
    province: 1,
    region: 9,
    agent: { id: 12, full_name: "آرمان کریمی" } as any,
    monthly_rent: 380000000,
    currency: "تومان",
  },
  {
    id: 105,
    title: "زمین سرمایه‌گذاری دماوند",
    slug: "land-damavand-105",
    short_description: "زمین مناسب سرمایه‌گذاری",
    description: "نمونه استاتیک برای جدول املاک",
    is_published: false,
    is_featured: false,
    is_public: true,
    is_active: true,
    status: "archived",
    created_at: "2026-02-10T16:45:00Z",
    updated_at: "2026-02-10T16:45:00Z",
    labels: [],
    tags: [],
    features: [],
    property_type: { id: 4, title: "زمین" } as any,
    state: { id: 5, title: "بایگانی" } as any,
    city: 3,
    city_name: "دماوند",
    province: 1,
    region: 31,
    agent: { id: 14, full_name: "نیلوفر رضایی" } as any,
    pre_sale_price: 22500000000,
    currency: "تومان",
  },
] as unknown as Property[];

const toArray = (value: unknown): string[] => {
  if (value === undefined || value === null || value === "") return [];
  if (Array.isArray(value)) return value.map((item) => String(item));
  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const matchesSelection = (value: unknown, target: string | number | undefined | null): boolean => {
  const values = toArray(value);
  if (!values.length) return true;
  if (target === undefined || target === null) return false;
  return values.includes(String(target));
};

const matchesBoolean = (value: unknown, target: boolean): boolean => {
  if (value === undefined || value === null || value === "") return true;
  if (Array.isArray(value)) {
    return value.some((item) => String(item) === String(target));
  }
  return String(value) === String(target);
};

export function PropertiesStaticTable() {
  const { booleanFilterOptions } = usePropertyFilterOptions();
  const [properties, setProperties] = useState<Property[]>(INITIAL_PROPERTIES);
  const [pagination, setPagination] = useState<TablePaginationState>({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = useState<SortingState>([{ id: "created_at", desc: true }]);
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [searchValue, setSearchValue] = useState("");
  const [clientFilters, setClientFilters] = useState<PropertyFilters>({});

  const propertyTypeOptions = useMemo(
    () => [
      { id: 1, label: "آپارتمان", value: "1", children: [] },
      { id: 2, label: "ویلا", value: "2", children: [] },
      { id: 3, label: "اداری", value: "3", children: [] },
      { id: 4, label: "زمین", value: "4", children: [] },
    ],
    []
  );

  const stateOptions = useMemo(
    () => [
      { label: "آماده تحویل", value: "1" },
      { label: "در حال معامله", value: "2" },
      { label: "فروخته شده", value: "3" },
      { label: "اجاره داده شده", value: "4" },
      { label: "بایگانی", value: "5" },
    ],
    []
  );

  const provinceOptions = useMemo(
    () => [
      { label: "تهران", value: "1" },
      { label: "البرز", value: "2" },
    ],
    []
  );

  const cityOptions = useMemo(
    () => [
      { label: "تهران", value: "1" },
      { label: "لواسان", value: "2" },
      { label: "دماوند", value: "3" },
    ],
    []
  );

  const regionOptions = useMemo(
    () => [
      { label: "منطقه ۹", value: "9" },
      { label: "منطقه ۱۱", value: "11" },
      { label: "منطقه ۱۳", value: "13" },
      { label: "منطقه ۲۲", value: "22" },
      { label: "منطقه ۳۱", value: "31" },
    ],
    []
  );

  const agentOptions = useMemo(
    () => [
      { label: "آرمان کریمی", value: "12" },
      { label: "نیلوفر رضایی", value: "14" },
      { label: "پویا صادقی", value: "15" },
    ],
    []
  );

  const statusOptions = useMemo(
    () => [
      { label: "فعال", value: "active" },
      { label: "در حال معامله", value: "pending" },
      { label: "فروخته شده", value: "sold" },
      { label: "اجاره داده شده", value: "rented" },
      { label: "بایگانی", value: "archived" },
    ],
    []
  );

  const propertyFilterConfig = useMemo(
    () =>
      getPropertyFilterConfig(
        booleanFilterOptions,
        propertyTypeOptions,
        stateOptions,
        provinceOptions,
        cityOptions,
        regionOptions,
        agentOptions,
        statusOptions
      ),
    [
      booleanFilterOptions,
      propertyTypeOptions,
      stateOptions,
      provinceOptions,
      cityOptions,
      regionOptions,
      agentOptions,
      statusOptions,
    ]
  );

  const filteredData = useMemo(() => {
    const search = searchValue.trim().toLowerCase();
    const dateFrom = clientFilters.date_from ? new Date(clientFilters.date_from).getTime() : undefined;
    const dateTo = clientFilters.date_to ? new Date(clientFilters.date_to).getTime() : undefined;

    return properties.filter((property) => {
      const inSearch =
        !search ||
        property.title.toLowerCase().includes(search) ||
        (property.city_name || "").toLowerCase().includes(search) ||
        (property.property_type?.title || "").toLowerCase().includes(search);

      const createdAt = new Date(property.created_at).getTime();
      const inDateFrom = dateFrom ? createdAt >= dateFrom : true;
      const inDateTo = dateTo ? createdAt <= dateTo : true;

      return (
        inSearch &&
        matchesBoolean(clientFilters.is_published, property.is_published) &&
        matchesBoolean(clientFilters.is_featured, property.is_featured) &&
        matchesBoolean(clientFilters.is_active, property.is_active) &&
        matchesSelection(clientFilters.property_type, property.property_type?.id) &&
        matchesSelection(clientFilters.state, property.state?.id) &&
        matchesSelection(clientFilters.province, property.province) &&
        matchesSelection(clientFilters.city, property.city) &&
        matchesSelection(clientFilters.region, property.region) &&
        matchesSelection(clientFilters.agent, property.agent?.id) &&
        matchesSelection(clientFilters.status, property.status) &&
        inDateFrom &&
        inDateTo
      );
    });
  }, [clientFilters, properties, searchValue]);

  const sortedData = useMemo(() => {
    if (!sorting.length) return filteredData;

    const { id, desc } = sorting[0];
    const factor = desc ? -1 : 1;
    const data = [...filteredData];

    data.sort((a, b) => {
      if (id === "created_at") {
        return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * factor;
      }
      if (id === "title") {
        return a.title.localeCompare(b.title, "fa") * factor;
      }
      if (id === "price") {
        const aPrice = a.price || a.sale_price || a.pre_sale_price || a.monthly_rent || 0;
        const bPrice = b.price || b.sale_price || b.pre_sale_price || b.monthly_rent || 0;
        return (aPrice - bPrice) * factor;
      }
      if (id === "status") {
        return a.status.localeCompare(b.status, "fa") * factor;
      }
      if (id === "is_published") {
        return (Number(a.is_published) - Number(b.is_published)) * factor;
      }
      if (id === "is_featured") {
        return (Number(a.is_featured) - Number(b.is_featured)) * factor;
      }
      if (id === "is_active") {
        return (Number(a.is_active) - Number(b.is_active)) * factor;
      }
      return 0;
    });

    return data;
  }, [filteredData, sorting]);

  const pageCount = Math.max(1, Math.ceil(sortedData.length / pagination.pageSize));

  useEffect(() => {
    if (pagination.pageIndex >= pageCount) {
      setPagination((prev) => ({ ...prev, pageIndex: Math.max(0, pageCount - 1) }));
    }
  }, [pageCount, pagination.pageIndex]);

  const paginatedData = useMemo(() => {
    const start = pagination.pageIndex * pagination.pageSize;
    return sortedData.slice(start, start + pagination.pageSize);
  }, [pagination.pageIndex, pagination.pageSize, sortedData]);

  const handleFilterChange = (filterId: keyof PropertyFilters | "search", value: unknown) => {
    if (filterId === "search") {
      setSearchValue(String(value || ""));
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
      return;
    }

    setClientFilters((prev) => ({
      ...prev,
      [filterId]: value as any,
      ...(filterId === "date_range" && typeof value === "object" && value
        ? {
            date_from: (value as { from?: string }).from,
            date_to: (value as { to?: string }).to,
          }
        : {}),
    }));
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  };

  const handlePaginationChange: OnChangeFn<TablePaginationState> = (updaterOrValue) => {
    setPagination((prev) => (typeof updaterOrValue === "function" ? updaterOrValue(prev) : updaterOrValue));
  };

  const handleSortingChange: OnChangeFn<SortingState> = (updaterOrValue) => {
    setSorting((prev) => (typeof updaterOrValue === "function" ? updaterOrValue(prev) : updaterOrValue));
  };

  const handleToggleActive = (property: Property) => {
    setProperties((prev) =>
      prev.map((item) => (item.id === property.id ? { ...item, is_active: !item.is_active } : item))
    );
  };

  const rowActions: DataTableRowAction<Property>[] = [
    {
      label: "مشاهده",
      icon: <Eye className="h-4 w-4" />,
      onClick: () => {},
    },
    {
      label: "ویرایش",
      icon: <Edit className="h-4 w-4" />,
      onClick: () => {},
    },
    {
      label: "نهایی‌سازی معامله",
      icon: <BadgeCheck className="h-4 w-4" />,
      onClick: () => {},
      isDisabled: (property) => property.status === "sold" || property.status === "rented",
    },
    {
      label: "حذف",
      icon: <Trash2 className="h-4 w-4" />,
      onClick: () => {},
      isDestructive: true,
    },
    {
      label: "خروجی PDF",
      icon: <FileText className="h-4 w-4" />,
      onClick: () => {},
    },
  ];

  const columns = usePropertyColumns(rowActions, handleToggleActive);

  return (
    <DataTable
      columns={columns as any}
      data={paginatedData}
      pageCount={pageCount}
      isLoading={false}
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
        onDeleteSelected: () => {},
        denyMessage: "اجازه حذف ملک ندارید",
      }}
      exportConfigs={[
        { onExport: async () => {}, buttonText: "خروجی اکسل (صفحه فعلی)", value: "excel" },
        { onExport: async () => {}, buttonText: "خروجی اکسل (همه)", value: "excel_all" },
        { onExport: async () => {}, buttonText: "خروجی PDF (صفحه فعلی)", value: "pdf" },
        { onExport: async () => {}, buttonText: "خروجی PDF (همه)", value: "pdf_all" },
        { onExport: async () => {}, buttonText: "خروجی پرینت (صفحه فعلی)", value: "print" },
        { onExport: async () => {}, buttonText: "خروجی پرینت (همه)", value: "print_all" },
      ]}
      filterConfig={propertyFilterConfig}
      filterVariant="sidebar"
    />
  );
}
