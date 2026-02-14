import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { realEstateApi } from "@/api/real-estate";
import { showSuccess, showError } from "@/core/toast";
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
    onError: () => {
      showError("خطای سرور");
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
