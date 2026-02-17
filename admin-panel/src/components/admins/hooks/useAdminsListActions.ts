import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/api/admins/admins";
import { notifyApiError, showSuccess } from "@/core/toast";
import { msg } from "@/core/messages";
import type { AdminDeleteConfirmState } from "@/types/shared/deleteConfirm";

export function useAdminsListActions() {
  const queryClient = useQueryClient();

  const [deleteConfirm, setDeleteConfirm] = useState<AdminDeleteConfirmState>({
    open: false,
    isBulk: false,
  });

  const deleteAdminMutation = useMutation({
    mutationFn: (adminId: number) => adminApi.deleteAdmin(adminId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admins"] });
      showSuccess("با موفقیت حذف شد");
    },
    onError: (error) => {
      notifyApiError(error, {
        fallbackMessage: msg.error("serverError"),
        dedupeKey: "admins-delete-error",
        preferBackendMessage: false,
      });
    },
  });

  const handleDeleteAdmin = (adminId: number | string) => {
    setDeleteConfirm({
      open: true,
      adminId: Number(adminId),
      isBulk: false,
    });
  };

  const handleConfirmDelete = async () => {
    try {
      if (deleteConfirm.adminId) {
        await deleteAdminMutation.mutateAsync(deleteConfirm.adminId);
      }
    } catch {
    }

    setDeleteConfirm({ open: false, isBulk: false });
  };

  return {
    deleteConfirm,
    setDeleteConfirm,
    handleDeleteAdmin,
    handleConfirmDelete,
  };
}
