import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { realEstateApi } from "@/api/real-estate";
import { notifyApiError, showSuccess } from "@/core/toast";
import { msg } from "@/core/messages";
import type { AgencyDeleteConfirmState } from "@/types/shared/deleteConfirm";

export function useAdminsAgenciesListActions() {
  const queryClient = useQueryClient();

  const [deleteConfirm, setDeleteConfirm] = useState<AgencyDeleteConfirmState>({
    open: false,
    isBulk: false,
  });

  const deleteAgencyMutation = useMutation({
    mutationFn: (agencyId: number) => realEstateApi.deleteAgency(agencyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agencies"] });
      showSuccess("با موفقیت حذف شد");
    },
    onError: (error) => {
      notifyApiError(error, {
        fallbackMessage: msg.error("serverError"),
        dedupeKey: "agencies-delete-error",
        preferBackendMessage: false,
      });
    },
  });

  const handleDeleteAgency = (agencyId: number | string) => {
    setDeleteConfirm({
      open: true,
      agencyId: Number(agencyId),
      isBulk: false,
    });
  };

  const handleConfirmDelete = async () => {
    try {
      if (deleteConfirm.agencyId) {
        await deleteAgencyMutation.mutateAsync(deleteConfirm.agencyId);
      }
    } catch {
    }
    setDeleteConfirm({ open: false, isBulk: false });
  };

  return {
    deleteConfirm,
    setDeleteConfirm,
    handleDeleteAgency,
    handleConfirmDelete,
  };
}
