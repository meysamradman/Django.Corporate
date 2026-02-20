import type { ColumnDef } from "@tanstack/react-table";
import type { RealEstateCity } from "@/types/real_estate/location";
import { Checkbox } from "@/components/elements/Checkbox";
import { DataTableRowActions } from "@/components/tables/DataTableRowActions";
import type { DataTableRowAction } from "@/types/shared/table";
import { formatDate } from "@/core/utils/commonFormat";

export const useCityColumns = (
  actions: DataTableRowAction<RealEstateCity>[] = []
) => {
  const baseColumns: ColumnDef<RealEstateCity>[] = [
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
      header: () => <div className="table-header-text">نام شهر</div>,
      cell: ({ row }) => <div className="table-cell-primary">{row.original.name}</div>,
      enableSorting: true,
      minSize: 200,
    },
    {
      accessorKey: "province_name",
      header: () => <div className="table-header-text">استان</div>,
      cell: ({ row }) => <div className="table-cell-secondary">{row.original.province_name}</div>,
      enableSorting: true,
      minSize: 180,
    },
    {
      accessorKey: "code",
      header: () => <div className="table-header-text">کد</div>,
      cell: ({ row }) => <div className="table-cell-secondary">{row.original.code}</div>,
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
