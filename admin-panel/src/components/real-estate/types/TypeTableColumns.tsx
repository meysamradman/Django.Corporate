import type { ColumnDef } from "@tanstack/react-table";
import type { PropertyType } from "@/types/real_estate/type/propertyType";
import { Badge } from "@/components/elements/Badge";
import { Switch } from "@/components/elements/Switch";
import { formatDate } from "@/core/utils/commonFormat";
import { DataTableRowActions } from "@/components/tables/DataTableRowActions";
import type { DataTableRowAction } from "@/types/shared/table";
import { ProtectedLink, usePermission } from "@/core/permissions";
import { Checkbox } from "@/components/elements/Checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/elements/Avatar";
import { mediaService } from "@/components/media/services";

export const usePropertyTypeColumns = (
  actions: DataTableRowAction<PropertyType>[] = [],
  onToggleActive?: (type: PropertyType) => void
) => {
  const { hasPermission } = usePermission();

  const baseColumns: ColumnDef<PropertyType>[] = [
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
        const type = row.original;
        const imageUrl = type.image_url
          ? mediaService.getMediaUrlFromObject({ file_url: type.image_url } as any)
          : type.image
            ? mediaService.getMediaUrlFromObject(type.image)
            : "";

        const getInitial = () => {
          if (!type.title) return "؟";
          return type.title.charAt(0).toUpperCase();
        };

        return (
          <ProtectedLink
            to={`/real-estate/types/${type.id}/edit`}
            permission="real_estate.type.update"
            className="flex items-center gap-3"
          >
            <Avatar className="table-avatar">
              {imageUrl ? (
                <AvatarImage src={imageUrl} alt={type.title} />
              ) : (
                <AvatarFallback className="table-cell-avatar-fallback">
                  {getInitial()}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="table-cell-primary table-cell-wide">
              {type.title}
            </div>
          </ProtectedLink>
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
      accessorKey: "display_order",
      header: () => <div className="table-header-text">ترتیب نمایش</div>,
      cell: ({ row }) => (
        <div className="table-cell-secondary">
          {row.original.display_order}
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
        const type = row.original;
        const isActive = type.is_active;
        const canUpdate = hasPermission("real_estate.type.update");

        if (onToggleActive) {
          return (
            <div onClick={(e) => e.stopPropagation()}>
              <Switch
                checked={isActive}
                disabled={!canUpdate}
                onCheckedChange={() => onToggleActive(type)}
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

