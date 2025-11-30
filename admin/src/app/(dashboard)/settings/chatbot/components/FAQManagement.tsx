"use client";

import React, { useState, useMemo } from "react";
import { useFAQList, useDeleteFAQ } from "@/core/hooks/useChatbot";
import { FAQ } from "@/api/chatbot/route";
import { DataTable } from "@/components/tables/DataTable";
import { ColumnDef, SortingState, OnChangeFn } from "@tanstack/react-table";
import { TablePaginationState } from "@/types/shared/pagination";
import { Button } from "@/components/elements/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/elements/Card";
import { Badge } from "@/components/elements/Badge";
import { DataTableRowActions } from "@/components/tables/DataTableRowActions";
import { Plus, MessageSquare, Edit, Trash2 } from "lucide-react";
import { FAQDialog } from "./FAQDialog";
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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFAQ, setEditingFAQ] = useState<FAQ | null>(null);
  const [deletingFAQ, setDeletingFAQ] = useState<FAQ | null>(null);

  // Pagination state
  const [pagination, setPagination] = useState<TablePaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  // Sorting state
  const [sorting, setSorting] = useState<SortingState>([
    { id: "order", desc: false },
  ]);

  const { data: allFAQs = [], isLoading } = useFAQList();
  const deleteFAQ = useDeleteFAQ();

  // Client-side pagination and sorting
  const { paginatedFAQs, pageCount } = useMemo(() => {
    // Sort data
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

    // Calculate pagination
    const totalPages = Math.ceil(sorted.length / pagination.pageSize);
    const startIndex = pagination.pageIndex * pagination.pageSize;
    const endIndex = startIndex + pagination.pageSize;
    const paginated = sorted.slice(startIndex, endIndex);

    return {
      paginatedFAQs: paginated,
      pageCount: totalPages || 1,
    };
  }, [allFAQs, pagination, sorting]);

  // Handle pagination change
  const handlePaginationChange: OnChangeFn<TablePaginationState> = (
    updaterOrValue
  ) => {
    const newPagination =
      typeof updaterOrValue === "function"
        ? updaterOrValue(pagination)
        : updaterOrValue;
    setPagination(newPagination);
  };

  // Handle sorting change
  const handleSortingChange: OnChangeFn<SortingState> = (updaterOrValue) => {
    const newSorting =
      typeof updaterOrValue === "function"
        ? updaterOrValue(sorting)
        : updaterOrValue;
    setSorting(newSorting);
  };

  const handleCreate = () => {
    setEditingFAQ(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (faq: FAQ) => {
    setEditingFAQ(faq);
    setIsDialogOpen(true);
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
      header: () => <div className="table-header-text">ترتیب</div>,
      cell: ({ row }) => (
        <div className="table-badge-container justify-center">
          <Badge variant="outline" className="font-mono">
            {row.original.order}
          </Badge>
        </div>
      ),
      enableSorting: true,
      enableHiding: true,
      size: 60,
      minSize: 60,
      maxSize: 60,
    },
    {
      accessorKey: "question",
      header: () => <div className="table-header-text">سوال</div>,
      cell: ({ row }) => (
        <div className="table-cell-primary table-cell-wide">
          <TruncatedText 
            text={row.original.question} 
            maxLength={50}
          />
        </div>
      ),
      enableSorting: true,
      enableHiding: true,
      size: 200,
      minSize: 200,
      maxSize: 200,
    },
    {
      accessorKey: "answer",
      header: () => <div className="table-header-text">پاسخ</div>,
      cell: ({ row }) => (
        <div className="table-cell-muted table-cell-wide">
          <TruncatedText 
            text={row.original.answer} 
            maxLength={50}
          />
        </div>
      ),
      enableSorting: true,
      enableHiding: true,
      size: 200,
      minSize: 200,
      maxSize: 200,
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
      minSize: 150,
    },
    {
      id: "actions",
      header: () => <div className="w-[60px] text-center"></div>,
      cell: ({ row }) => (
        <div className="flex items-center justify-center w-[60px]">
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
      size: 60,
      minSize: 60,
      maxSize: 60,
    },
  ];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              مدیریت سوالات متداول
            </CardTitle>
            <ProtectedButton onClick={handleCreate} permission="chatbot.manage">
              <Plus className="h-4 w-4" />
              افزودن سوال
            </ProtectedButton>
          </div>
        </CardHeader>
        <CardContent>
          {allFAQs.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-font-s mx-auto mb-4" />
              <p className="text-font-s mb-4">هنوز سوال متداولی اضافه نشده است.</p>
              <ProtectedButton onClick={handleCreate} permission="chatbot.manage" variant="outline">
                <Plus className="h-4 w-4" />
                افزودن اولین سوال
              </ProtectedButton>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={paginatedFAQs}
              pageCount={pageCount}
              isLoading={isLoading}
              onPaginationChange={handlePaginationChange}
              onSortingChange={handleSortingChange}
              clientFilters={{}}
              onFilterChange={() => {}}
              state={{
                pagination,
                sorting,
              }}
              pageSizeOptions={[10, 20, 50]}
            />
          )}
        </CardContent>
      </Card>

      <FAQDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setEditingFAQ(null);
        }}
        faq={editingFAQ}
      />

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

