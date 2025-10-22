"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/elements/Badge";
import { Checkbox } from "@/components/elements/Checkbox";
import { DataTableRowActions, DataTableRowAction } from "@/components/tables/DataTableRowActions";
import { Role } from "@/types/auth/permission";
import { formatDate } from "@/core/utils/format";
import { getPermissionTranslation } from "@/core/messages/permissions";

export const useRoleColumns = (rowActions: DataTableRowAction<Role>[]): ColumnDef<Role>[] => {

  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="انتخاب همه"
          className="translate-y-[2px]"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="انتخاب ردیف"
          className="translate-y-[2px]"
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 60,
      minSize: 60,
      maxSize: 60,
    },
    {
      accessorKey: "name",
      header: () => "نام",
      cell: ({ row }) => {
        const name = row.getValue("name") as string;
        const displayName = row.original.display_name;
        const isSystemRole = row.original.is_system_role;
        
        // ✅ برای نقش‌های سیستمی از ترجمه استفاده می‌کنیم
        // ✅ برای نقش‌های سفارشی از display_name استفاده می‌کنیم
        const persianName = isSystemRole 
          ? getPermissionTranslation(name, 'role') 
          : displayName;
        
        return (
          <div className="table-cell-primary table-cell-wide">
            {persianName}
          </div>
        );
      },
      enableSorting: true,
      enableHiding: true,
      minSize: 200,
    },
    {
      accessorKey: "is_active",
      header: () => "وضعیت",
      cell: ({ row }) => {
        const isActive = row.getValue("is_active") as boolean;
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
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
      enableSorting: true,
      enableHiding: true,
      minSize: 150,
    },
    {
      accessorKey: "is_system_role",
      header: () => "نوع",
      cell: ({ row }) => {
        const isSystemRole = row.getValue("is_system_role") as boolean;
        return (
          <div className="table-badge-container">
            {isSystemRole ? (
              <Badge variant="yellow">سیستمی</Badge>
            ) : (
              <Badge variant="green">سفارشی</Badge>
            )}
          </div>
        );
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
      enableSorting: true,
      enableHiding: true,
      minSize: 200,
    },
    {
      accessorKey: "level",
      header: () => "سطح",
      cell: ({ row }) => {
        const level = row.getValue("level") as number;
        return (
          <span className="table-cell-muted">
            {level}
          </span>
        );
      },
      enableSorting: true,
      enableHiding: true,
      minSize: 100,
    },
    {
      accessorKey: "created_at",
      header: () => "تاریخ ایجاد",
      cell: ({ row }) => {
        const date = row.getValue("created_at") as string;
        return (
          <div className="table-cell-muted">
            {formatDate(date)}
          </div>
        );
      },
      enableSorting: true,
      enableHiding: true,
      minSize: 200,
    },
    {
      id: "actions",
      cell: ({ row }) => {
        return <DataTableRowActions row={row} actions={rowActions} />;
      },
      enableSorting: false,
      enableHiding: false,
      size: 60,
      minSize: 60,
      maxSize: 60,
    },
  ];
};
