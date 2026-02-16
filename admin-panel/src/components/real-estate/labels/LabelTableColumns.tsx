import type { ColumnDef } from "@tanstack/react-table";
import type { PropertyLabel } from "@/types/real_estate/label/realEstateLabel";
import { Badge } from "@/components/elements/Badge";
import { Switch } from "@/components/elements/Switch";
import { formatDate } from "@/core/utils/commonFormat";
import { DataTableRowActions } from "@/components/tables/DataTableRowActions";
import type { DataTableRowAction } from "@/types/shared/table";
import { usePermission } from "@/core/permissions";
import { Checkbox } from "@/components/elements/Checkbox";
import { Avatar, AvatarFallback } from "@/components/elements/Avatar";

export const usePropertyLabelColumns = (
  actions: DataTableRowAction<PropertyLabel>[] = [],
  onToggleActive?: (label: PropertyLabel) => void,
  onEditLabel?: (id: number) => void
) => {
  const { hasPermission } = usePermission();

  const baseColumns: ColumnDef<PropertyLabel>[] = [
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
        const label = row.original;

        const getInitial = () => {
          if (!label.title) return "؟";
          return label.title.charAt(0).toUpperCase();
        };

        const canEdit = hasPermission("real_estate.label.update");
        const isEditable = canEdit && !!onEditLabel;

        return (
          <button
            type="button"
            onClick={() => onEditLabel?.(Number(label.id))}
            disabled={!isEditable}
            className={`flex items-center gap-3 ${isEditable ? "cursor-pointer" : "cursor-not-allowed"}`}
          >
            <Avatar className="table-avatar">
              <AvatarFallback className="table-cell-avatar-fallback">
                {getInitial()}
              </AvatarFallback>
            </Avatar>
            <div className="table-cell-primary table-cell-wide">
              {label.title}
            </div>
          </button>
        );
      },
      enableSorting: true,
      enableHiding: true,
      minSize: 200,
    },
    {
      accessorKey: "property_count",
      header: () => <div className="table-header-text">تعداد ملک</div>,
      cell: ({ row }) => (
        <div className="table-cell-secondary text-center">
          <Badge variant="gray">{row.original.property_count || 0}</Badge>
        </div>
      ),
      enableSorting: true,
      enableHiding: true,
      size: 100,
      minSize: 100,
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
        const label = row.original;
        const isActive = label.is_active;
        const canUpdate = hasPermission("real_estate.label.update");

        if (onToggleActive) {
          return (
            <div onClick={(e) => e.stopPropagation()}>
              <Switch
                checked={isActive}
                disabled={!canUpdate}
                onCheckedChange={() => onToggleActive(label)}
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
