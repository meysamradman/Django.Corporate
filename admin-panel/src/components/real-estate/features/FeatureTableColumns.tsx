import type { ColumnDef } from "@tanstack/react-table";
import type { PropertyFeature } from "@/types/real_estate/feature/realEstateFeature";
import { Badge } from "@/components/elements/Badge";
import { Switch } from "@/components/elements/Switch";
import { formatDate } from "@/core/utils/commonFormat";
import { DataTableRowActions } from "@/components/tables/DataTableRowActions";
import type { DataTableRowAction } from "@/types/shared/table";
import { ProtectedLink, usePermission } from "@/core/permissions";
import { Checkbox } from "@/components/elements/Checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/elements/Avatar";
import { mediaService } from "@/components/media/services";

export const usePropertyFeatureColumns = (
  actions: DataTableRowAction<PropertyFeature>[] = [],
  onToggleActive?: (feature: PropertyFeature) => void
) => {
  const { hasPermission } = usePermission();

  const baseColumns: ColumnDef<PropertyFeature>[] = [
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
        const feature = row.original;
        const imageUrl = feature.image_url
          ? mediaService.getMediaUrlFromObject({ file_url: feature.image_url } as any)
          : feature.image
            ? mediaService.getMediaUrlFromObject(feature.image)
            : "";

        const getInitial = () => {
          if (!feature.title) return "؟";
          return feature.title.charAt(0).toUpperCase();
        };

        return (
          <ProtectedLink
            to={`/real-estate/features/${feature.id}/edit`}
            permission="real_estate.feature.update"
            className="flex items-center gap-3"
          >
            <Avatar className="table-avatar">
              {imageUrl ? (
                <AvatarImage src={imageUrl} alt={feature.title} />
              ) : (
                <AvatarFallback className="table-cell-avatar-fallback">
                  {getInitial()}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="table-cell-primary table-cell-wide">
              {feature.title}
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
      accessorKey: "group",
      header: () => <div className="table-header-text">دسته‌بندی</div>,
      cell: ({ row }) => (
        <div className="table-cell-secondary">
          {row.original.group || '-'}
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
        const feature = row.original;
        const isActive = feature.is_active;
        const canUpdate = hasPermission("real_estate.feature.update");

        if (onToggleActive) {
          return (
            <div onClick={(e) => e.stopPropagation()}>
              <Switch
                checked={isActive}
                disabled={!canUpdate}
                onCheckedChange={() => onToggleActive(feature)}
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
