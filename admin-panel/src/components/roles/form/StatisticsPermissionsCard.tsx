import { Card, CardContent, CardHeader, CardTitle } from "@/components/elements/Card";
import { Checkbox } from "@/components/elements/Checkbox";
import { Switch } from "@/components/elements/Switch";
import { PieChart, Shield } from "lucide-react";
import { getPermissionTranslation, PERMISSION_TRANSLATIONS } from "@/core/messages/permissions";
import { useMemo } from "react";
import type { ReactElement } from "react";

interface Permission {
  id: number;
  original_key?: string;
  display_name: string;
  requires_superadmin?: boolean;
}

interface StatisticsPermissionsCardProps {
  permissions: Permission[];
  selectedPermissions: number[];
  isSuperAdmin: boolean;
  statisticsUsedPermissions: readonly string[];
  onTogglePermission: (permissionId: number) => void;
  onToggleAllStatistics: (checked: boolean, statsPermIds: number[]) => void;
  isPermissionSelected: (permissionId: number | undefined) => boolean;
  getResourceIcon: (resourceKey: string) => ReactElement;
}

export function StatisticsPermissionsCard({
  permissions,
  selectedPermissions,
  isSuperAdmin,
  statisticsUsedPermissions,
  onTogglePermission,
  onToggleAllStatistics,
  isPermissionSelected,
  getResourceIcon,
}: StatisticsPermissionsCardProps) {
  if (permissions.length === 0) {
    return null;
  }

  const filteredPermissions = permissions.filter((perm) =>
    statisticsUsedPermissions.includes(perm.original_key || "")
  );

  if (filteredPermissions.length === 0) {
    return null;
  }

  const statsPermIds = filteredPermissions.map((p) => p.id);
  const allSelected = statsPermIds.every((id) => isPermissionSelected(id));
  const selectedCount = filteredPermissions.filter((p) =>
    isPermissionSelected(p.id)
  ).length;

  // بررسی اینکه آیا analytics.manage یا analytics.stats.manage انتخاب شده است
  const analyticsManagePermission = filteredPermissions.find(
    (p) => p.original_key === "analytics.manage" || p.original_key === "analytics.stats.manage"
  );
  const isAnalyticsManageSelected = useMemo(() => {
    if (!analyticsManagePermission) return false;
    return isPermissionSelected(analyticsManagePermission.id);
  }, [analyticsManagePermission, isPermissionSelected, selectedPermissions]);

  return (
    <Card className="border-2 border-dashed border-blue-0 bg-blue">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-1/10">
              <PieChart className="h-5 w-5 text-blue-1" />
            </div>
            <div>
              <CardTitle>
                {getPermissionTranslation("Analytics", "resource")}
              </CardTitle>
              <p className="text-sm text-font-s mt-1">
                {PERMISSION_TRANSLATIONS.cardDescriptions.analytics}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Checkbox 
              checked={allSelected} 
              onCheckedChange={(checked) => onToggleAllStatistics(checked === true, statsPermIds)} 
            />
            <div className="text-sm text-font-s">
              {selectedCount} / {filteredPermissions.length}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* نمایش analytics.manage */}
          {analyticsManagePermission && (
            <div
              className={`relative flex items-center gap-4 p-4 rounded-lg border transition-all duration-200 ${
                isAnalyticsManageSelected
                  ? "border-blue-1 bg-blue-0"
                  : "border-br bg-card"
              }`}
            >
              <div className="flex-shrink-0">
                <div
                  className={`p-2 rounded-lg transition-colors ${
                    isAnalyticsManageSelected
                      ? "bg-blue-1/20"
                      : "bg-bg"
                  }`}
                >
                  {getResourceIcon("analytics")}
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h3 className={`text-sm font-medium leading-tight ${
                      isAnalyticsManageSelected ? "text-blue-1" : "text-font-p"
                    }`}>
                      {getPermissionTranslation(analyticsManagePermission.display_name, "description")}
                    </h3>
                  </div>
                  
                  <div className="flex-shrink-0 flex items-center gap-2">
                    {analyticsManagePermission.requires_superadmin && (
                      <div title="دسترسی حساس - فقط برای مدیران کل">
                        <Shield className="h-4 w-4 text-blue-1" />
                      </div>
                    )}
                    <Switch
                      checked={isAnalyticsManageSelected}
                      onCheckedChange={() => {
                        if (!(isSuperAdmin || !analyticsManagePermission.requires_superadmin)) return;
                        onTogglePermission(analyticsManagePermission.id);
                      }}
                      disabled={!(isSuperAdmin || !analyticsManagePermission.requires_superadmin)}
                      aria-label={getPermissionTranslation(analyticsManagePermission.display_name, "description")}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* نمایش permissions جزئی (فقط اگر analytics.manage انتخاب نشده باشد) */}
          {!isAnalyticsManageSelected && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPermissions
                .filter((p) => p.original_key !== "analytics.manage" && p.original_key !== "analytics.stats.manage")
                .sort((a, b) => {
                  return (
                    statisticsUsedPermissions.indexOf(a.original_key || "") -
                    statisticsUsedPermissions.indexOf(b.original_key || "")
                  );
                })
                .map((perm) => {
                  const isSelected = isPermissionSelected(perm.id);
                  const canToggle = !(perm.requires_superadmin && !isSuperAdmin);

                  return (
                    <div
                      key={perm.id}
                      className={`relative flex items-center gap-4 p-4 rounded-lg border transition-all duration-200 ${
                        isSelected
                          ? "border-blue-1 bg-blue-0"
                          : "border-br bg-card"
                      } ${!canToggle ? "opacity-50" : ""}`}
                    >
                  <div className="flex-shrink-0">
                    <div
                      className={`p-2 rounded-lg transition-colors ${
                        isSelected
                          ? "bg-blue-1/20"
                          : "bg-bg"
                      }`}
                    >
                      {getResourceIcon("analytics")}
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h3 className={`text-sm font-medium leading-tight ${
                          isSelected ? "text-blue-1" : "text-font-p"
                        }`}>
                          {getPermissionTranslation(perm.display_name, "description")}
                        </h3>
                        {(() => {
                          const descriptionKey = perm.display_name as keyof typeof PERMISSION_TRANSLATIONS.descriptions;
                          const description = PERMISSION_TRANSLATIONS.descriptions[descriptionKey];
                          return description && description !== getPermissionTranslation(perm.display_name, "description") ? (
                            <p className="text-xs text-font-s mt-1">
                              {description}
                            </p>
                          ) : null;
                        })()}
                      </div>
                      
                      <div className="flex-shrink-0 flex items-center gap-2">
                        {perm.requires_superadmin && !isSuperAdmin && (
                          <div title="نیازمند دسترسی سوپر ادمین">
                            <Shield className="h-4 w-4 text-amber-500" />
                          </div>
                        )}
                        <Switch
                          checked={isSelected}
                          onCheckedChange={(_checked) => {
                            if (!canToggle) return;
                            onTogglePermission(perm.id);
                          }}
                          disabled={!canToggle}
                          aria-label={getPermissionTranslation(perm.display_name, "description")}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

