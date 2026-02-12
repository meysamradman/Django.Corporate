import { useMemo, useState } from "react";
import type { PermissionGroup, Permission, RoleWithPermissions } from "@/types/auth/permission";

interface UsePermissionsManagementStateParams {
  roles: RoleWithPermissions[];
  permissionGroups: PermissionGroup[];
}

export function usePermissionsManagementState({ roles, permissionGroups }: UsePermissionsManagementStateParams) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<RoleWithPermissions | null>(null);
  const [modifiedPermissions, setModifiedPermissions] = useState<Set<number>>(new Set());
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);

  const filteredRoles = roles.filter(
    (role) =>
      role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedPermissions = useMemo(() => {
    if (!Array.isArray(permissionGroups)) return {};

    const groups: Record<string, Permission[]> = {};

    permissionGroups.forEach((group) => {
      if (group.permissions && Array.isArray(group.permissions)) {
        const permissionsWithStandalone = group.permissions.map((perm) => ({
          ...perm,
          is_standalone: perm.is_standalone || false,
        }));
        groups[group.resource] = permissionsWithStandalone;
      }
    });

    return groups;
  }, [permissionGroups]);

  const roleHasPermission = (role: RoleWithPermissions, permissionId: number): boolean => {
    return role.permissions?.some((perm) => perm.id === permissionId) || false;
  };

  const selectRole = (role: RoleWithPermissions) => {
    setSelectedRole(role);
    setModifiedPermissions(new Set());
  };

  const togglePermission = (permissionId: number) => {
    if (!selectedRole) return;

    const newModified = new Set(modifiedPermissions);
    newModified.add(permissionId);
    setModifiedPermissions(newModified);

    const currentHasPermission = roleHasPermission(selectedRole, permissionId);
    const updatedPermissions = currentHasPermission
      ? selectedRole.permissions.filter((p) => p.id !== permissionId)
      : [...selectedRole.permissions, { id: permissionId, resource: "", action: "" }];

    setSelectedRole({
      ...selectedRole,
      permissions: updatedPermissions,
    });
  };

  return {
    searchTerm,
    setSearchTerm,
    selectedRole,
    setSelectedRole,
    modifiedPermissions,
    setModifiedPermissions,
    saveDialogOpen,
    setSaveDialogOpen,
    filteredRoles,
    groupedPermissions,
    roleHasPermission,
    selectRole,
    togglePermission,
  };
}
