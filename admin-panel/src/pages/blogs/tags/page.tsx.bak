import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader/PageHeader";
import { DataTable } from "@/components/tables/DataTable";
import { useTagColumns } from "@/components/blogs/tags/list/TagTableColumns";
import { Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/elements/Button";
import { ProtectedButton } from "@/core/permissions";
import { useQuery } from "@tanstack/react-query";
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
import type { BlogTag } from "@/types/blog/tags/blogTag";
import type { ColumnDef } from "@tanstack/react-table";
import { blogApi } from "@/api/blogs/blogs";
import type { DataTableRowAction } from "@/types/shared/table";
import { useGlobalDrawerStore } from "@/components/shared/drawer/store";
import { DRAWER_IDS } from "@/components/shared/drawer/types";
import { useBlogTagListTableState } from "@/components/blogs/hooks/useBlogTagListTableState";
import { useBlogTagListActions } from "@/components/blogs/hooks/useBlogTagListActions";

export default function TagPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const open = useGlobalDrawerStore((state) => state.open);

  useEffect(() => {
    if (searchParams.get("action") === "create") {
      open(DRAWER_IDS.BLOG_TAG_FORM);

      const newParams = new URLSearchParams(searchParams);
      newParams.delete("action");
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams, open]);

  const {
    pagination,
    sorting,
    rowSelection,
    setRowSelection,
    searchValue,
    clientFilters,
    handleFilterChange,
    tagFilterConfig,
    handlePaginationChange,
    handleSortingChange,
  } = useBlogTagListTableState();

  const queryParams = {
    search: searchValue,
    page: pagination.pageIndex + 1,
    size: pagination.pageSize,
    order_by: sorting.length > 0 ? sorting[0].id : "created_at",
    order_desc: sorting.length > 0 ? sorting[0].desc : true,
    is_active: clientFilters.is_active as boolean | undefined,
    is_public: clientFilters.is_public as boolean | undefined,
    date_from: clientFilters.date_from as string | undefined,
    date_to: clientFilters.date_to as string | undefined,
  };

  const { data: tags, isLoading, error } = useQuery({
    queryKey: [
      "blog-tags",
      queryParams.search,
      queryParams.page,
      queryParams.size,
      queryParams.order_by,
      queryParams.order_desc,
      queryParams.is_active,
      queryParams.is_public,
      queryParams.date_from,
      queryParams.date_to,
    ],
    queryFn: async () => {
      return await blogApi.getTags(queryParams);
    },
    staleTime: 0,
  });

  const data: BlogTag[] = Array.isArray(tags?.data) ? tags.data : [];
  const pageCount = tags?.pagination?.total_pages || 1;

  const {
    deleteConfirm,
    setDeleteConfirm,
    handleDeleteTag,
    handleDeleteSelected,
    handleConfirmDelete,
  } = useBlogTagListActions({ setRowSelection });

  const handleEditTag = (id: number) => {
    open(DRAWER_IDS.BLOG_TAG_FORM, { editId: id });
  };

  const rowActions: DataTableRowAction<BlogTag>[] = [
    {
      label: "ویرایش",
      icon: <Edit className="h-4 w-4" />,
      onClick: (tag) => handleEditTag(Number(tag.id)),
    },
    {
      label: "حذف",
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (tag) => handleDeleteTag(tag.id),
      isDestructive: true,
    },
  ];

  const columns = useTagColumns(rowActions, handleEditTag) as ColumnDef<BlogTag>[];

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="مدیریت برچسب‌ها" />
        <div className="text-center py-8">
          <p className="text-red-1 mb-4">خطا در بارگذاری داده‌ها</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            تلاش مجدد
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="مدیریت برچسب‌ها">
        <ProtectedButton permission="blog.create" size="sm" onClick={() => open(DRAWER_IDS.BLOG_TAG_FORM)}>
          <Edit className="h-4 w-4" />
          افزودن برچسب
        </ProtectedButton>
      </PageHeader>

      <DataTable
        columns={columns}
        data={data}
        pageCount={pageCount}
        isLoading={isLoading}
        onPaginationChange={handlePaginationChange}
        onSortingChange={handleSortingChange}
        onRowSelectionChange={setRowSelection}
        clientFilters={clientFilters}
        onFilterChange={handleFilterChange}
        state={{
          pagination,
          sorting,
          rowSelection,
        }}
        searchValue={searchValue}
        pageSizeOptions={[10, 20, 50]}
        deleteConfig={{
          onDeleteSelected: handleDeleteSelected,
          permission: "blog.delete",
          denyMessage: "اجازه حذف برچسب ندارید",
        }}
        filterConfig={tagFilterConfig}
      />

      <AlertDialog open={deleteConfirm.open} onOpenChange={(open) => setDeleteConfirm((prev) => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تایید حذف</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirm.isBulk
                ? `آیا از حذف ${deleteConfirm.tagIds?.length || 0} برچسب انتخاب شده مطمئن هستید؟`
                : "آیا از حذف این برچسب مطمئن هستید؟"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>لغو</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-static-w hover:bg-destructive/90">
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
