import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { notifyApiError, showSuccess } from "@/core/toast";
import { getStatus, msg } from "@/core/messages";
import { realEstateApi } from "@/api/real-estate";
import type { PropertyState } from "@/types/real_estate/state/realEstateState";
import type { PropertyStateDeleteConfirmState } from "@/types/shared/deleteConfirm";


interface UsePropertyStateListActionsParams {
  setRowSelection: Dispatch<SetStateAction<Record<string, boolean>>>;
}

export function usePropertyStateListActions({ setRowSelection }: UsePropertyStateListActionsParams) {
  const queryClient = useQueryClient();
  const [deleteConfirm, setDeleteConfirm] = useState<PropertyStateDeleteConfirmState>({
    open: false,
    isBulk: false,
  });

  const deleteStateMutation = useMutation({
    mutationFn: (stateId: number) => realEstateApi.deleteState(stateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["property-states"] });
      showSuccess(msg.crud("deleted", { item: "وضعیت ملک" }));
    },
    onError: (error) => {
      notifyApiError(error, {
        fallbackMessage: msg.error("serverError"),
        dedupeKey: "property-state-delete-error",
        preferBackendMessage: false,
      });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (stateIds: number[]) => Promise.all(stateIds.map((id) => realEstateApi.deleteState(id))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["property-states"] });
      showSuccess(msg.crud("deleted", { item: "وضعیت‌های ملک" }));
      setRowSelection({});
    },
    onError: (error) => {
      notifyApiError(error, {
        fallbackMessage: msg.error("serverError"),
        dedupeKey: "property-state-bulk-delete-error",
        preferBackendMessage: false,
      });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: number; is_active: boolean }) => {
      return await realEstateApi.partialUpdateState(id, { is_active });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["property-states"] });
      showSuccess(data.is_active ? getStatus("active") : getStatus("inactive"));
    },
    onError: (error) => {
      notifyApiError(error, {
        fallbackMessage: getStatus("statusChangeError"),
        dedupeKey: "property-state-toggle-active-error",
        preferBackendMessage: false,
      });
    },
  });

  const handleToggleActive = (state: PropertyState) => {
    toggleActiveMutation.mutate({
      id: state.id,
      is_active: !state.is_active,
    });
  };

  const handleDeleteState = (stateId: number | string) => {
    setDeleteConfirm({
      open: true,
      stateId: Number(stateId),
      isBulk: false,
    });
  };

  const handleDeleteSelected = (selectedIds: (string | number)[]) => {
    setDeleteConfirm({
      open: true,
      stateIds: selectedIds.map((id) => Number(id)),
      isBulk: true,
    });
  };

  const handleConfirmDelete = async () => {
    try {
      if (deleteConfirm.isBulk && deleteConfirm.stateIds) {
        await bulkDeleteMutation.mutateAsync(deleteConfirm.stateIds);
      } else if (!deleteConfirm.isBulk && deleteConfirm.stateId) {
        await deleteStateMutation.mutateAsync(deleteConfirm.stateId);
      }
    } catch {
    }

    setDeleteConfirm({ open: false, isBulk: false });
  };

  return {
    deleteConfirm,
    setDeleteConfirm,
    handleDeleteState,
    handleDeleteSelected,
    handleConfirmDelete,
    handleToggleActive,
  };
}
