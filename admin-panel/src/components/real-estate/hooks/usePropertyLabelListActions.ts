import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { notifyApiError, showSuccess } from "@/core/toast";
import { getStatus, msg } from "@/core/messages";
import { realEstateApi } from "@/api/real-estate";
import type { PropertyLabel } from "@/types/real_estate/label/realEstateLabel";
import type { PropertyLabelDeleteConfirmState } from "@/types/shared/deleteConfirm";

interface UsePropertyLabelListActionsParams {
  setRowSelection: Dispatch<SetStateAction<Record<string, boolean>>>;
}

export function usePropertyLabelListActions({ setRowSelection }: UsePropertyLabelListActionsParams) {
  const queryClient = useQueryClient();
  const [deleteConfirm, setDeleteConfirm] = useState<PropertyLabelDeleteConfirmState>({
    open: false,
    isBulk: false,
  });

  const deleteLabelMutation = useMutation({
    mutationFn: (labelId: number) => realEstateApi.deleteLabel(labelId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["property-labels"] });
      showSuccess(msg.crud("deleted", { item: "نشانه ملک" }));
    },
    onError: (error) => {
      notifyApiError(error, {
        fallbackMessage: msg.error("serverError"),
        dedupeKey: "property-label-delete-error",
        preferBackendMessage: false,
      });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (labelIds: number[]) => Promise.all(labelIds.map((id) => realEstateApi.deleteLabel(id))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["property-labels"] });
      showSuccess(msg.crud("deleted", { item: "نشانه‌های ملک" }));
      setRowSelection({});
    },
    onError: (error) => {
      notifyApiError(error, {
        fallbackMessage: msg.error("serverError"),
        dedupeKey: "property-label-bulk-delete-error",
        preferBackendMessage: false,
      });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: number; is_active: boolean }) => {
      return await realEstateApi.partialUpdateLabel(id, { is_active });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["property-labels"] });
      showSuccess(data.is_active ? getStatus("active") : getStatus("inactive"));
    },
    onError: (error) => {
      notifyApiError(error, {
        fallbackMessage: getStatus("statusChangeError"),
        dedupeKey: "property-label-toggle-active-error",
        preferBackendMessage: false,
      });
    },
  });

  const handleToggleActive = (label: PropertyLabel) => {
    toggleActiveMutation.mutate({
      id: label.id,
      is_active: !label.is_active,
    });
  };

  const handleDeleteLabel = (labelId: number | string) => {
    setDeleteConfirm({
      open: true,
      labelId: Number(labelId),
      isBulk: false,
    });
  };

  const handleDeleteSelected = (selectedIds: (string | number)[]) => {
    setDeleteConfirm({
      open: true,
      labelIds: selectedIds.map((id) => Number(id)),
      isBulk: true,
    });
  };

  const handleConfirmDelete = async () => {
    try {
      if (deleteConfirm.isBulk && deleteConfirm.labelIds) {
        await bulkDeleteMutation.mutateAsync(deleteConfirm.labelIds);
      } else if (!deleteConfirm.isBulk && deleteConfirm.labelId) {
        await deleteLabelMutation.mutateAsync(deleteConfirm.labelId);
      }
    } catch {
    }

    setDeleteConfirm({ open: false, isBulk: false });
  };

  return {
    deleteConfirm,
    setDeleteConfirm,
    handleDeleteLabel,
    handleDeleteSelected,
    handleConfirmDelete,
    handleToggleActive,
  };
}
