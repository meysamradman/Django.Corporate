import { useMemo } from "react";
import { useRole, useBasePermissions, usePermissions, usePermissionMap } from "@/core/permissions";
import { getPermissionTranslation } from "@/core/messages/permissions";

interface SpecificPermissionBadge {
  key: string;
  text: string;
}

export function useRoleDetailViewState(roleId: number) {
  const { data: role, isLoading, error } = useRole(roleId);
  const { data: basePermissions } = useBasePermissions();
  const { data: permissions } = usePermissions();
  const { data: permissionMap } = usePermissionMap();

  const actualBasePermissions =
    basePermissions && Array.isArray(basePermissions) && basePermissions.length > 0
      ? basePermissions
      : permissionMap?.base || [];

  const permissionDisplayNames = useMemo(() => {
    if (!permissions || !Array.isArray(permissions)) return {} as Record<string, string>;

    const displayMap: Record<string, string> = {};

    permissions.forEach((group: any) => {
      group.permissions?.forEach((perm: any) => {
        const permKey = perm.original_key || `${perm.resource}.${perm.action}`;
        displayMap[permKey] = perm.display_name;
      });
    });

    return displayMap;
  }, [permissions]);

  const formatDate = (dateString: string) => {
    if (!dateString) return "نامشخص";
    return new Date(dateString).toLocaleDateString("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const translateBasePermission = (basePerm: any): string => {
    const permissionKey =
      typeof basePerm === "string"
        ? basePerm
        : basePerm.permission_key ||
          basePerm.key ||
          (basePerm.module && basePerm.action ? `${basePerm.module}.${basePerm.action}` : "");

    if (permissionKey) {
      const directTranslation = getPermissionTranslation(permissionKey, "description");
      if (directTranslation && directTranslation !== permissionKey) {
        return directTranslation;
      }
    }

    if (typeof basePerm === "object" && basePerm.display_name) {
      const displayTranslation = getPermissionTranslation(basePerm.display_name, "description");
      if (displayTranslation && displayTranslation !== basePerm.display_name) {
        return displayTranslation;
      }
    }

    const parts = permissionKey.split(".");
    if (parts.length >= 2) {
      const module = parts[0];
      const action = parts[1];
      const moduleTranslated = getPermissionTranslation(module, "resource");
      const actionTranslated = getPermissionTranslation(action, "action");
      return `${actionTranslated} ${moduleTranslated}`;
    }

    return permissionKey || "نامشخص";
  };

  const specificPermissionBadges = useMemo<SpecificPermissionBadge[]>(() => {
    if (!role?.permissions?.specific_permissions || !Array.isArray(role.permissions.specific_permissions)) {
      return [];
    }

    const translatePermission = (perm: {
      displayName: string;
      module: string;
      action: string;
      originalKey?: string;
    }) => {
      if (perm.originalKey) {
        const keyTranslated = getPermissionTranslation(perm.originalKey, "description");
        if (keyTranslated !== perm.originalKey) return keyTranslated;
      }

      if (perm.displayName) {
        const descTranslated = getPermissionTranslation(perm.displayName, "description");
        if (descTranslated !== perm.displayName) return descTranslated;

        const resourceTranslated = getPermissionTranslation(perm.displayName, "resource");
        if (resourceTranslated !== perm.displayName) return resourceTranslated;
      }

      const moduleTranslated = getPermissionTranslation(perm.module, "resource");
      const actionTranslated = getPermissionTranslation(perm.action, "action");

      if (moduleTranslated !== perm.module && actionTranslated !== perm.action) {
        return `${actionTranslated} ${moduleTranslated}`;
      }

      return perm.displayName;
    };

    return role.permissions.specific_permissions.map((perm: any) => {
      const permKey = perm.permission_key || `${perm.module}.${perm.action}`;
      const moduleActionKey = `${perm.module}.${perm.action}`;

      const displayName =
        permissionDisplayNames[permKey] ||
        permissionDisplayNames[moduleActionKey] ||
        permissionDisplayNames[perm.permission_key || ""] ||
        `${perm.module}.${perm.action}`;

      const text = translatePermission({
        displayName,
        module: perm.module,
        action: perm.action,
        originalKey: perm.permission_key,
      });

      return {
        key: permKey,
        text,
      };
    });
  }, [role, permissionDisplayNames]);

  const basePermsCount =
    actualBasePermissions && Array.isArray(actualBasePermissions) ? actualBasePermissions.length : 0;
  const specificPermsCount =
    role?.permissions?.specific_permissions && Array.isArray(role.permissions.specific_permissions)
      ? role.permissions.specific_permissions.length
      : 0;
  const totalPermsCount = basePermsCount + specificPermsCount;
  const isProtected = (role as any)?.is_protected || false;

  return {
    role,
    isLoading,
    error,
    actualBasePermissions,
    basePermsCount,
    specificPermsCount,
    totalPermsCount,
    isProtected,
    formatDate,
    translateBasePermission,
    specificPermissionBadges,
  };
}
