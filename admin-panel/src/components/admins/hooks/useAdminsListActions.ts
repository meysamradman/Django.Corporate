import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/api/admins/admins";
import { showSuccess, showError } from "@/core/toast";

interface DeleteConfirmState {
  open: boolean;
  adminId?: number;
  adminIds?: number[];
  isBulk: boolean;
}

export function useAdminsListActions() {
  const queryClient = useQueryClient();

  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState>({
    open: false,
    isBulk: false,
  });

  const deleteAdminMutation = useMutation({
    mutationFn: (adminId: number) => adminApi.deleteAdmin(adminId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admins"] });
      showSuccess("با موفقیت حذف شد");
    },
    onError: () => {
      showError("خطای سرور");
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
