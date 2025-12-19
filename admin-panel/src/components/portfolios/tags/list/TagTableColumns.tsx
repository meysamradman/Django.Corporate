import type { ColumnDef } from "@tanstack/react-table";
import type { PortfolioTag } from "@/types/portfolio/tags/portfolioTag";
import { Edit, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/elements/Badge";
import { Link } from "react-router-dom";
import { formatDate } from "@/core/utils/format";
import { DataTableRowActions } from "@/components/tables/DataTableRowActions";
import type { DataTableRowAction } from "@/types/shared/table";
import { Checkbox } from "@/components/elements/Checkbox";

export interface TagAction {
  label: string;
  icon: React.ReactNode;
  onClick: (tag: PortfolioTag) => void;
  isDestructive?: boolean;
}

export const useTagColumns = (actions: DataTableRowAction<PortfolioTag>[] = []) => {
  const navigate = useNavigate();
  
  const baseColumns: ColumnDef<PortfolioTag>[] = [
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
      cell: ({ row }) => (
        <Link to={`/portfolios/tags/${row.original.id}/edit`} className="table-cell-primary table-cell-wide">
          {row.original.name}
        </Link>
      ),
      enableSorting: true,
      enableHiding: true,
      minSize: 200,
    },
    {
      accessorKey: "slug",
      header: () => <div className="table-header-text">اسلاگ</div>,
      cell: ({ row }) => (
        <div className="table-cell-muted table-cell-wide">
          {row.original.slug}
        </div>
      ),
      enableSorting: false,
      enableHiding: true,
      minSize: 200,
    },
    {
      accessorKey: "is_active",
      header: () => <div className="table-header-text">فعال</div>,
      cell: ({ row }) => (
        <div className="table-badge-container">
          {row.original.is_active ? (
            <Badge variant="green">فعال</Badge>
          ) : (
            <Badge variant="red">غیرفعال</Badge>
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
      id: "actions",
      cell: ({ row }) => {
        const defaultActions: DataTableRowAction<PortfolioTag>[] = [
          {
            label: "ویرایش",
            icon: <Edit className="h-4 w-4" />,
            onClick: (tag) => navigate(`/portfolios/tags/${tag.id}/edit`),
          },
          {
            label: "حذف",
            icon: <Trash2 className="h-4 w-4" />,
            onClick: (tag) => {},
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