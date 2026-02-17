import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { portfolioApi } from "@/api/portfolios/portfolios";
import { notifyApiError, showSuccess } from "@/core/toast";
import { msg } from "@/core/messages";
import type { PortfolioCategoryDeleteConfirmState } from "@/types/shared/deleteConfirm";

interface UsePortfolioCategoryListActionsParams {
  setRowSelection: Dispatch<SetStateAction<Record<string, boolean>>>;
}

export function usePortfolioCategoryListActions({ setRowSelection }: UsePortfolioCategoryListActionsParams) {
  const queryClient = useQueryClient();
  const [deleteConfirm, setDeleteConfirm] = useState<PortfolioCategoryDeleteConfirmState>({
    open: false,
    isBulk: false,
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (categoryId: number) => {
      return portfolioApi.deleteCategory(categoryId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      showSuccess(msg.crud("deleted", { item: "دسته‌بندی نمونه‌کار" }));
    },
    onError: (error) => {
      notifyApiError(error, {
        fallbackMessage: msg.error("serverError"),
        dedupeKey: "portfolio-category-delete-error",
        preferBackendMessage: false,
      });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (categoryIds: number[]) => {
      return portfolioApi.bulkDeleteCategories(categoryIds);
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      showSuccess(msg.crud("deleted", { item: "دسته‌بندی نمونه‌کار" }));
      setRowSelection({});
    },
    onError: (error) => {
      notifyApiError(error, {
        fallbackMessage: msg.error("serverError"),
        dedupeKey: "portfolio-category-bulk-delete-error",
        preferBackendMessage: false,
      });
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
