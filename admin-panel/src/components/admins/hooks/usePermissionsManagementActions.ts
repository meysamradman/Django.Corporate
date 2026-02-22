import { useState } from "react";
import { showError, showSuccess } from "@/core/toast";
import { msg } from "@/core/messages";
import { getCrud } from "@/core/messages/ui";
import type { RoleWithPermissions } from "@/types/auth/permission";

interface UsePermissionsManagementActionsParams {
  selectedRole: RoleWithPermissions | null;
  modifiedPermissions: Set<number>;
  setModifiedPermissions: (value: Set<number>) => void;
  setSaveDialogOpen: (open: boolean) => void;
}

export function usePermissionsManagementActions({
  selectedRole,
  modifiedPermissions,
  setModifiedPermissions,
  setSaveDialogOpen,
}: UsePermissionsManagementActionsParams) {
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveChanges = async () => {
    if (!selectedRole || modifiedPermissions.size === 0) return;

    setIsSaving(true);
    try {
      showSuccess(getCrud("saved", { item: "تغییرات" }));
      setModifiedPermissions(new Set());
      setSaveDialogOpen(false);
    } catch {
      showError(msg.error("serverError"));
    } finally {
      setIsSaving(false);
    }
  };

  return {
    isSaving,
    handleSaveChanges,
  };
}
