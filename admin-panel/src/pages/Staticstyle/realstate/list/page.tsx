import { useState, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader/PageHeader";
import type { OnChangeFn, SortingState } from "@tanstack/react-table";
import type { TablePaginationState } from '@/types/shared/pagination';
import type { ColumnDef } from "@tanstack/react-table";
import { Edit, Trash2, Plus, Eye } from "lucide-react";
import { Button } from "@/components/elements/Button";
import { Badge } from "@/components/elements/Badge";
import { Checkbox } from "@/components/elements/Checkbox";
import { Switch } from "@/components/elements/Switch";
import { Avatar, AvatarFallback } from "@/components/elements/Avatar";
import { DataTableRowActions } from "@/components/tables/DataTableRowActions";
import type { DataTableRowAction } from "@/types/shared/table";
import type { FilterConfig } from "@/types/shared/table";
import { formatDate } from "@/core/utils/format";

const DataTable = lazy(() => import("@/components/tables/DataTable").then(mod => ({ default: mod.DataTable })));

// نوع داده استاتیک برای املاک
interface RealEstateItem {
  id: number;
  title: string;
  address: string;
  price: number;
  area: number;
  rooms: number;
  status: "available" | "sold" | "rented";
  type: "apartment" | "villa" | "office" | "land";
  created_at: string;
  is_featured: boolean;
  is_active: boolean;
}

// داده‌های استاتیک نمونه
const staticRealEstateData: RealEstateItem[] = [
  {
    id: 1,
    title: "آپارتمان 120 متری در زعفرانیه",
    address: "تهران، زعفرانیه، خیابان ولیعصر",
    price: 8500000000,
    area: 120,
    rooms: 3,
    status: "available",
    type: "apartment",
    created_at: "2024-01-15T10:30:00Z",
    is_featured: true,
    is_active: true,
  },
  {
    id: 2,
    title: "ویلا 250 متری در لواسان",
    address: "لواسان، جاده کندوان",
    price: 12000000000,
    area: 250,
    rooms: 4,
    status: "available",
    type: "villa",
    created_at: "2024-01-20T14:20:00Z",
    is_featured: true,
    is_active: true,
  },
  {
    id: 3,
    title: "دفتر کار 80 متری در ونک",
    address: "تهران، ونک، خیابان ملاصدرا",
    price: 4500000000,
    area: 80,
    rooms: 0,
    status: "rented",
    type: "office",
    created_at: "2024-01-10T09:15:00Z",
    is_featured: false,
    is_active: true,
  },
  {
    id: 4,
    title: "زمین 500 متری در کرج",
    address: "کرج، فردیس، خیابان آزادی",
    price: 3200000000,
    area: 500,
    rooms: 0,
    status: "available",
    type: "land",
    created_at: "2024-01-25T11:45:00Z",
    is_featured: false,
    is_active: true,
  },
  {
    id: 5,
    title: "آپارتمان 90 متری در پاسداران",
    address: "تهران، پاسداران، خیابان فرمانیه",
    price: 6800000000,
    area: 90,
    rooms: 2,
    status: "sold",
    type: "apartment",
    created_at: "2024-01-05T08:00:00Z",
    is_featured: false,
    is_active: false,
  },
];

// تعریف ستون‌های جدول
const getRealEstateColumns = (
  actions: DataTableRowAction<RealEstateItem>[],
  navigate: (path: string) => void,
  onToggleActive?: (item: RealEstateItem) => void
): ColumnDef<RealEstateItem>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="انتخاب همه"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="انتخاب ردیف"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
    size: 60,
    minSize: 60,
    maxSize: 60,
  },
  {
    accessorKey: "title",
    header: () => <div className="table-header-text">عنوان</div>,
    cell: ({ row }) => {
      const item = row.original;
      const getInitial = () => {
        if (!item.title) return "؟";
        return item.title.charAt(0).toUpperCase();
      };

      return (
        <div 
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => navigate(`/staticstyle/realstate/${item.id}/view`)}
        >
          <Avatar className="table-avatar">
            <AvatarFallback className="table-cell-avatar-fallback">
              {getInitial()}
            </AvatarFallback>
          </Avatar>
          <div className="table-cell-primary table-cell-wide">
            {item.title}
          </div>
        </div>
      );
    },
    enableSorting: true,
    enableHiding: true,
    minSize: 200,
  },
  {
    accessorKey: "address",
    header: () => <div className="table-header-text">آدرس</div>,
    cell: ({ row }) => (
      <div className="table-cell-muted table-cell-wide">
        {row.original.address}
      </div>
    ),
    enableSorting: true,
    enableHiding: true,
    minSize: 200,
  },
  {
    accessorKey: "type",
    header: () => <div className="table-header-text">نوع</div>,
    cell: ({ row }) => {
      const typeLabels: Record<string, string> = {
        apartment: "آپارتمان",
        villa: "ویلا",
        office: "دفتر کار",
        land: "زمین",
      };
      return (
        <div className="table-badge-container">
          <Badge variant="blue">{typeLabels[row.original.type] || row.original.type}</Badge>
        </div>
      );
    },
    enableSorting: true,
    enableHiding: true,
    minSize: 120,
  },
  {
    accessorKey: "status",
    header: () => <div className="table-header-text">وضعیت</div>,
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <div className="table-badge-container">
          {status === "available" ? (
            <Badge variant="green">موجود</Badge>
          ) : status === "sold" ? (
            <Badge variant="red">فروخته شده</Badge>
          ) : (
            <Badge variant="yellow">اجاره داده شده</Badge>
          )}
        </div>
      );
    },
    enableSorting: true,
    enableHiding: true,
    minSize: 150,
  },
  {
    accessorKey: "price",
    header: () => <div className="table-header-text">قیمت (تومان)</div>,
    cell: ({ row }) => {
      const price = row.original.price;
      const formattedPrice = new Intl.NumberFormat("fa-IR").format(price);
      return (
        <div className="table-cell-primary">
          {formattedPrice}
        </div>
      );
    },
    enableSorting: true,
    enableHiding: true,
    minSize: 150,
  },
  {
    accessorKey: "area",
    header: () => <div className="table-header-text">متراژ (متر)</div>,
    cell: ({ row }) => (
      <div className="table-cell-muted">
        {row.original.area}
      </div>
    ),
    enableSorting: true,
    enableHiding: true,
    minSize: 120,
  },
  {
    accessorKey: "rooms",
    header: () => <div className="table-header-text">تعداد اتاق</div>,
    cell: ({ row }) => (
      <div className="table-cell-muted">
        {row.original.rooms > 0 ? row.original.rooms : "-"}
      </div>
    ),
    enableSorting: true,
    enableHiding: true,
    minSize: 110,
  },
  {
    accessorKey: "is_featured",
    header: () => <div className="table-header-text">ویژه</div>,
    cell: ({ row }) => (
      <div className="table-badge-container">
        {row.original.is_featured ? (
          <Badge variant="orange">ویژه</Badge>
        ) : (
          <Badge variant="gray">عادی</Badge>
        )}
      </div>
    ),
    enableSorting: true,
    enableHiding: true,
    minSize: 150,
  },
  {
    accessorKey: "created_at",
    header: () => <div className="table-header-text">تاریخ ایجاد</div>,
    cell: ({ row }) => (
      <div className="table-date-cell">
        {formatDate(row.original.created_at)}
      </div>
    ),
    enableSorting: true,
    enableHiding: true,
    minSize: 150,
  },
  {
    accessorKey: "is_active",
    header: () => <div className="table-header-text">فعال</div>,
    cell: ({ row }) => {
      const item = row.original;
      const isActive = item.is_active;
      
      if (onToggleActive) {
        return (
          <div onClick={(e) => e.stopPropagation()}>
            <Switch
              checked={isActive}
              onCheckedChange={() => onToggleActive(item)}
            />
          </div>
        );
      }
      
      return (
        <div className="table-badge-container">
          {isActive ? (
            <Badge variant="green">فعال</Badge>
          ) : (
            <Badge variant="red">غیرفعال</Badge>
          )}
        </div>
      );
    },
    enableSorting: true,
    enableHiding: true,
    minSize: 80,
    size: 80,
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const defaultActions: DataTableRowAction<RealEstateItem>[] = [
        {
          label: "مشاهده",
          icon: <Eye className="h-4 w-4" />,
          onClick: (item) => navigate(`/staticstyle/realstate/${item.id}/view`),
        },
        {
          label: "ویرایش",
          icon: <Edit className="h-4 w-4" />,
          onClick: (item) => navigate(`/staticstyle/realstate/${item.id}/edit`),
        },
        {
          label: "حذف",
          icon: <Trash2 className="h-4 w-4" />,
          onClick: (_item) => {},
          isDestructive: true,
        },
      ];
      
      const rowActions = actions.length > 0 ? actions : defaultActions;
      
      return <DataTableRowActions row={row} actions={rowActions} />;
    },
    enableSorting: false,
    enableHiding: false,
    size: 60,
    minSize: 60,
    maxSize: 60,
  },
];

