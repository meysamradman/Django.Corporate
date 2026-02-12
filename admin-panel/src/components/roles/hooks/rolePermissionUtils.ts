import type {
  BasePermissionRef,
  RolePermissionGroup,
  SpecificPermissionPayloadItem,
} from "@/types/roles";

export const getBasePermissionIds = (
  permissionGroups: RolePermissionGroup[],
  basePermissions: BasePermissionRef[]
) => {
  if (!basePermissions || !Array.isArray(basePermissions)) return [];

  const basePermissionIds: number[] = [];

  basePermissions.forEach((basePerm) => {
    if (!basePerm.resource || !basePerm.action) {
      return;
    }

    permissionGroups.forEach((group) => {
      group.permissions.forEach((permission) => {
        if (permission.resource === basePerm.resource && permission.action === basePerm.action) {
          basePermissionIds.push(permission.id);
        }
      });
    });
  });

  return basePermissionIds;
};

export const buildSpecificPermissionsPayload = (
  permissionGroups: RolePermissionGroup[],
  selectedPermissionIds: number[]
) => {
  const selectedPermsData: SpecificPermissionPayloadItem[] = [];

  if (permissionGroups) {
    permissionGroups.forEach((group) => {
      group.permissions.forEach((permission) => {
        if (selectedPermissionIds.includes(permission.id)) {
          if (!permission.resource || !permission.action) {
            return;
          }

          if (permission.original_key) {
            selectedPermsData.push({
              module: permission.resource,
              action: permission.action.toLowerCase(),
              permission_key: permission.original_key,
            });
          } else {
            selectedPermsData.push({
              module: permission.resource,
              action: permission.action.toLowerCase(),
            });
          }
        }
      });
    });
  }

  return selectedPermsData.length > 0
    ? { specific_permissions: selectedPermsData }
    : {};
};
