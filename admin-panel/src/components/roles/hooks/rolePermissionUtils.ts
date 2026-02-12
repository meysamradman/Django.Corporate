export interface RolePermissionItem {
  id: number;
  resource: string;
  action: string;
  original_key?: string;
}

export interface RolePermissionGroup {
  resource: string;
  permissions: RolePermissionItem[];
}

export interface BasePermissionRef {
  resource?: string;
  action?: string;
}

export interface SpecificPermissionPayloadItem {
  module: string;
  action: string;
  permission_key?: string;
}

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
