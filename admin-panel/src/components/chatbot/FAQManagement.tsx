import { useState, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useFAQList, useDeleteFAQ } from "@/components/ai/chatbot/hooks/useChatbot";
import type { FAQ } from "@/types/chatbot/chatbot";
import { DataTable } from "@/components/tables/DataTable";
import type { ColumnDef, SortingState, OnChangeFn } from "@tanstack/react-table";
import type { TablePaginationState } from "@/types/shared/pagination";
import { Badge } from "@/components/elements/Badge";
import { DataTableRowActions } from "@/components/tables/DataTableRowActions";
import { Plus, MessageSquare, Edit, Trash2 } from "lucide-react";
import { ProtectedButton } from "@/core/permissions";
import { Skeleton } from "@/components/elements/Skeleton";
import { TruncatedText } from "@/components/elements/TruncatedText";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/elements/AlertDialog";

export function FAQManagement() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [deletingFAQ, setDeletingFAQ] = useState<FAQ | null>(null);

  const [pagination, setPagination] = useState<TablePaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const [sorting, setSorting] = useState<SortingState>([
    { id: "order", desc: false },
  ]);

  const { data: allFAQs = [], isLoading } = useFAQList();
  const deleteFAQ = useDeleteFAQ();

  const { paginatedFAQs, pageCount } = useMemo(() => {
    const sorted = [...allFAQs].sort((a, b) => {
      const sortColumn = sorting[0];
      if (!sortColumn) return 0;

      const aValue = a[sortColumn.id as keyof FAQ];
      const bValue = b[sortColumn.id as keyof FAQ];

      if (aValue === undefined || aValue === null) return 1;
      if (bValue === undefined || bValue === null) return -1;

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortColumn.desc ? bValue - aValue : aValue - bValue;
      }

      const aStr = String(aValue);
      const bStr = String(bValue);

      if (sortColumn.desc) {
        return bStr.localeCompare(aStr, "fa");
      }
      return aStr.localeCompare(bStr, "fa");
    });

    const totalPages = Math.ceil(sorted.length / pagination.pageSize);
    const startIndex = pagination.pageIndex * pagination.pageSize;
    const endIndex = startIndex + pagination.pageSize;
    const paginated = sorted.slice(startIndex, endIndex);

    return {
      paginatedFAQs: paginated,
      pageCount: totalPages || 1,
    };
  }, [allFAQs, pagination, sorting]);

  const handlePaginationChange: OnChangeFn<TablePaginationState> = (
    updaterOrValue
  ) => {
    const newPagination =
      typeof updaterOrValue === "function"
        ? updaterOrValue(pagination)
        : updaterOrValue;
    setPagination(newPagination);
  };

  const handleSortingChange: OnChangeFn<SortingState> = (updaterOrValue) => {
    const newSorting =
      typeof updaterOrValue === "function"
        ? updaterOrValue(sorting)
        : updaterOrValue;
    setSorting(newSorting);
  };

  const handleFilterChange = useCallback((_filterId: string | 'search', _value: unknown) => {
  }, []);

  const handleCreate = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("action", "create-faq");
    setSearchParams(newParams);
  };

  const handleEdit = (faq: FAQ) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("action", "edit-faq");
    newParams.set("id", faq.id.toString());
    setSearchParams(newParams);
  };

  const handleDelete = async () => {
    if (deletingFAQ) {
      await deleteFAQ.mutateAsync(deletingFAQ.id);
      setDeletingFAQ(null);
    }
  };

  const columns: ColumnDef<FAQ>[] = [
    {
      id: "order",
      accessorKey: "order",
      header: () => <div className="table-header-text text-center">ترتیب</div>,
      cell: ({ row }) => (
        <div className="flex items-center justify-center w-full">
          <Badge variant="outline" className="font-mono text-xs">
            {row.original.order}
          </Badge>
        </div>
      ),
      enableSorting: true,
      enableHiding: true,
      size: 80,
      minSize: 80,
      maxSize: 80,
    },
    {
      accessorKey: "question",
      header: () => <div className="table-header-text">سوال</div>,
      cell: ({ row }) => (
        <div className="table-cell-primary table-cell-wide min-w-0">
          <TruncatedText
            text={row.original.question}
            maxLength={50}
          />
        </div>
      ),
      enableSorting: true,
      enableHiding: true,
      size: 200,
      minSize: 150,
    },
    {
      accessorKey: "answer",
      header: () => <div className="table-header-text">پاسخ</div>,
      cell: ({ row }) => (
        <div className="table-cell-muted table-cell-wide min-w-0">
          <TruncatedText
            text={row.original.answer}
            maxLength={50}
          />
        </div>
      ),
      enableSorting: true,
      enableHiding: true,
      size: 200,
      minSize: 150,
    },
    {
      accessorKey: "keywords",
      header: () => <div className="table-header-text">کلمات کلیدی</div>,
      cell: ({ row }) => {
        const keywords = row.original.keywords
          ? row.original.keywords.split(",").map((k) => k.trim()).filter(Boolean)
          : [];
        return (
          <div className="flex flex-wrap gap-1">
            {keywords.length > 0 ? (
              keywords.slice(0, 3).map((keyword, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {keyword}
                </Badge>
              ))
            ) : (
              <span className="text-xs text-font-s">-</span>
            )}
            {keywords.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{keywords.length - 3}
              </Badge>
            )}
          </div>
        );
      },
      enableSorting: false,
      enableHiding: true,
      size: 180,
      minSize: 150,
    },
    {
      accessorKey: "is_active",
      header: () => <div className="table-header-text">وضعیت</div>,
      cell: ({ row }) => (
        <div className="table-badge-container">
          <Badge variant={row.original.is_active ? "green" : "gray"}>
            {row.original.is_active ? "فعال" : "غیرفعال"}
          </Badge>
        </div>
      ),
      enableSorting: true,
      enableHiding: true,
      size: 120,
      minSize: 120,
      maxSize: 120,
    },
    {
      id: "actions",
      header: () => <div className="text-center"></div>,
      cell: ({ row }) => (
        <div className="flex items-center justify-center w-full">
          <DataTableRowActions
            row={row}
            actions={[
              {
                label: "ویرایش",
                icon: <Edit className="h-4 w-4" />,
                onClick: () => handleEdit(row.original),
                permission: "chatbot.manage",
              },
              {
                label: "حذف",
                icon: <Trash2 className="h-4 w-4" />,
                onClick: () => setDeletingFAQ(row.original),
                permission: "chatbot.manage",
                isDestructive: true,
              },
            ]}
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
      size: 80,
      minSize: 80,
      maxSize: 80,
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {allFAQs.length === 0 ? (
          <div className="text-center py-12 border border-br rounded-lg bg-card">
            <MessageSquare className="h-12 w-12 text-font-s mx-auto mb-4" />
            <p className="text-font-s mb-4">هنوز سوال متداولی اضافه نشده است.</p>
            <ProtectedButton onClick={handleCreate} permission="chatbot.manage" variant="outline">
              <Plus className="h-4 w-4" />
              افزودن اولین سوال
            </ProtectedButton>
          </div>
        ) : (
          <div className="w-full overflow-hidden md:**:data-[slot=table-container]:overflow-visible **:data-[slot=table-container]:overflow-x-auto">
            <DataTable
              columns={columns}
              data={paginatedFAQs}
              pageCount={pageCount}
              isLoading={isLoading}
              onPaginationChange={handlePaginationChange}
              onSortingChange={handleSortingChange}
              clientFilters={{}}
              onFilterChange={handleFilterChange}
              state={{
                pagination,
                sorting,
              }}
              pageSizeOptions={[10, 20, 50]}
              customHeaderActions={
                <ProtectedButton onClick={handleCreate} permission="chatbot.manage" size="sm">
                  <Plus className="h-4 w-4" />
                  افزودن سوال
                </ProtectedButton>
              }
            />
          </div>
        )}
      </div>

      <AlertDialog open={!!deletingFAQ} onOpenChange={() => setDeletingFAQ(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف سوال متداول</AlertDialogTitle>
            <AlertDialogDescription>
              آیا مطمئن هستید که می‌خواهید سوال "{deletingFAQ?.question}" را حذف کنید؟
              این عمل غیرقابل بازگشت است.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-1 hover:bg-red-2">
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

