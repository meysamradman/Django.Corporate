import { useState } from "react";
import type { UseFormSetValue } from "react-hook-form";

interface UseRolePermissionSelectionParams {
  permissions: any[] | undefined;
  setValue: UseFormSetValue<any>;
}

export function useRolePermissionSelection({ permissions, setValue }: UseRolePermissionSelectionParams) {
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);

  const togglePermission = (permissionId: number) => {
    setSelectedPermissions((prev) => {
      const allPermissions = permissions?.flatMap((group: any) => group.permissions) || [];
      const toggledPerm = allPermissions.find((permission: any) => permission.id === permissionId);
      const isCurrentlySelected = prev.includes(permissionId);

      let newPermissions: number[];
      const resource = (toggledPerm as any)?.resource || "";
      const action = (toggledPerm as any)?.action || "";

      const isManageAction = action?.toLowerCase() === "manage";

      if (isManageAction) {
        newPermissions = isCurrentlySelected ? prev.filter((id) => id !== permissionId) : [...prev, permissionId];
      } else {
        const parentManagePerm = allPermissions.find(
          (permission: any) => permission.resource === resource && permission.action?.toLowerCase() === "manage"
        );
        const isParentManageSelected = parentManagePerm && prev.includes(parentManagePerm.id);

        if (isParentManageSelected) {
          return prev;
        }

        newPermissions = isCurrentlySelected ? prev.filter((id) => id !== permissionId) : [...prev, permissionId];
      }

      const isOpAction = ["create", "edit", "delete", "update", "finalize", "post", "patch", "destroy", "remove"].includes(
        action.toLowerCase()
      );
      const isViewAction = ["view", "read", "get", "list"].includes(action.toLowerCase());

      if (isOpAction && !isCurrentlySelected) {
        const viewPerm = allPermissions.find(
          (permission: any) => permission.resource === resource && ["view", "read"].includes(permission.action.toLowerCase())
        );
        if (viewPerm && !newPermissions.includes(viewPerm.id)) {
          newPermissions.push(viewPerm.id);
        }
      } else if (isViewAction && isCurrentlySelected) {
        const opPermIds = allPermissions
          .filter(
            (permission: any) =>
              permission.resource === resource &&
              ["create", "edit", "delete", "update", "finalize", "post", "put", "patch", "destroy", "remove"].includes(
                permission.action.toLowerCase()
              )
          )
          .map((permission: any) => permission.id);
        newPermissions = newPermissions.filter((id) => !opPermIds.includes(id));
      }

      setValue("permission_ids", newPermissions, { shouldValidate: true });

      return newPermissions;
    });
  };

  const toggleAllResourcePermissions = (resourcePermissions: any[]) => {
    const resourcePermissionIds = resourcePermissions.map((permission) => permission.id);
    const allSelected = resourcePermissionIds.every((id) => selectedPermissions.includes(id));

    setSelectedPermissions((prev) => {
      const newSelected = allSelected
        ? prev.filter((id) => !resourcePermissionIds.includes(id))
        : (() => {
            const updated = [...prev];
            resourcePermissionIds.forEach((id) => {
              if (!updated.includes(id)) {
                updated.push(id);
              }
            });
            return updated;
          })();

      setValue("permission_ids", newSelected, { shouldValidate: true });

      return newSelected;
    });
  };

  const isPermissionSelected = (permissionId: number | undefined) => {
    if (!permissionId) return false;
    return selectedPermissions.includes(permissionId);
  };

  const areAllResourcePermissionsSelected = (resourcePermissions: any[]) => {
    const resourcePermissionIds = resourcePermissions.map((permission) => permission.id);
    return resourcePermissionIds.every((id) => selectedPermissions.includes(id));
  };

  const getActionPermission = (resourcePermissions: any[], action: string) => {
    const actionVariants: Record<string, string[]> = {
      view: ["view", "list", "read", "get"],
      create: ["create", "post", "write", "add"],
      edit: ["edit", "update", "put", "patch", "modify"],
      finalize: ["finalize"],
      delete: ["delete", "remove", "destroy"],
      manage: ["manage", "admin"],
    };

    const variants = actionVariants[action] || [action];

    return resourcePermissions.find((permission) => variants.includes(permission.action.toLowerCase()));
  };

  return {
    selectedPermissions,
    setSelectedPermissions,
    togglePermission,
    toggleAllResourcePermissions,
    isPermissionSelected,
    areAllResourcePermissionsSelected,
    getActionPermission,
  };
}
