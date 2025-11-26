"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/elements/Card";
import { Checkbox } from "@/components/elements/Checkbox";
import { Sparkles, Shield } from "lucide-react";
import { getPermissionTranslation, PERMISSION_TRANSLATIONS } from "@/core/messages/permissions";

interface Permission {
  id: number;
  original_key?: string;
  display_name: string;
  requires_superadmin?: boolean;
}

interface AIPermissionsCardProps {
  permissions: Permission[];
  selectedPermissions: number[];
  isSuperAdmin: boolean;
  aiUsedPermissions: readonly string[];
  onTogglePermission: (permissionId: number) => void;
  onToggleAllAI: (checked: boolean, aiPermIds: number[]) => void;
  isPermissionSelected: (permissionId: number | undefined) => boolean;
  getResourceIcon: (resourceKey: string) => React.ReactElement;
}

export function AIPermissionsCard({
  permissions,
  selectedPermissions,
  isSuperAdmin,
  aiUsedPermissions,
  onTogglePermission,
  onToggleAllAI,
  isPermissionSelected,
  getResourceIcon,
}: AIPermissionsCardProps) {
  if (permissions.length === 0) {
    return null;
  }

  const filteredPermissions = permissions.filter((perm) =>
    aiUsedPermissions.includes(perm.original_key || "")
  );

  if (filteredPermissions.length === 0) {
    return null;
  }

  const aiPermIds = filteredPermissions.map((p) => p.id);
  const allSelected = aiPermIds.every((id) => isPermissionSelected(id));
  const selectedCount = filteredPermissions.filter((p) =>
    isPermissionSelected(p.id)
  ).length;

  return (
    <Card className="border-2 border-dashed border-yellow-500/20 bg-yellow-500/5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-500/10">
              <Sparkles className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <CardTitle>
                {getPermissionTranslation("AI Tools", "resource")}
              </CardTitle>
              <p className="text-sm text-font-s mt-1">
                {PERMISSION_TRANSLATIONS.cardDescriptions.ai}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Checkbox 
              checked={allSelected} 
              onCheckedChange={(checked) => onToggleAllAI(checked === true, aiPermIds)} 
            />
            <div className="text-sm text-font-s">
              {permissions.filter((p: any) => 
                isPermissionSelected(p.id)
              ).length} / {permissions.filter((p: any) => 
                aiUsedPermissions.includes(p.original_key || "")
              ).length}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredPermissions
            .sort((a, b) => {
              return (
                aiUsedPermissions.indexOf(a.original_key || "") -
                aiUsedPermissions.indexOf(b.original_key || "")
              );
            })
            .map((perm) => {
              const isSelected = isPermissionSelected(perm.id);

              return (
                <div
                  key={perm.id}
                  onClick={() => {
                    if (perm.requires_superadmin && !isSuperAdmin) return;
                    onTogglePermission(perm.id);
                  }}
                  className={`group relative flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all duration-200 ${
                    perm.requires_superadmin && !isSuperAdmin
                      ? "cursor-not-allowed opacity-50"
                      : "cursor-pointer hover:scale-105"
                  } ${
                    isSelected
                      ? "border-yellow-600 bg-yellow-500/10"
                      : "border-br bg-card hover:border-yellow-500/20"
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg transition-colors ${
                      isSelected
                        ? "bg-yellow-500/20"
                        : "bg-bg group-hover:bg-yellow-500/10"
                    }`}
                  >
                    {getResourceIcon("ai")}
                  </div>
                  <span
                    className={`text-center text-sm font-medium leading-tight ${
                      isSelected ? "text-yellow-600" : "text-font-p"
                    }`}
                  >
                    {getPermissionTranslation(perm.display_name, "description")}
                  </span>
                  {perm.requires_superadmin && (
                    <div
                      className="absolute top-2 right-2 text-amber-500"
                      title="نیازمند دسترسی سوپر ادمین"
                    >
                      <Shield className="h-3 w-3" />
                    </div>
                  )}
                  {isSelected && (
                    <div className="absolute -top-2 -right-2 w-5 h-5 bg-yellow-600 rounded-full flex items-center justify-center">
                      <svg
                        className="w-3 h-3 text-wt"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
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

