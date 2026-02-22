import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { notifyApiError, showSuccess } from "@/core/toast";
import { getStatus, msg } from "@/core/messages";
import { realEstateApi } from "@/api/real-estate";
import type { PropertyState } from "@/types/real_estate/listing-types/realEstateListingTypes";
import type { PropertyListingTypeDeleteConfirmState } from "@/types/shared/deleteConfirm";

interface UseListingTypeListActionsParams {
  setRowSelection: Dispatch<SetStateAction<Record<string, boolean>>>;
}

export function useListingTypeListActions({ setRowSelection }: UseListingTypeListActionsParams) {
  const queryClient = useQueryClient();
  const [deleteConfirm, setDeleteConfirm] = useState<PropertyListingTypeDeleteConfirmState>({
    open: false,
    isBulk: false,
  });

  const deleteListingTypeMutation = useMutation({
    mutationFn: (listingTypeId: number) => realEstateApi.deleteListingType(listingTypeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listing-types"] });
      showSuccess(msg.crud("deleted", { item: "نوع معامله ملک" }));
    },
    onError: (error) => {
      notifyApiError(error, {
        fallbackMessage: msg.error("serverError"),
        dedupeKey: "listing-type-delete-error",
        preferBackendMessage: false,
      });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (listingTypeIds: number[]) => Promise.all(listingTypeIds.map((id) => realEstateApi.deleteListingType(id))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listing-types"] });
      showSuccess(msg.crud("deleted", { item: "انواع معامله ملک" }));
      setRowSelection({});
    },
    onError: (error) => {
      notifyApiError(error, {
        fallbackMessage: msg.error("serverError"),
        dedupeKey: "listing-type-bulk-delete-error",
        preferBackendMessage: false,
      });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: number; is_active: boolean }) => {
      return await realEstateApi.partialUpdateListingType(id, { is_active });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["listing-types"] });
      showSuccess(data.is_active ? getStatus("active") : getStatus("inactive"));
    },
    onError: (error) => {
      notifyApiError(error, {
        fallbackMessage: getStatus("statusChangeError"),
        dedupeKey: "listing-type-toggle-active-error",
        preferBackendMessage: false,
      });
    },
  });

  const handleToggleActive = (listingType: PropertyState) => {
    toggleActiveMutation.mutate({
      id: listingType.id,
      is_active: !listingType.is_active,
    });
  };

  const handleDeleteListingType = (listingTypeId: number | string) => {
    setDeleteConfirm({
      open: true,
      listingTypeId: Number(listingTypeId),
      isBulk: false,
    });
  };

  const handleDeleteSelected = (selectedIds: (string | number)[]) => {
    setDeleteConfirm({
      open: true,
      listingTypeIds: selectedIds.map((id) => Number(id)),
      isBulk: true,
    });
  };

  const handleConfirmDelete = async () => {
    try {
      if (deleteConfirm.isBulk && deleteConfirm.listingTypeIds) {
        await bulkDeleteMutation.mutateAsync(deleteConfirm.listingTypeIds);
      } else if (!deleteConfirm.isBulk && deleteConfirm.listingTypeId) {
        await deleteListingTypeMutation.mutateAsync(deleteConfirm.listingTypeId);
      }
    } catch {
    }

    setDeleteConfirm({ open: false, isBulk: false });
  };

  return {
    deleteConfirm,
    setDeleteConfirm,
    handleDeleteListingType,
    handleDeleteSelected,
    handleConfirmDelete,
    handleToggleActive,
  };
}
