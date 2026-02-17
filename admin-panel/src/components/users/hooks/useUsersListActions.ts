import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/api/admins/admins";
import { notifyApiError, showSuccess } from "@/core/toast";
import { msg } from "@/core/messages";
import type { UserDeleteConfirmState } from "@/types/shared/deleteConfirm";

interface UseUsersListActionsParams {
  setRowSelection: Dispatch<SetStateAction<Record<string, boolean>>>;
}

export function useUsersListActions({ setRowSelection }: UseUsersListActionsParams) {
  const queryClient = useQueryClient();

  const [deleteConfirm, setDeleteConfirm] = useState<UserDeleteConfirmState>({
    open: false,
    isBulk: false,
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId: number) => adminApi.deleteUserByType(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      showSuccess("با موفقیت حذف شد");
    },
    onError: (error) => {
      notifyApiError(error, {
        fallbackMessage: msg.error("serverError"),
        dedupeKey: "users-delete-error",
        preferBackendMessage: false,
      });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (userIds: number[]) => adminApi.bulkDeleteUsersByType(userIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      showSuccess("با موفقیت حذف شد");
      setRowSelection({});
    },
    onError: (error) => {
      notifyApiError(error, {
        fallbackMessage: msg.error("serverError"),
        dedupeKey: "users-bulk-delete-error",
        preferBackendMessage: false,
      });
    },
  });

  const handleDeleteUser = (userId: number | string) => {
    setDeleteConfirm({
      open: true,
      userId: Number(userId),
      isBulk: false,
    });
  };

  const handleDeleteSelected = (selectedIds: (string | number)[]) => {
    setDeleteConfirm({
      open: true,
      userIds: selectedIds.map((id) => Number(id)),
      isBulk: true,
    });
  };

  const handleConfirmDelete = async () => {
    try {
      if (deleteConfirm.isBulk && deleteConfirm.userIds) {
        await bulkDeleteMutation.mutateAsync(deleteConfirm.userIds);
      } else if (!deleteConfirm.isBulk && deleteConfirm.userId) {
        await deleteUserMutation.mutateAsync(deleteConfirm.userId);
      }
    } catch {
    }
    setDeleteConfirm({ open: false, isBulk: false });
  };

  return {
    deleteConfirm,
    setDeleteConfirm,
    handleDeleteUser,
    handleDeleteSelected,
    handleConfirmDelete,
  };
}
