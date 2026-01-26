import type { ColumnDef } from "@tanstack/react-table";
import type { PropertyState } from "@/types/real_estate/state/realEstateState";
import { Badge } from "@/components/elements/Badge";
import { Switch } from "@/components/elements/Switch";
import { formatDate } from "@/core/utils/format";
import { DataTableRowActions } from "@/components/tables/DataTableRowActions";
import type { DataTableRowAction } from "@/types/shared/table";
import { ProtectedLink, usePermission } from "@/core/permissions";
import { Checkbox } from "@/components/elements/Checkbox";
import { Avatar, AvatarFallback } from "@/components/elements/Avatar";

export const usePropertyStateColumns = (
  actions: DataTableRowAction<PropertyState>[] = [],
  onToggleActive?: (state: PropertyState) => void
) => {
  const { hasPermission } = usePermission();

  const baseColumns: ColumnDef<PropertyState>[] = [
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
        const state = row.original;

        const getInitial = () => {
          if (!state.title) return "؟";
          return state.title.charAt(0).toUpperCase();
        };

        return (
          <ProtectedLink
            to={`/real-estate/states/${state.id}/edit`}
            permission="real_estate.state.update"
            className="flex items-center gap-3"
          >
            <Avatar className="table-avatar">
              <AvatarFallback className="table-cell-avatar-fallback">
                {getInitial()}
              </AvatarFallback>
            </Avatar>
            <div className="table-cell-primary table-cell-wide">
              {state.title}
            </div>
          </ProtectedLink>
        );
      },
      enableSorting: true,
      enableHiding: true,
      minSize: 200,
    },
    {
      accessorKey: "usage_type",
      header: () => <div className="table-header-text">نوع کاربری (سیستمی)</div>,
      cell: ({ row }) => {
        const usageType = row.original.usage_type;
        const usageMap: Record<string, string> = {
          sale: "فروشی",
          rent: "اجاره‌ای",
          presale: "پیش‌فروش",
          exchange: "تهاتر",
          other: "سایر",
        };
        return (
          <div className="table-cell-secondary">
            {usageMap[usageType] || usageType}
          </div>
        );
      },
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
        const state = row.original;
        const isActive = state.is_active;
        const canUpdate = hasPermission("real_estate.state.update");

        if (onToggleActive) {
          return (
            <div onClick={(e) => e.stopPropagation()}>
              <Switch
                checked={isActive}
                disabled={!canUpdate}
                onCheckedChange={() => onToggleActive(state)}
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
        return <DataTableRowActions row={row} actions={actions} />;
      },
      enableSorting: false,
      enableHiding: false,
      size: 60,
      minSize: 60,
      maxSize: 60,
    },
  ];

  return baseColumns;
};

