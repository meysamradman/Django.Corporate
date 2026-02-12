import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { portfolioApi } from "@/api/portfolios/portfolios";
import { showSuccess, showError } from "@/core/toast";
import { msg } from "@/core/messages";

interface DeleteConfirmState {
  open: boolean;
  tagId?: number;
  tagIds?: number[];
  isBulk: boolean;
}

interface UsePortfolioTagListActionsParams {
  setRowSelection: Dispatch<SetStateAction<Record<string, boolean>>>;
}

export function usePortfolioTagListActions({ setRowSelection }: UsePortfolioTagListActionsParams) {
  const queryClient = useQueryClient();
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState>({
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
    onError: () => {
      showError("خطای سرور");
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
    onError: () => {
      showError("خطای سرور");
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
