import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { notifyApiError, showSuccess } from "@/core/toast";
import { getStatus, msg } from "@/core/messages";
import { realEstateApi } from "@/api/real-estate";
import type { PropertyFeature } from "@/types/real_estate/feature/realEstateFeature";
import type { PropertyFeatureDeleteConfirmState } from "@/types/shared/deleteConfirm";


interface UsePropertyFeatureListActionsParams {
  setRowSelection: Dispatch<SetStateAction<Record<string, boolean>>>;
}

export function usePropertyFeatureListActions({ setRowSelection }: UsePropertyFeatureListActionsParams) {
  const queryClient = useQueryClient();
  const [deleteConfirm, setDeleteConfirm] = useState<PropertyFeatureDeleteConfirmState>({
    open: false,
    isBulk: false,
  });

  const deleteFeatureMutation = useMutation({
    mutationFn: (featureId: number) => realEstateApi.deleteFeature(featureId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["property-features"] });
      showSuccess(msg.crud("deleted", { item: "ویژگی ملک" }));
    },
    onError: (error) => {
      notifyApiError(error, {
        fallbackMessage: msg.error("serverError"),
        dedupeKey: "property-feature-delete-error",
        preferBackendMessage: false,
      });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (featureIds: number[]) => Promise.all(featureIds.map((id) => realEstateApi.deleteFeature(id))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["property-features"] });
      showSuccess(msg.crud("deleted", { item: "ویژگی‌های ملک" }));
      setRowSelection({});
    },
    onError: (error) => {
      notifyApiError(error, {
        fallbackMessage: msg.error("serverError"),
        dedupeKey: "property-feature-bulk-delete-error",
        preferBackendMessage: false,
      });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: number; is_active: boolean }) => {
      return await realEstateApi.partialUpdateFeature(id, { is_active });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["property-features"] });
      showSuccess(data.is_active ? getStatus("active") : getStatus("inactive"));
    },
    onError: (error) => {
      notifyApiError(error, {
        fallbackMessage: getStatus("statusChangeError"),
        dedupeKey: "property-feature-toggle-active-error",
        preferBackendMessage: false,
      });
    },
  });

  const handleToggleActive = (feature: PropertyFeature) => {
    toggleActiveMutation.mutate({
      id: feature.id,
      is_active: !feature.is_active,
    });
  };

  const handleDeleteFeature = (featureId: number | string) => {
    setDeleteConfirm({
      open: true,
      featureId: Number(featureId),
      isBulk: false,
    });
  };

  const handleDeleteSelected = (selectedIds: (string | number)[]) => {
    setDeleteConfirm({
      open: true,
      featureIds: selectedIds.map((id) => Number(id)),
      isBulk: true,
    });
  };

  const handleConfirmDelete = async () => {
    try {
      if (deleteConfirm.isBulk && deleteConfirm.featureIds) {
        await bulkDeleteMutation.mutateAsync(deleteConfirm.featureIds);
      } else if (!deleteConfirm.isBulk && deleteConfirm.featureId) {
        await deleteFeatureMutation.mutateAsync(deleteConfirm.featureId);
      }
    } catch {
    }

    setDeleteConfirm({ open: false, isBulk: false });
  };

  return {
    deleteConfirm,
    setDeleteConfirm,
    handleDeleteFeature,
    handleDeleteSelected,
    handleConfirmDelete,
    handleToggleActive,
  };
}
