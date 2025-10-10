"use client"

import * as React from "react";
import { Switch } from "@/components/elements/Switch";
import { toast } from "@/components/elements/Sonner";
import { usePermissions } from "@/core/auth/permissionUtils";


interface StatusToggleProps {
  itemId: number | string;
  initialStatus: boolean;
  editPermission: string; // e.g., 'admin.edit', 'portfolio.edit'
  updateStatusFn: (id: number | string, status: boolean) => Promise<unknown>; // API function to call
  entityName: string; // e.g., 'Admin', 'Portfolio' for messages
}

export const StatusToggle: React.FC<StatusToggleProps> = ({
  itemId,
  initialStatus,
  editPermission,
  updateStatusFn,
  entityName,
}) => {
  const { hasPermission } = usePermissions();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isChecked, setIsChecked] = React.useState(initialStatus);



  const canEdit = hasPermission(editPermission);

  const handleToggleStatus = async (checked: boolean) => {
    // Double-check permission just in case
    if (!canEdit) {
      toast.warning(`Permission denied to change ${entityName.toLowerCase()} status.`);
      return;
    }

    setIsLoading(true);
    try {
      await updateStatusFn(itemId, checked);
      setIsChecked(checked);
              toast.success(`وضعیت ${entityName} با موفقیت به ${checked ? 'فعال' : 'غیرفعال'} تغییر یافت`);
    } catch (error) {
      console.error(`Failed to update ${entityName.toLowerCase()} status:`, error);
      toast.error(`Failed to update ${entityName.toLowerCase()} status.`);
      // Revert state on error
      setIsChecked(!checked);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Switch
      checked={isChecked}
      onCheckedChange={handleToggleStatus}
      disabled={isLoading || !canEdit} // Disable if loading or no permission
      aria-label={`Toggle ${entityName.toLowerCase()} status`}

    />
  );
}; 