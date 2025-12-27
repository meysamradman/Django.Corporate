import { type ReactNode } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import type { PropertyLabel } from "@/types/real_estate/label/realEstateLabel";
import { Edit, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/elements/Badge";
import { Switch } from "@/components/elements/Switch";
import { formatDate } from "@/core/utils/format";
import { DataTableRowActions } from "@/components/tables/DataTableRowActions";
import type { DataTableRowAction } from "@/types/shared/table";
import { ProtectedLink } from "@/components/admins/permissions";
import { Checkbox } from "@/components/elements/Checkbox";
import { Avatar, AvatarFallback } from "@/components/elements/Avatar";

export const usePropertyLabelColumns = (
  actions: DataTableRowAction<PropertyLabel>[] = [],
  onToggleActive?: (label: PropertyLabel) => void
) => {
  const navigate = useNavigate();
  
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

        return (
          <ProtectedLink 
            to={`/real-estate/labels/${label.id}/edit`} 
            permission="property_label.read"
            className="flex items-center gap-3"
          >
            <Avatar className="table-avatar">
              <AvatarFallback className="table-cell-avatar-fallback">
                {getInitial()}
              </AvatarFallback>
            </Avatar>
            <div className="table-cell-primary table-cell-wide">
              {label.title}
            </div>
          </ProtectedLink>
        );
      },
      enableSorting: true,
      enableHiding: true,
      minSize: 200,
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
        
        if (onToggleActive) {
          return (
            <div onClick={(e) => e.stopPropagation()}>
              <Switch
                checked={isActive}
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
        const defaultActions: DataTableRowAction<PropertyLabel>[] = [
          {
            label: "ویرایش",
            icon: <Edit className="h-4 w-4" />,
            onClick: (label) => navigate(`/real-estate/labels/${label.id}/edit`),
          },
          {
            label: "حذف",
            icon: <Trash2 className="h-4 w-4" />,
            onClick: (_label) => {},
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
  
  return baseColumns;
};
