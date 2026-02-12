import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { portfolioApi } from "@/api/portfolios/portfolios";
import { showError, showSuccess } from "@/core/toast";
import { msg } from "@/core/messages";

interface DeleteConfirmState {
  open: boolean;
  optionId?: number;
  optionIds?: number[];
  isBulk: boolean;
}

interface UsePortfolioOptionListActionsParams {
  setRowSelection: Dispatch<SetStateAction<Record<string, boolean>>>;
}

export function usePortfolioOptionListActions({ setRowSelection }: UsePortfolioOptionListActionsParams) {
  const queryClient = useQueryClient();
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState>({
    open: false,
    isBulk: false,
  });

  const deleteOptionMutation = useMutation({
    mutationFn: (optionId: number) => {
      return portfolioApi.deleteOption(optionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolio-options"] });
      showSuccess(msg.crud("deleted", { item: "گزینه نمونه‌کار" }));
    },
    onError: () => {
      showError("خطای سرور");
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (optionIds: number[]) => {
      return portfolioApi.bulkDeleteOptions(optionIds);
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      showSuccess(msg.crud("deleted", { item: "گزینه نمونه‌کار" }));
      setRowSelection({});
    },
    onError: () => {
      showError("خطای سرور");
    },
  });

  const handleDeleteOption = (optionId: number | string) => {
    setDeleteConfirm({
      open: true,
      optionId: Number(optionId),
      isBulk: false,
    });
  };

  const handleDeleteSelected = (selectedIds: (string | number)[]) => {
    setDeleteConfirm({
      open: true,
      optionIds: selectedIds.map((id) => Number(id)),
      isBulk: true,
    });
  };

  const handleConfirmDelete = async () => {
    try {
      if (deleteConfirm.isBulk && deleteConfirm.optionIds) {
        await bulkDeleteMutation.mutateAsync(deleteConfirm.optionIds);
      } else if (!deleteConfirm.isBulk && deleteConfirm.optionId) {
        await deleteOptionMutation.mutateAsync(deleteConfirm.optionId);
      }
    } catch {
    }

    setDeleteConfirm({ open: false, isBulk: false });
  };

  return {
    deleteConfirm,
    setDeleteConfirm,
    handleDeleteOption,
    handleDeleteSelected,
    handleConfirmDelete,
  };
}
