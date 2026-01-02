import { type ReactNode } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import type { Portfolio } from "@/types/portfolio/portfolio";
import { Edit, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/elements/Badge";
import { Switch } from "@/components/elements/Switch";
import { formatDate } from "@/core/utils/format";
import { DataTableRowActions } from "@/components/tables/DataTableRowActions";
import type { DataTableRowAction } from "@/types/shared/table";
import { ProtectedLink, usePermission } from "@/core/permissions";
import { Checkbox } from "@/components/elements/Checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/elements/Avatar";
import { mediaService } from "@/components/media/services";

export interface PortfolioAction {
  label: string;
  icon: ReactNode;
  onClick: (portfolio: Portfolio) => void;
  isDestructive?: boolean;
}

export const usePortfolioColumns = (
  actions: DataTableRowAction<Portfolio>[] = [],
  onToggleActive?: (portfolio: Portfolio) => void
) => {
  const navigate = useNavigate();
  const { hasPermission } = usePermission();
  
  const baseColumns: ColumnDef<Portfolio>[] = [
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
        const portfolio = row.original;
        const imageUrl = portfolio.main_image?.file_url 
          ? mediaService.getMediaUrlFromObject({ file_url: portfolio.main_image.file_url } as any)
          : "";
          
        const getInitial = () => {
          if (!portfolio.title) return "؟";
          return portfolio.title.charAt(0).toUpperCase();
        };

        return (
          <ProtectedLink 
            to={`/portfolios/${portfolio.id}/view`} 
            permission="portfolio.read"
            className="flex items-center gap-3"
          >
            <Avatar className="table-avatar">
              {imageUrl ? (
                <AvatarImage src={imageUrl} alt={portfolio.title} />
              ) : (
                <AvatarFallback className="table-cell-avatar-fallback">
                  {getInitial()}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="table-cell-primary table-cell-wide">
              {portfolio.title}
            </div>
          </ProtectedLink>
        );
      },
      enableSorting: true,
      enableHiding: true,
      minSize: 200,
    },
    {
      accessorKey: "status",
      header: () => <div className="table-header-text">وضعیت</div>,
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <div className="table-badge-container">
            {status === "published" ? (
              <Badge variant="green">منتشر شده</Badge>
            ) : (
              <Badge variant="yellow">پیش‌نویس</Badge>
            )}
          </div>
        );
      },
      enableSorting: true,
      enableHiding: true,
      minSize: 150,
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
      accessorKey: "categories",
      header: () => <div className="table-header-text">دسته‌بندی‌ها</div>,
      cell: ({ row }) => {
        const portfolio = row.original;
        const categories = portfolio.categories || [];
        
        if (categories.length === 0) {
          return (
            <div className="table-cell-secondary">
              بدون دسته
            </div>
          );
        }

        const renderCategoryPath = (category: any) => {
          if (category.parent) {
            return `${category.parent.name} > ${category.name}`;
          }
          return category.name;
        };
        
        return (
          <div className="flex flex-wrap gap-1">
            {categories.slice(0, 2).map((category) => (
              <Badge key={category.id} variant="purple" className="text-xs" title={renderCategoryPath(category)}>
                {category.name.length > 15 ? `${category.name.substring(0, 15)}...` : category.name}
              </Badge>
            ))}
            {categories.length > 2 && (
              <Badge variant="purple" className="text-xs">
                +{categories.length - 2}
              </Badge>
            )}
          </div>
        );
      },
      enableSorting: false,
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
        const portfolio = row.original;
        const isActive = portfolio.is_active;
        const canUpdate = hasPermission("portfolio.update");
        
        if (onToggleActive) {
          return (
            <div onClick={(e) => e.stopPropagation()}>
              <Switch
                checked={isActive}
                disabled={!canUpdate}
                onCheckedChange={() => onToggleActive(portfolio)}
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
        const defaultActions: DataTableRowAction<Portfolio>[] = [
          {
            label: "ویرایش",
            icon: <Edit className="h-4 w-4" />,
            onClick: (portfolio) => navigate(`/portfolios/${portfolio.id}/edit`),
            permission: "portfolio.update",
          },
          {
            label: "حذف",
            icon: <Trash2 className="h-4 w-4" />,
            onClick: (_portfolio) => {},
            isDestructive: true,
            permission: "portfolio.delete",
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