// فیلترهای استاتیک
const getRealEstateFilterConfig = (): FilterConfig[] => [
  {
    columnId: "status",
    title: "وضعیت",
    type: "select",
    options: [
      { label: "موجود", value: "available" },
      { label: "فروخته شده", value: "sold" },
      { label: "اجاره داده شده", value: "rented" },
    ],
    placeholder: "وضعیت",
  },
  {
    columnId: "type",
    title: "نوع ملک",
    type: "select",
    options: [
      { label: "آپارتمان", value: "apartment" },
      { label: "ویلا", value: "villa" },
      { label: "دفتر کار", value: "office" },
      { label: "زمین", value: "land" },
    ],
    placeholder: "نوع ملک",
  },
  {
    columnId: "is_featured",
    title: "ویژه",
    type: "select",
    options: [
      { label: "بله", value: true },
      { label: "خیر", value: false },
    ],
    placeholder: "ویژه",
  },
  {
    columnId: "is_active",
    title: "فعال",
    type: "select",
    options: [
      { label: "بله", value: true },
      { label: "خیر", value: false },
    ],
    placeholder: "فعال",
  },
];

export default function RealEstateListPage() {
  const navigate = useNavigate();
  const [pagination, setPagination] = useState<TablePaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState({});
  const [searchValue, setSearchValue] = useState("");
  const [clientFilters, setClientFilters] = useState<Record<string, unknown>>({
    status: undefined,
    type: undefined,
    is_featured: undefined,
    is_active: undefined,
  });

  // فیلتر کردن داده‌های استاتیک بر اساس فیلترها و جستجو
  const filteredData = staticRealEstateData.filter((item) => {
    // جستجو
    if (searchValue) {
      const searchLower = searchValue.toLowerCase();
      const matchesSearch =
        item.title.toLowerCase().includes(searchLower) ||
        item.address.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    // فیلتر وضعیت
    if (clientFilters.status && item.status !== clientFilters.status) {
      return false;
    }

    // فیلتر نوع
    if (clientFilters.type && item.type !== clientFilters.type) {
      return false;
    }

    // فیلتر ویژه
    if (clientFilters.is_featured !== undefined && item.is_featured !== clientFilters.is_featured) {
      return false;
    }

    // فیلتر فعال
    if (clientFilters.is_active !== undefined && item.is_active !== clientFilters.is_active) {
      return false;
    }

    return true;
  });

  // مرتب‌سازی داده‌ها
  const sortedData = [...filteredData].sort((a, b) => {
    if (sorting.length === 0) return 0;
    const sort = sorting[0];
    const aValue = a[sort.id as keyof RealEstateItem];
    const bValue = b[sort.id as keyof RealEstateItem];

    if (aValue === undefined || bValue === undefined) return 0;
    if (aValue < bValue) return sort.desc ? 1 : -1;
    if (aValue > bValue) return sort.desc ? -1 : 1;
    return 0;
  });

  // Pagination
  const paginatedData = sortedData.slice(
    pagination.pageIndex * pagination.pageSize,
    (pagination.pageIndex + 1) * pagination.pageSize
  );
  const pageCount = Math.ceil(sortedData.length / pagination.pageSize);


  const handleToggleActive = (item: RealEstateItem) => {
    console.log("تغییر وضعیت فعال:", item.id, !item.is_active);
    // در آینده می‌تواند به API ارسال شود
  };

  const columns = getRealEstateColumns([], navigate, handleToggleActive);
  const filterConfig = getRealEstateFilterConfig();

  const handleFilterChange = (filterId: string | number, value: unknown) => {
    const filterKey = filterId as string;
    if (filterKey === "search") {
      setSearchValue(typeof value === 'string' ? value : '');
      setPagination(prev => ({ ...prev, pageIndex: 0 }));
    } else {
      setClientFilters(prev => ({
        ...prev,
        [filterKey]: value as string | boolean | number | undefined
      }));
      setPagination(prev => ({ ...prev, pageIndex: 0 }));
    }
  };

  const handlePaginationChange: OnChangeFn<TablePaginationState> = (updaterOrValue) => {
    const newPagination = typeof updaterOrValue === 'function' 
      ? updaterOrValue(pagination) 
      : updaterOrValue;
    setPagination(newPagination);
  };

  const handleSortingChange: OnChangeFn<SortingState> = (updaterOrValue) => {
    const newSorting = typeof updaterOrValue === 'function' 
      ? updaterOrValue(sorting) 
      : updaterOrValue;
    setSorting(newSorting);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="مدیریت املاک">
        <Button 
          size="sm"
          onClick={() => {
            console.log("افزودن ملک جدید");
            // در آینده می‌تواند به صفحه ایجاد هدایت کند
          }}
        >
          <Plus className="h-4 w-4" />
          افزودن ملک
        </Button>
      </PageHeader>

      <Suspense fallback={null}>
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
          filterConfig={filterConfig}
        />
      </Suspense>
    </div>
  );
}
