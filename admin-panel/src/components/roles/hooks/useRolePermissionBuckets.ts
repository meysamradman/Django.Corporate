import { useMemo } from "react";
import { getBasePermissionIds } from "@/components/roles/hooks/rolePermissionUtils";
import type { BasePermissionRef, RolePermissionGroup } from "@/types/roles";

const getAnalyticsPermissions = (permissions: any[]): string[] => {
  if (!permissions || !Array.isArray(permissions)) return [];

  const analyticsPerms: string[] = [];
  permissions.forEach((group: any) => {
    if (group.resource === "analytics" || group.resource?.startsWith("analytics.")) {
      group.permissions?.forEach((perm: any) => {
        const originalKey = perm.original_key || `${perm.resource}.${perm.action}`;
        if (originalKey.startsWith("analytics.") && !analyticsPerms.includes(originalKey)) {
          analyticsPerms.push(originalKey);
        }
      });
    }
  });

  return analyticsPerms;
};

const getAIPermissions = (permissions: any[]): string[] => {
  if (!permissions || !Array.isArray(permissions)) return [];

  const aiPerms: string[] = [];
  permissions.forEach((group: any) => {
    if (group.resource === "ai" || group.resource?.startsWith("ai.")) {
      group.permissions?.forEach((perm: any) => {
        const originalKey = perm.original_key || `${perm.resource}.${perm.action}`;
        if (originalKey.startsWith("ai.") && !aiPerms.includes(originalKey)) {
          aiPerms.push(originalKey);
        }
      });
    }
  });

  return aiPerms;
};

const isStandaloneResource = (resource: any) => {
  const perms = resource.permissions || [];
  return perms.some((perm: any) => perm.is_standalone === true);
};

const hasContentMasterToggle = (resource: any) => {
  const perms = resource.permissions || [];
  return perms.some(
    (perm: any) =>
      perm.is_standalone === true &&
      perm.action?.toLowerCase() === "manage" &&
      perm.permission_category === "content_master"
  );
};

const isAdminOnlyResource = (resource: any) => {
  const perms = resource.permissions || [];
  if (perms.length === 0) return false;
  return perms.every((perm: any) => perm.requires_superadmin === true);
};

export function useRolePermissionBuckets({
  permissions,
  basePermissions,
}: {
  permissions: RolePermissionGroup[];
  basePermissions: BasePermissionRef[];
}) {
  const allPermissions = useMemo(() => permissions?.flatMap((group: any) => group.permissions) || [], [permissions]);

  const organizedPermissions = useMemo(() => {
    if (!permissions) return [];

    const basePermissionIds = getBasePermissionIds(permissions, basePermissions);
    const resourceMap: Record<string, any> = {};

    permissions.forEach((group: any) => {
      const filteredPermissions = group.permissions.filter((perm: any) => !basePermissionIds.includes(perm.id));

      if (filteredPermissions.length === 0) return;

      if (!resourceMap[group.resource]) {
        resourceMap[group.resource] = {
          resource: group.resource,
          display_name: group.display_name,
          permissions: [],
        };
      }

      resourceMap[group.resource].permissions.push(...filteredPermissions);
    });

    return Object.values(resourceMap);
  }, [permissions, basePermissions]);

  const analyticsUsedPermissions = useMemo(() => getAnalyticsPermissions(permissions || []), [permissions]);
  const aiUsedPermissions = useMemo(() => getAIPermissions(permissions || []), [permissions]);

  const standaloneResources = useMemo(() => {
    return organizedPermissions.filter((resource: any) => {
      if (resource.resource === "analytics" || resource.resource?.startsWith("analytics.")) return false;
      if (resource.resource === "ai" || resource.resource?.startsWith("ai.")) return false;
      if (hasContentMasterToggle(resource)) return false;
      return isStandaloneResource(resource);
    });
  }, [organizedPermissions]);

  const analyticsResources = useMemo(() => {
    const filtered = organizedPermissions.filter(
      (resource: any) => resource.resource === "analytics" || resource.resource?.startsWith("analytics.")
    );

    if (filtered.length > 1) {
      const permissionMap = new Map<number, any>();
      filtered.forEach((resource: any) => {
        resource.permissions?.forEach((perm: any) => {
          if (perm.id && !permissionMap.has(perm.id)) permissionMap.set(perm.id, perm);
        });
      });

      return [
        {
          resource: "analytics",
          display_name: filtered[0]?.display_name || "Analytics",
          permissions: Array.from(permissionMap.values()),
        },
      ];
    }

    return filtered;
  }, [organizedPermissions]);

  const aiResources = useMemo(() => {
    const filtered = organizedPermissions.filter(
      (resource: any) => resource.resource === "ai" || resource.resource?.startsWith("ai.")
    );

    if (filtered.length > 1) {
      const permissionMap = new Map<number, any>();
      filtered.forEach((resource: any) => {
        resource.permissions?.forEach((perm: any) => {
          if (perm.id && !permissionMap.has(perm.id)) permissionMap.set(perm.id, perm);
        });
      });

      return [
        {
          resource: "ai",
          display_name: filtered[0]?.display_name || "AI Tools",
          permissions: Array.from(permissionMap.values()),
        },
      ];
    }

    return filtered;
  }, [organizedPermissions]);

  const standardResources = useMemo(() => {
    return organizedPermissions.filter((resource: any) => {
      if (resource.resource === "analytics" || resource.resource?.startsWith("analytics.")) return false;
      if (resource.resource === "ai" || resource.resource?.startsWith("ai.")) return false;
      if (hasContentMasterToggle(resource)) return false;
      if (isStandaloneResource(resource)) return false;
      if (isAdminOnlyResource(resource)) return false;
      return true;
    });
  }, [organizedPermissions]);

  const moduleMasterPermissions = useMemo(() => {
    return allPermissions.filter(
      (perm: any) =>
        perm.is_standalone === true &&
        perm.action?.toLowerCase() === "manage" &&
        perm.permission_category === "content_master"
    );
  }, [allPermissions]);

  return {
    allPermissions,
    organizedPermissions,
    analyticsUsedPermissions,
    aiUsedPermissions,
    standaloneResources,
    analyticsResources,
    aiResources,
    standardResources,
    moduleMasterPermissions,
  };
}
