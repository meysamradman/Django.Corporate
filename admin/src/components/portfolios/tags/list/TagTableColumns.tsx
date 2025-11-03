import { ColumnDef } from "@tanstack/react-table";
import { PortfolioTag } from "@/types/portfolio/tags/portfolioTag";
import { Button } from "@/components/elements/Button";
import { Edit, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/elements/Badge";
import Link from "next/link";
import { formatDate } from "@/core/utils/format";
import { DataTableRowActions, type DataTableRowAction } from "@/components/tables/DataTableRowActions";
import { Checkbox } from "@/components/elements/Checkbox";

export interface TagAction {
  label: string;
  icon: React.ReactNode;
  onClick: (tag: PortfolioTag) => void;
  isDestructive?: boolean;
}

export const useTagColumns = (actions: DataTableRowAction<PortfolioTag>[] = []) => {
  const router = useRouter();
  
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
        <Link href={`/portfolios/tags/${row.original.id}/edit`} className="table-cell-text hover:underline">
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
        <span className="table-cell-text table-cell-muted">
          {row.original.slug}
        </span>
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
            <Badge variant="blue">فعال</Badge>
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
            <Badge variant="sky">عمومی</Badge>
          ) : (
            <Badge variant="slate">خصوصی</Badge>
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
        // Default actions if none provided
        const defaultActions: DataTableRowAction<PortfolioTag>[] = [
          {
            label: "ویرایش",
            icon: <Edit className="h-4 w-4" />,
            onClick: (tag) => router.push(`/portfolios/tags/${tag.id}/edit`),
          },
          {
            label: "حذف",
            icon: <Trash2 className="h-4 w-4" />,
            onClick: (tag) => {
              console.log("Delete tag", tag.id);
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