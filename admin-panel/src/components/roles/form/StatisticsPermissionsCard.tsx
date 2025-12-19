import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/elements/Card";
import { Checkbox } from "@/components/elements/Checkbox";
import { Switch } from "@/components/elements/Switch";
import { PieChart, Shield } from "lucide-react";
import { getPermissionTranslation, PERMISSION_TRANSLATIONS } from "@/core/messages/permissions";

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
  getResourceIcon: (resourceKey: string) => React.ReactElement;
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPermissions
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
                          onCheckedChange={(checked) => {
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
      </CardContent>
    </Card>
  );
}

