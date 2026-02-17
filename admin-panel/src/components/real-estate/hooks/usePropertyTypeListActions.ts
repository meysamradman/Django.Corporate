import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { notifyApiError, showSuccess } from "@/core/toast";
import { getStatus, msg } from "@/core/messages";
import { realEstateApi } from "@/api/real-estate";
import type { PropertyType } from "@/types/real_estate/type/propertyType";
import type { PropertyTypeDeleteConfirmState } from "@/types/shared/deleteConfirm";

interface UsePropertyTypeListActionsParams {
  setRowSelection: Dispatch<SetStateAction<Record<string, boolean>>>;
}

export function usePropertyTypeListActions({ setRowSelection }: UsePropertyTypeListActionsParams) {
  const queryClient = useQueryClient();
  const [deleteConfirm, setDeleteConfirm] = useState<PropertyTypeDeleteConfirmState>({
    open: false,
    isBulk: false,
  });

  const deleteTypeMutation = useMutation({
    mutationFn: (typeId: number) => realEstateApi.deleteType(typeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["property-types"] });
      showSuccess(msg.crud("deleted", { item: "نوع ملک" }));
    },
    onError: (error) => {
      notifyApiError(error, {
        fallbackMessage: msg.error("serverError"),
        dedupeKey: "property-type-delete-error",
        preferBackendMessage: false,
      });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (typeIds: number[]) => Promise.all(typeIds.map((id) => realEstateApi.deleteType(id))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["property-types"] });
      showSuccess(msg.crud("deleted", { item: "نوع‌های ملک" }));
      setRowSelection({});
    },
    onError: (error) => {
      notifyApiError(error, {
        fallbackMessage: msg.error("serverError"),
        dedupeKey: "property-type-bulk-delete-error",
        preferBackendMessage: false,
      });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: number; is_active: boolean }) => {
      return await realEstateApi.partialUpdateType(id, { is_active });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["property-types"] });
      showSuccess(data.is_active ? getStatus("active") : getStatus("inactive"));
    },
    onError: (error) => {
      notifyApiError(error, {
        fallbackMessage: getStatus("statusChangeError"),
        dedupeKey: "property-type-toggle-active-error",
        preferBackendMessage: false,
      });
    },
  });

  const handleToggleActive = (type: PropertyType) => {
    toggleActiveMutation.mutate({
      id: type.id,
      is_active: !type.is_active,
    });
  };

  const handleDeleteType = (typeId: number | string) => {
    setDeleteConfirm({
      open: true,
      typeId: Number(typeId),
      isBulk: false,
    });
  };

  const handleDeleteSelected = (selectedIds: (string | number)[]) => {
    setDeleteConfirm({
      open: true,
      typeIds: selectedIds.map((id) => Number(id)),
      isBulk: true,
    });
  };

  const handleConfirmDelete = async () => {
    try {
      if (deleteConfirm.isBulk && deleteConfirm.typeIds) {
        await bulkDeleteMutation.mutateAsync(deleteConfirm.typeIds);
      } else if (!deleteConfirm.isBulk && deleteConfirm.typeId) {
        await deleteTypeMutation.mutateAsync(deleteConfirm.typeId);
      }
    } catch {
    }

    setDeleteConfirm({ open: false, isBulk: false });
  };

  return {
    deleteConfirm,
    setDeleteConfirm,
    handleDeleteType,
    handleDeleteSelected,
    handleConfirmDelete,
    handleToggleActive,
  };
}
