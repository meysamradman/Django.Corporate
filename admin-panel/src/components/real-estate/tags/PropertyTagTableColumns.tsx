import type { ColumnDef } from "@tanstack/react-table";
import type { PropertyTag } from "@/types/real_estate/tags/propertyTag";
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

export const usePropertyTagColumns = (
  actions: DataTableRowAction<PropertyTag>[] = [],
  onToggleActive?: (tag: PropertyTag) => void
) => {
  const navigate = useNavigate();
  
  const baseColumns: ColumnDef<PropertyTag>[] = [
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
        const tag = row.original;
        
        const getInitial = () => {
          if (!tag.title) return "؟";
          return tag.title.charAt(0).toUpperCase();
        };

        return (
          <ProtectedLink 
            to={`/real-estate/tags/${tag.id}/edit`} 
            permission="property_tag.read"
            className="flex items-center gap-3"
          >
            <Avatar className="table-avatar">
              <AvatarFallback className="table-cell-avatar-fallback">
                {getInitial()}
              </AvatarFallback>
            </Avatar>
            <div className="table-cell-primary table-cell-wide">
              {tag.title}
            </div>
          </ProtectedLink>
        );
      },
      enableSorting: true,
      enableHiding: true,
      minSize: 200,
    },
    {
      accessorKey: "slug",
      header: () => <div className="table-header-text">نامک</div>,
      cell: ({ row }) => (
        <div className="table-cell-secondary">
          {row.original.slug}
        </div>
      ),
      enableSorting: true,
      enableHiding: true,
      minSize: 150,
    },
    {
      accessorKey: "is_public",
      header: () => <div className="table-header-text">عمومی</div>,
      cell: ({ row }) => (
        <div className="table-badge-container">
          {row.original.is_public ? (
            <Badge variant="blue">عمومی</Badge>
          ) : (
            <Badge variant="gray">خصوصی</Badge>
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
        const tag = row.original;
        const isActive = tag.is_active;
        
        if (onToggleActive) {
          return (
            <div onClick={(e) => e.stopPropagation()}>
              <Switch
                checked={isActive ?? true}
                onCheckedChange={() => onToggleActive(tag)}
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
        const defaultActions: DataTableRowAction<PropertyTag>[] = [
          {
            label: "ویرایش",
            icon: <Edit className="h-4 w-4" />,
            onClick: (tag) => navigate(`/real-estate/tags/${tag.id}/edit`),
          },
          {
            label: "حذف",
            icon: <Trash2 className="h-4 w-4" />,
            onClick: (_tag) => {},
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
