import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { portfolioApi } from "@/api/portfolios/portfolios";
import { notifyApiError, showSuccess } from "@/core/toast";
import { msg } from "@/core/messages";
import type { PortfolioTagDeleteConfirmState } from "@/types/shared/deleteConfirm";


interface UsePortfolioTagListActionsParams {
  setRowSelection: Dispatch<SetStateAction<Record<string, boolean>>>;
}

export function usePortfolioTagListActions({ setRowSelection }: UsePortfolioTagListActionsParams) {
  const queryClient = useQueryClient();
  const [deleteConfirm, setDeleteConfirm] = useState<PortfolioTagDeleteConfirmState>({
    open: false,
    isBulk: false,
  });

  const deleteTagMutation = useMutation({
    mutationFn: (tagId: number) => {
      return portfolioApi.deleteTag(tagId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolio-tags"] });
      showSuccess(msg.crud("deleted", { item: "تگ نمونه‌کار" }));
    },
    onError: (error) => {
      notifyApiError(error, {
        fallbackMessage: msg.error("serverError"),
        dedupeKey: "portfolio-tag-delete-error",
        preferBackendMessage: false,
      });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (tagIds: number[]) => {
      return portfolioApi.bulkDeleteTags(tagIds);
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      showSuccess(msg.crud("deleted", { item: "تگ نمونه‌کار" }));
      setRowSelection({});
    },
    onError: (error) => {
      notifyApiError(error, {
        fallbackMessage: msg.error("serverError"),
        dedupeKey: "portfolio-tag-bulk-delete-error",
        preferBackendMessage: false,
      });
    },
  });

  const handleDeleteTag = (tagId: number | string) => {
    setDeleteConfirm({
      open: true,
      tagId: Number(tagId),
      isBulk: false,
    });
  };

  const handleDeleteSelected = (selectedIds: (string | number)[]) => {
    setDeleteConfirm({
      open: true,
      tagIds: selectedIds.map((id) => Number(id)),
      isBulk: true,
    });
  };

  const handleConfirmDelete = async () => {
    try {
      if (deleteConfirm.isBulk && deleteConfirm.tagIds) {
        await bulkDeleteMutation.mutateAsync(deleteConfirm.tagIds);
      } else if (!deleteConfirm.isBulk && deleteConfirm.tagId) {
        await deleteTagMutation.mutateAsync(deleteConfirm.tagId);
      }
    } catch {
    }

    setDeleteConfirm({ open: false, isBulk: false });
  };

  return {
    deleteConfirm,
    setDeleteConfirm,
    handleDeleteTag,
    handleDeleteSelected,
    handleConfirmDelete,
  };
}
