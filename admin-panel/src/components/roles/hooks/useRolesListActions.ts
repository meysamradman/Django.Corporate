import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { useDeleteRole, useBulkDeleteRoles } from "@/core/permissions";
import type { Role } from "@/types/auth/permission";
import { showWarning } from "@/core/toast";
import { msg } from "@/core/messages";
import type { RoleDeleteConfirmState } from "@/types/shared/deleteConfirm";

interface UseRolesListActionsParams {
  data: Role[];
  setRowSelection: Dispatch<SetStateAction<Record<string, boolean>>>;
}

export function useRolesListActions({ data, setRowSelection }: UseRolesListActionsParams) {
  const [deleteConfirm, setDeleteConfirm] = useState<RoleDeleteConfirmState>({
    open: false,
    isBulk: false,
  });

  const deleteRoleMutation = useDeleteRole();
  const bulkDeleteMutation = useBulkDeleteRoles();

  const handleDeleteRole = (roleId: number) => {
    const role = data.find((item) => item.id === roleId);
    if (role?.is_system_role) {
      showWarning(msg.action('systemRolesNotDeletable'));
      return;
    }

    setDeleteConfirm({
      open: true,
      roleId,
      isBulk: false,
    });
  };

  const handleDeleteSelected = (selectedIds: (string | number)[]) => {
    const numericSelectedIds = selectedIds.map((id) => Number(id));
    const selectedRoles = data.filter((role) => numericSelectedIds.includes(Number(role.id)));
    const deletableRoles = selectedRoles.filter((role) => !role.is_system_role);

    if (deletableRoles.length === 0) {
      showWarning(msg.action('systemRolesNotDeletable'));
      return;
    }

    if (deletableRoles.length < selectedRoles.length) {
      showWarning(msg.action('nonSystemRolesWillDelete', { count: deletableRoles.length }));
    }

    setDeleteConfirm({
      open: true,
      roleIds: deletableRoles.map((role) => role.id),
      isBulk: true,
    });
  };

  const handleConfirmDelete = async () => {
    try {
      if (deleteConfirm.isBulk && deleteConfirm.roleIds) {
        await bulkDeleteMutation.mutateAsync(deleteConfirm.roleIds);
        setRowSelection({});
      } else if (!deleteConfirm.isBulk && deleteConfirm.roleId) {
        await deleteRoleMutation.mutateAsync(deleteConfirm.roleId);
      }
    } catch {
    }

    setDeleteConfirm({ open: false, isBulk: false });
  };

  return {
    deleteConfirm,
    setDeleteConfirm,
    handleDeleteRole,
    handleDeleteSelected,
    handleConfirmDelete,
  };
}
