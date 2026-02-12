import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { blogApi } from "@/api/blogs/blogs";
import { showSuccess, showError } from "@/core/toast";
import { msg } from "@/core/messages";

interface DeleteConfirmState {
  open: boolean;
  categoryId?: number;
  categoryIds?: number[];
  isBulk: boolean;
}

interface UseBlogCategoryListActionsParams {
  setRowSelection: Dispatch<SetStateAction<Record<string, boolean>>>;
}

export function useBlogCategoryListActions({ setRowSelection }: UseBlogCategoryListActionsParams) {
  const queryClient = useQueryClient();
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState>({
    open: false,
    isBulk: false,
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (categoryId: number) => {
      return blogApi.deleteCategory(categoryId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      showSuccess(msg.crud("deleted", { item: "دسته‌بندی" }));
      setRowSelection({});
    },
    onError: () => {
      showError("خطای سرور");
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (categoryIds: number[]) => {
      return blogApi.bulkDeleteCategories(categoryIds);
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      showSuccess(msg.crud("deleted", { item: "دسته‌بندی" }));
    },
    onError: () => {
      showError("خطای سرور");
    },
  });

  const handleDeleteCategory = (categoryId: number | string) => {
    setDeleteConfirm({
      open: true,
      categoryId: Number(categoryId),
      isBulk: false,
    });
  };

  const handleDeleteSelected = (selectedIds: (string | number)[]) => {
    setDeleteConfirm({
      open: true,
      categoryIds: selectedIds.map((id) => Number(id)),
      isBulk: true,
    });
  };

  const handleConfirmDelete = async () => {
    try {
      if (deleteConfirm.isBulk && deleteConfirm.categoryIds) {
        await bulkDeleteMutation.mutateAsync(deleteConfirm.categoryIds);
      } else if (!deleteConfirm.isBulk && deleteConfirm.categoryId) {
        await deleteCategoryMutation.mutateAsync(deleteConfirm.categoryId);
      }
    } catch {
    }

    setDeleteConfirm({ open: false, isBulk: false });
  };

  return {
    deleteConfirm,
    setDeleteConfirm,
    handleDeleteCategory,
    handleDeleteSelected,
    handleConfirmDelete,
  };
}
