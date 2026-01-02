import { Card, CardContent, CardHeader, CardTitle } from "@/components/elements/Card";
import { Switch } from "@/components/elements/Switch";
import { Shield, UserCog } from "lucide-react";
import { getPermissionTranslation } from "@/core/messages/permissions";
import { useMemo } from "react";
import type { ReactElement } from "react";

interface Permission {
  id: number;
  action?: string;
  display_name?: string;
  is_standalone?: boolean;
  requires_superadmin?: boolean;
  original_key?: string;
}

interface Resource {
  resource: string;
  display_name: string;
  permissions: Permission[];
}

interface AdminPermissionsCardProps {
  resources: Resource[];
  selectedPermissions: number[];
  isSuperAdmin: boolean;
  onTogglePermission: (permissionId: number) => void;
  isPermissionSelected: (permissionId: number | undefined) => boolean;
  getResourceIcon: (resourceKey: string) => ReactElement;
}

export function AdminPermissionsCard({
  resources,
  selectedPermissions,
  isSuperAdmin,
  onTogglePermission,
  isPermissionSelected,
  getResourceIcon,
}: AdminPermissionsCardProps) {
  if (resources.length === 0) {
    return null;
  }

  // بررسی اینکه آیا admin.manage انتخاب شده است
  const isAdminManageSelected = useMemo(() => {
    return resources.some((r) => {
      const managePerm = r.permissions.find(
        (p) => p.action?.toLowerCase() === "manage"
      );
      return managePerm && managePerm.id && isPermissionSelected(managePerm.id);
    });
  }, [resources, isPermissionSelected, selectedPermissions]);
  
  const selectedCount = resources.filter((r) => {
    const managePerm =
      r.permissions.find(
        (p) => p.action?.toLowerCase() === "manage" || p.is_standalone
      ) || r.permissions[0];
    return managePerm && managePerm.id && isPermissionSelected(managePerm.id);
  }).length;

  return (
    <Card className="border-2 border-dashed border-red-1/20 bg-red-0">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-0">
              <UserCog className="h-5 w-5 text-red-1" />
            </div>
            <div>
              <CardTitle>
                مجوزهای مدیریتی
              </CardTitle>
              <p className="text-sm text-font-s mt-1">
                دسترسی‌های حساس برای مدیریت ادمین‌ها (فقط سوپر ادمین می‌تواند این دسترسی‌ها را به نقش‌ها اختصاص دهد)
              </p>
            </div>
          </div>
          <div className="text-sm text-font-s">
            {selectedCount} / {resources.length}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {resources.map((resource) => {
            const managePerm = resource.permissions.find(
              (p) => p.action?.toLowerCase() === "manage"
            );
            const otherPerms = resource.permissions.filter(
              (p) => p.action?.toLowerCase() !== "manage"
            );
            
            const isManageSelected = managePerm && isPermissionSelected(managePerm.id);
            
            return (
              <div key={resource.resource} className="space-y-3">
                {/* نمایش admin.manage */}
                {managePerm && managePerm.id && (
                  <div
                    className={`relative flex items-center gap-4 p-4 rounded-lg border transition-all duration-200 ${
                      isManageSelected
                        ? "border-red-1 bg-red-0"
                        : "border-br bg-card"
                    }`}
                  >
                    <div className="flex-shrink-0">
                      <div
                        className={`p-2 transition-colors ${
                          isManageSelected
                            ? "bg-red-0"
                            : "bg-bg"
                        }`}
                      >
                        {getResourceIcon(resource.resource)}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h3 className={`text-sm font-medium leading-tight ${
                            isManageSelected ? "text-red-1" : "text-font-p"
                          }`}>
                            {getPermissionTranslation(managePerm.display_name || resource.display_name, "resource")}
                          </h3>
                        </div>
                        
                        <div className="flex-shrink-0 flex items-center gap-2">
                          {managePerm.requires_superadmin && (
                            <div title="دسترسی حساس - فقط برای مدیران کل">
                              <Shield className="h-4 w-4 text-red-1" />
                            </div>
                          )}
                          <Switch
                            checked={isManageSelected}
                            onCheckedChange={() => {
                              if (!(isSuperAdmin || !managePerm.requires_superadmin)) return;
                              onTogglePermission(managePerm.id!);
                            }}
                            disabled={!(isSuperAdmin || !managePerm.requires_superadmin)}
                            aria-label={getPermissionTranslation(managePerm.display_name || resource.display_name, "resource")}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* نمایش permissions جزئی (فقط اگر admin.manage انتخاب نشده باشد) */}
                {!isManageSelected && !isAdminManageSelected && otherPerms.length > 0 && (
                  <div className="pl-4 space-y-2 border-r-2 border-br">
                    {otherPerms.map((perm) => {
                      if (!perm.id) return null;
                      const isSelected = isPermissionSelected(perm.id);
                      const canToggle = !(perm.requires_superadmin && !isSuperAdmin);
                      
                      return (
                        <div
                          key={perm.id}
                          className={`flex items-center justify-between gap-2 p-3 rounded-lg border transition-all ${
                            isSelected
                              ? "border-red-1/50 bg-red-0"
                              : "border-br bg-card"
                          } ${!canToggle ? "opacity-50" : ""}`}
                        >
                          <span className={`text-sm ${
                            isSelected ? "text-red-1 font-medium" : "text-font-p"
                          }`}>
                            {getPermissionTranslation(perm.display_name || `${resource.display_name} - ${perm.action}`, "resource")}
                          </span>
                          <Switch
                            checked={isSelected}
                            onCheckedChange={() => {
                              if (!canToggle) return;
                              onTogglePermission(perm.id!);
                            }}
                            disabled={!canToggle}
                            aria-label={getPermissionTranslation(perm.display_name || `${resource.display_name} - ${perm.action}`, "resource")}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

