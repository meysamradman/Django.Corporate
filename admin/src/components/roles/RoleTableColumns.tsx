/**
 * رنگ‌های استاندارد Badge:
 * - سیستمی: default (blue/primary)
 * - سفارشی: outline
 */
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/elements/Badge";
import { Checkbox } from "@/components/elements/Checkbox";
import { DataTableRowActions } from "@/components/tables/DataTableRowActions";
import type { DataTableRowAction } from "@/types/shared/table";
import { Role } from "@/types/auth/permission";
import { formatDate } from "@/core/utils/format";
import { getPermissionTranslation } from "@/core/messages/permissions";

export const useRoleColumns = (rowActions: DataTableRowAction<Role>[]): ColumnDef<Role>[] => {

  return [
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
      header: () => <div className="table-header-text">نام</div>,
      cell: ({ row }) => {
        const slug = row.original.name;
        const backendDisplayName = row.original.display_name;
        const isSystemRole = row.original.is_system_role;

        // Optimized: Only check messages for system roles (they are defined there)
        // For custom roles: backend display_name is already in Persian, use it directly
        const localizedName = isSystemRole
          ? (getPermissionTranslation(slug, 'role') || backendDisplayName || slug)
          : (backendDisplayName || slug);
        
        return (
          <div className="table-cell-primary table-cell-wide">
            {localizedName}
          </div>
        );
      },
      enableSorting: true,
      enableHiding: true,
      minSize: 200,
    },
    {
      accessorKey: "is_active",
      header: () => <div className="table-header-text">وضعیت</div>,
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
      header: () => <div className="table-header-text">نوع</div>,
      cell: ({ row }) => {
        const isSystemRole = row.getValue("is_system_role") as boolean;
        return (
          <div className="table-badge-container">
            {isSystemRole ? (
              <Badge variant="default">سیستمی</Badge>
            ) : (
              <Badge variant="outline">سفارشی</Badge>
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
      header: () => <div className="table-header-text">سطح</div>,
      cell: ({ row }) => {
        const level = row.getValue("level") as number;
        return (
          <div className="table-cell-muted">
            {level}
          </div>
        );
      },
      enableSorting: true,
      enableHiding: true,
      minSize: 100,
    },
    {
      accessorKey: "created_at",
      header: () => <div className="table-header-text">تاریخ ایجاد</div>,
      cell: ({ row }) => {
        const date = row.getValue("created_at") as string;
        return (
          <div className="table-date-cell">
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
