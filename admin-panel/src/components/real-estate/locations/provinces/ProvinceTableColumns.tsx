import type { ColumnDef } from "@tanstack/react-table";
import type { RealEstateProvince } from "@/types/real_estate/location";
import { Badge } from "@/components/elements/Badge";
import { Checkbox } from "@/components/elements/Checkbox";
import { DataTableRowActions } from "@/components/tables/DataTableRowActions";
import type { DataTableRowAction } from "@/types/shared/table";
import { formatDate } from "@/core/utils/commonFormat";

export const useProvinceColumns = (
  actions: DataTableRowAction<RealEstateProvince>[] = []
) => {
  const baseColumns: ColumnDef<RealEstateProvince>[] = [
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
      accessorKey: "name",
      header: () => <div className="table-header-text">نام استان</div>,
      cell: ({ row }) => <div className="table-cell-primary">{row.original.name}</div>,
      enableSorting: true,
      minSize: 220,
    },
    {
      accessorKey: "code",
      header: () => <div className="table-header-text">کد</div>,
      cell: ({ row }) => <div className="table-cell-secondary">{row.original.code}</div>,
      enableSorting: true,
      minSize: 120,
    },
    {
      accessorKey: "cities_count",
      header: () => <div className="table-header-text">تعداد شهر</div>,
      cell: ({ row }) => (
        <div className="table-badge-container">
          <Badge variant="gray">{(row.original as RealEstateProvince & { cities_count?: number }).cities_count ?? 0}</Badge>
        </div>
      ),
      enableSorting: true,
      minSize: 120,
    },
    {
      accessorKey: "created_at",
      header: () => <div className="table-header-text">تاریخ ایجاد</div>,
      cell: ({ row }) => <div className="table-date-cell">{formatDate((row.original as any).created_at)}</div>,
      enableSorting: true,
      minSize: 150,
    },
    {
      id: "actions",
      cell: ({ row }) => <DataTableRowActions row={row} actions={actions} />,
      enableSorting: false,
      enableHiding: false,
      size: 60,
      minSize: 60,
      maxSize: 60,
    },
  ];

  return baseColumns;
};
