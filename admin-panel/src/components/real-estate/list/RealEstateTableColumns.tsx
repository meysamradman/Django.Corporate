import type { ColumnDef } from "@tanstack/react-table";
import type { Property } from "@/types/real_estate/realEstate";
import { Badge } from "@/components/elements/Badge";
import { Switch } from "@/components/elements/Switch";
import { formatDate } from "@/core/utils/format";
import { DataTableRowActions } from "@/components/tables/DataTableRowActions";
import type { DataTableRowAction } from "@/types/shared/table";
import { ProtectedLink, usePermission } from "@/core/permissions";
import { Checkbox } from "@/components/elements/Checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/elements/Avatar";
import { mediaService } from "@/components/media/services";

export const usePropertyColumns = (
  actions: DataTableRowAction<Property>[] = [],
  onToggleActive?: (property: Property) => void
) => {
  const { hasPermission } = usePermission();

  const baseColumns: ColumnDef<Property>[] = [
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
        const property = row.original;
        const imageUrl = property.main_image?.file_url
          ? mediaService.getMediaUrlFromObject({ file_url: property.main_image.file_url } as any)
          : property.main_image?.url
            ? mediaService.getMediaUrlFromObject({ file_url: property.main_image.url } as any)
            : "";

        const getInitial = () => {
          if (!property.title) return "؟";
          return property.title.charAt(0).toUpperCase();
        };

        return (
          <ProtectedLink
            to={`/real-estate/properties/${property.id}/view`}
            permission="real_estate.property.read"
            className="flex items-center gap-3"
          >
            <Avatar className="table-avatar">
              {imageUrl ? (
                <AvatarImage src={imageUrl} alt={property.title} />
              ) : (
                <AvatarFallback className="table-cell-avatar-fallback">
                  {getInitial()}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="table-cell-primary table-cell-wide">
              {property.title}
            </div>
          </ProtectedLink>
        );
      },
      enableSorting: true,
      enableHiding: true,
      minSize: 200,
    },
    {
      accessorKey: "property_type",
      header: () => <div className="table-header-text">نوع ملک</div>,
      cell: ({ row }) => {
        const propertyType = row.original.property_type;
        return (
          <div className="table-cell-secondary">
            {propertyType?.title || '-'}
          </div>
        );
      },
      enableSorting: false,
      enableHiding: true,
      minSize: 120,
    },
    {
      accessorKey: "state",
      header: () => <div className="table-header-text">وضعیت</div>,
      cell: ({ row }) => {
        const state = row.original.state;
        return (
          <div className="table-badge-container">
            {state ? (
              <Badge variant="blue">{state.title}</Badge>
            ) : (
              <Badge variant="gray">-</Badge>
            )}
          </div>
        );
      },
      enableSorting: false,
      enableHiding: true,
      minSize: 120,
    },
    {
      id: "city",
      accessorKey: "city_name",
      header: () => <div className="table-header-text">شهر</div>,
      cell: ({ row }) => (
        <div className="table-cell-secondary">
          {row.original.city_name || '-'}
        </div>
      ),
      enableSorting: false,
      enableHiding: true,
      minSize: 120,
    },
    {
      accessorKey: "price",
      header: () => <div className="table-header-text">قیمت</div>,
      cell: ({ row }) => {
        const property = row.original;
        const price = property.price || property.sale_price || property.pre_sale_price || property.monthly_rent;
        const currency = property.currency || 'تومان';

        if (!price) {
          return <div className="table-cell-secondary">-</div>;
        }

        const formattedPrice = new Intl.NumberFormat('fa-IR').format(price);
        return (
          <div className="table-cell-primary">
            {formattedPrice} {currency}
          </div>
        );
      },
      enableSorting: true,
      enableHiding: true,
      minSize: 150,
    },
    {
      accessorKey: "status",
      header: () => <div className="table-header-text">وضعیت فرآیند</div>,
      cell: ({ row }) => {
        const status = row.original.status;
        const statusMap: Record<string, { label: string; variant: any }> = {
          active: { label: "فعال", variant: "green" },
          pending: { label: "در حال معامله", variant: "yellow" },
          sold: { label: "فروخته شده", variant: "red" },
          rented: { label: "اجاره داده شده", variant: "blue" },
          archived: { label: "بایگانی شده", variant: "gray" },
        };
        const config = statusMap[status] || { label: status, variant: "gray" };
        return (
          <div className="table-badge-container">
            <Badge variant={config.variant}>{config.label}</Badge>
          </div>
        );
      },
      enableSorting: true,
      enableHiding: true,
      minSize: 120,
    },
    {
      accessorKey: "is_published",
      header: () => <div className="table-header-text">انتشار</div>,
      cell: ({ row }) => (
        <div className="table-badge-container">
          {row.original.is_published ? (
            <Badge variant="green">منتشر شده</Badge>
          ) : (
            <Badge variant="yellow">پیش‌نویس</Badge>
          )}
        </div>
      ),
      enableSorting: true,
      enableHiding: true,
      minSize: 120,
    },
    {
      accessorKey: "is_featured",
      header: () => <div className="table-header-text">ویژه</div>,
      cell: ({ row }) => (
        <div className="table-badge-container">
          {row.original.is_featured ? (
            <Badge variant="orange">ویژه</Badge>
          ) : (
            <Badge variant="gray">عادی</Badge>
          )}
        </div>
      ),
      enableSorting: true,
      enableHiding: true,
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
        const property = row.original;
        const isActive = property.is_active;
        const canUpdate = hasPermission("real_estate.property.update");

        if (onToggleActive) {
          return (
            <div onClick={(e) => e.stopPropagation()}>
              <Switch
                checked={isActive}
                disabled={!canUpdate}
                onCheckedChange={() => onToggleActive(property)}
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

