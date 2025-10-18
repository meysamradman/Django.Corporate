import { ColumnDef } from "@tanstack/react-table";
import { PortfolioOption } from "@/types/portfolio/options/portfolioOption";
import { Button } from "@/components/elements/Button";
import { Edit, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/elements/Badge";
import Link from "next/link";
import { formatDate } from "@/core/utils/format";
import { DataTableRowActions, type DataTableRowAction } from "@/components/tables/DataTableRowActions";
import { Checkbox } from "@/components/elements/Checkbox";

export interface OptionAction {
  label: string;
  icon: React.ReactNode;
  onClick: (option: PortfolioOption) => void;
  isDestructive?: boolean;
}

export const useOptionColumns = (actions: DataTableRowAction<PortfolioOption>[] = []) => {
  const router = useRouter();
  
  const baseColumns: ColumnDef<PortfolioOption>[] = [
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
      cell: ({ row }) => {
        const option = row.original;
        return (
          <Link href={`/portfolios/options/${option.id}/edit`} className="table-cell-primary table-cell-wide hover:underline">
            {option.name}
          </Link>
        );
      },
      enableSorting: true,
      enableHiding: true,
      minSize: 200,
    },
    {
      accessorKey: "slug",
      header: () => <div className="table-header-text">اسلاگ</div>,
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
        const defaultActions: DataTableRowAction<PortfolioOption>[] = [
          {
            label: "ویرایش",
            icon: <Edit className="h-4 w-4" />,
            onClick: (option) => router.push(`/portfolios/options/${option.id}/edit`),
          },
          {
            label: "حذف",
            icon: <Trash2 className="h-4 w-4" />,
            onClick: (option) => {
              console.log("Delete option", option.id);
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