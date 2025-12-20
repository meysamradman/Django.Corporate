import { Card, CardContent, CardHeader, CardTitle } from "@/components/elements/Card";
import { Switch } from "@/components/elements/Switch";
import { Settings, Shield } from "lucide-react";
import { getPermissionTranslation, PERMISSION_TRANSLATIONS } from "@/core/messages/permissions";
import type { ReactElement } from "react";

interface Permission {
  id: number;
  action?: string;
  is_standalone?: boolean;
  requires_superadmin?: boolean;
}

interface Resource {
  resource: string;
  display_name: string;
  permissions: Permission[];
}

interface ManagementPermissionsCardProps {
  resources: Resource[];
  selectedPermissions: number[];
  isSuperAdmin: boolean;
  onTogglePermission: (permissionId: number) => void;
  isPermissionSelected: (permissionId: number | undefined) => boolean;
  getResourceIcon: (resourceKey: string) => ReactElement;
}

export function ManagementPermissionsCard({
  resources,
  selectedPermissions,
  isSuperAdmin,
  onTogglePermission,
  isPermissionSelected,
  getResourceIcon,
}: ManagementPermissionsCardProps) {
  if (resources.length === 0) {
    return null;
  }

  const selectedCount = resources.filter((r) => {
    const managePerm =
      r.permissions.find(
        (p) => p.action?.toLowerCase() === "manage" || p.is_standalone
      ) || r.permissions[0];
    return managePerm && managePerm.id && isPermissionSelected(managePerm.id);
  }).length;

  return (
    <Card className="border-2 border-dashed border-blue-0 bg-blue">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-1/10">
              <Settings className="h-5 w-5 text-blue-1" />
            </div>
            <div>
              <CardTitle>
                {getPermissionTranslation("Settings", "resource")}
              </CardTitle>
              <p className="text-sm text-font-s mt-1">
                {PERMISSION_TRANSLATIONS.cardDescriptions.management}
              </p>
            </div>
          </div>
          <div className="text-sm text-font-s">
            {selectedCount} / {resources.length}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {resources.map((resource) => {
            const managePerm =
              resource.permissions.find(
                (p) => p.action?.toLowerCase() === "manage" || p.is_standalone
              ) || resource.permissions[0];

            if (!managePerm || !managePerm.id) return null;

            const isSelected = isPermissionSelected(managePerm.id);
            const canToggle = !(managePerm.requires_superadmin && !isSuperAdmin);

            return (
              <div
                key={`${resource.resource}-${managePerm.id}`}
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
                    {getResourceIcon(resource.resource)}
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h3 className={`text-sm font-medium leading-tight ${
                        isSelected ? "text-blue-1" : "text-font-p"
                      }`}>
                        {getPermissionTranslation(resource.display_name, "resource")}
                      </h3>
                      {(() => {
                        const descriptionKey = resource.display_name as keyof typeof PERMISSION_TRANSLATIONS.descriptions;
                        const description = PERMISSION_TRANSLATIONS.descriptions[descriptionKey];
                        return description && description !== getPermissionTranslation(resource.display_name, "resource") ? (
                          <p className="text-xs text-font-s mt-1">
                            {description}
                          </p>
                        ) : null;
                      })()}
                    </div>
                    
                    <div className="flex-shrink-0 flex items-center gap-2">
                      {managePerm.requires_superadmin && !isSuperAdmin && (
                        <div title="نیازمند دسترسی سوپر ادمین">
                          <Shield className="h-4 w-4 text-amber-500" />
                        </div>
                      )}
                      <Switch
                        checked={isSelected}
                        onCheckedChange={(checked) => {
                          if (!canToggle) return;
                          onTogglePermission(managePerm.id!);
                        }}
                        disabled={!canToggle}
                        aria-label={getPermissionTranslation(resource.display_name, "resource")}
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

