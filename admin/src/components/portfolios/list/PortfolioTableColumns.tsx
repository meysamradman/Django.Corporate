import { ColumnDef } from "@tanstack/react-table";
import { Portfolio } from "@/types/portfolio/portfolio";
import { Button } from "@/components/elements/Button";
import { Edit, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/elements/Badge";
import Link from "next/link";
import { formatDate } from "@/core/utils/format";
import { DataTableRowActions, type DataTableRowAction } from "@/components/tables/DataTableRowActions";
import { Checkbox } from "@/components/elements/Checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/elements/Avatar";
import { mediaService } from "@/components/media/services";

export interface PortfolioAction {
  label: string;
  icon: React.ReactNode;
  onClick: (portfolio: Portfolio) => void;
  isDestructive?: boolean;
}

export const usePortfolioColumns = (actions: DataTableRowAction<Portfolio>[] = []) => {
  const router = useRouter();
  
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
        // Use the main_image object directly from the API response
        const imageUrl = portfolio.main_image?.file_url 
          ? mediaService.getMediaUrlFromObject({ file_url: portfolio.main_image.file_url } as any)
          : "";
          
        const getInitial = () => {
          if (!portfolio.title) return "؟";
          return portfolio.title.charAt(0).toUpperCase();
        };

        return (
          <Link href={`/portfolios/${portfolio.id}/view`} className="flex items-center gap-3 hover:underline">
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
          </Link>
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
            <span className={`px-2 py-0.5 rounded-sm text-xs ${
              status === "published" 
                ? "bg-green-100 text-green-300" 
                : "bg-yellow-100 text-yellow-300"
            }`}>
              {status === "published" ? "منتشر شده" : "پیش‌نویس"}
            </span>
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
            <Badge variant="green">ویژه</Badge>
          ) : (
            <Badge variant="outline">عادی</Badge>
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
            <Badge variant="green">عمومی</Badge>
          ) : (
            <Badge variant="outline">خصوصی</Badge>
          )}
        </div>
      ),
      enableSorting: true,
      enableHiding: true,
      minSize: 150,
    },
    {
      accessorKey: "is_active", // اضافه کردن ستون فعال بودن
      header: () => <div className="table-header-text">فعال</div>,
      cell: ({ row }) => (
        <div className="table-badge-container">
          {row.original.is_active ? (
            <Badge variant="green">فعال</Badge>
          ) : (
            <Badge variant="outline">غیرفعال</Badge>
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
      accessorKey: "categories",
      header: () => <div className="table-header-text">دسته‌بندی‌ها</div>,
      cell: ({ row }) => {
        const portfolio = row.original;
        const categories = portfolio.categories || [];
        
        if (categories.length === 0) {
          return (
            <div className="table-cell-secondary">
              <span className="text-muted-foreground">بدون دسته</span>
            </div>
          );
        }
        
        // نمایش دسته‌بندی‌ها به صورت سلسله مراتبی
        const renderCategoryPath = (category: any) => {
          if (category.parent) {
            return `${category.parent.name} > ${category.name}`;
          }
          return category.name;
        };
        
        return (
          <div className="flex flex-wrap gap-1">
            {categories.slice(0, 2).map((category) => (
              <Badge key={category.id} variant="outline" className="text-xs" title={renderCategoryPath(category)}>
                {category.name.length > 15 ? `${category.name.substring(0, 15)}...` : category.name}
              </Badge>
            ))}
            {categories.length > 2 && (
              <Badge variant="outline" className="text-xs">
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
      id: "actions",
      cell: ({ row }) => {
        // Default actions if none provided
        const defaultActions: DataTableRowAction<Portfolio>[] = [
          {
            label: "ویرایش",
            icon: <Edit className="h-4 w-4" />,
            onClick: (portfolio) => router.push(`/portfolios/${portfolio.id}/edit`),
          },
          {
            label: "حذف",
            icon: <Trash2 className="h-4 w-4" />,
            onClick: (portfolio) => {
              // Delete portfolio functionality would go here
            },
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