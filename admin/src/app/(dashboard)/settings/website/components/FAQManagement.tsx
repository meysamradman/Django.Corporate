"use client";

import React, { useState } from "react";
import { useFAQList, useDeleteFAQ } from "@/core/hooks/useChatbot";
import { FAQ } from "@/api/chatbot/route";
import { DataTable } from "@/components/tables/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/elements/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/elements/Card";
import { Badge } from "@/components/elements/Badge";
import { DataTableRowActions } from "@/components/tables/DataTableRowActions";
import { Plus, MessageSquare, Edit, Trash2 } from "lucide-react";
import { FAQDialog } from "./FAQDialog";
import { ProtectedButton } from "@/core/permissions";
import { Skeleton } from "@/components/elements/Skeleton";
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

  const { data: faqs = [], isLoading } = useFAQList();
  const deleteFAQ = useDeleteFAQ();

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
      accessorKey: "order",
      header: "ترتیب",
      cell: ({ row }) => (
        <div className="text-center">
          <Badge variant="outline" className="font-mono">
            {row.original.order}
          </Badge>
        </div>
      ),
    },
    {
      accessorKey: "question",
      header: "سوال",
      cell: ({ row }) => (
        <div className="max-w-md">
          <p className="font-medium text-font-p line-clamp-2">{row.original.question}</p>
        </div>
      ),
    },
    {
      accessorKey: "answer",
      header: "پاسخ",
      cell: ({ row }) => (
        <div className="max-w-md">
          <p className="text-sm text-font-s line-clamp-2">{row.original.answer}</p>
        </div>
      ),
    },
    {
      accessorKey: "keywords",
      header: "کلمات کلیدی",
      cell: ({ row }) => {
        const keywords = row.original.keywords
          ? row.original.keywords.split(",").map((k) => k.trim()).filter(Boolean)
          : [];
        return (
          <div className="flex flex-wrap gap-1 max-w-xs">
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
    },
    {
      accessorKey: "is_active",
      header: "وضعیت",
      cell: ({ row }) => (
        <Badge variant={row.original.is_active ? "default" : "outline"}>
          {row.original.is_active ? "فعال" : "غیرفعال"}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "عملیات",
      cell: ({ row }) => (
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
      ),
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
          {faqs.length === 0 ? (
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
              data={faqs}
              pageCount={1}
              isLoading={isLoading}
              clientFilters={{}}
              onFilterChange={() => {}}
              state={{
                pagination: { pageIndex: 0, pageSize: faqs.length },
                sorting: [{ id: "order", desc: false }],
              }}
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

