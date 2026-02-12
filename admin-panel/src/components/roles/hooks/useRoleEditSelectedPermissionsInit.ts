import { useEffect } from "react";
import { getBasePermissionIds, type BasePermissionRef, type RolePermissionGroup } from "@/components/roles/hooks/rolePermissionUtils";

interface UseRoleEditSelectedPermissionsInitParams {
  role: any;
  permissions: RolePermissionGroup[] | undefined;
  basePermissions: BasePermissionRef[] | undefined;
  setSelectedPermissions: (updater: (prev: number[]) => number[]) => void;
}

export function useRoleEditSelectedPermissionsInit({
  role,
  permissions,
  basePermissions,
  setSelectedPermissions,
}: UseRoleEditSelectedPermissionsInitParams) {
  useEffect(() => {
    if (!(role && permissions)) return;

    const basePermissionIds = getBasePermissionIds(permissions, basePermissions || []);
    const rolePermissionIds: number[] = [];

    if (role.permissions?.specific_permissions && Array.isArray(role.permissions.specific_permissions)) {
      const specificPerms = role.permissions.specific_permissions;

      permissions.forEach((group) => {
        group.permissions.forEach((permission: any) => {
          if (basePermissionIds.includes(permission.id)) {
            return;
          }

          const hasPermission = specificPerms.some((perm: any) => {
            const permOriginalKey = (permission as any).original_key;

            if (permOriginalKey && perm.permission_key) {
              return perm.permission_key === permOriginalKey;
            }

            if (permission.resource === "analytics" && permOriginalKey) {
              return perm.permission_key === permOriginalKey;
            }

            if (permission.is_standalone && permOriginalKey) {
              return perm.permission_key === permOriginalKey;
            }

            const permModule = (perm.module || perm.resource || "").toLowerCase();
            const permissionResource = (permission.resource || "").toLowerCase();
            const permResourceMatch = permModule === permissionResource;

            const backendAction = (perm.action || "").toLowerCase();
            const frontendAction = (permission.action || "").toLowerCase();
            const permActionMatch = backendAction === frontendAction;

            return permResourceMatch && permActionMatch;
          });

          if (hasPermission) {
            rolePermissionIds.push(permission.id);
          }
        });
      });
    } else {
      const roleModules = role.permissions?.modules || [];
      const roleActions = role.permissions?.actions || [];

      if (roleModules.length === 0 && roleActions.length === 0) {
        setSelectedPermissions(() => [...basePermissionIds]);
        return;
      }

      permissions.forEach((group) => {
        group.permissions.forEach((permission: any) => {
          if (basePermissionIds.includes(permission.id)) {
            return;
          }

          const hasModule = roleModules.includes("all") || roleModules.includes(permission.resource);
          const hasAction = roleActions.includes("all") || roleActions.includes(permission.action?.toLowerCase());

          if (hasModule && hasAction) {
            rolePermissionIds.push(permission.id);
          }
        });
      });
    }

    const uniqueIds = Array.from(new Set([...basePermissionIds, ...rolePermissionIds])).filter(
      (id) => typeof id === "number" && !isNaN(id)
    );

    setSelectedPermissions((prev) => {
      const prevSet = new Set(prev);
      const newSet = new Set(uniqueIds);

      if (prevSet.size !== newSet.size || !Array.from(prevSet).every((id) => newSet.has(id))) {
        return uniqueIds;
      }

      return prev;
    });
  }, [role, permissions, basePermissions, setSelectedPermissions]);
}
