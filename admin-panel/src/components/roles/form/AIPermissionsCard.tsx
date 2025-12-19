import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/elements/Card";
import { Checkbox } from "@/components/elements/Checkbox";
import { Switch } from "@/components/elements/Switch";
import { Sparkles, Shield, Info } from "lucide-react";
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
  allPermissions?: any[];
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
  allPermissions = [],
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

  const aiManagePermission = filteredPermissions.find(
    (p) => p.original_key === "ai.manage"
  );
  const isAiManageSelected = aiManagePermission
    ? isPermissionSelected(aiManagePermission.id)
    : false;
  
  const hasImagePermission = filteredPermissions.some(
    (p) => (p.original_key === "ai.image.manage" || p.original_key === "ai.manage") && isPermissionSelected(p.id)
  );
  
  const hasContentPermission = filteredPermissions.some(
    (p) => (p.original_key === "ai.content.manage" || p.original_key === "ai.manage") && isPermissionSelected(p.id)
  );
  
  const hasAudioPermission = filteredPermissions.some(
    (p) => (p.original_key === "ai.audio.manage" || p.original_key === "ai.manage") && isPermissionSelected(p.id)
  );
  
  const hasMediaPermission = allPermissions.some(
    (p: any) => (p.original_key === "media.manage" || p.resource === "media") && isPermissionSelected(p.id)
  );
  
  const hasBlogPermission = allPermissions.some(
    (p: any) => (p.original_key === "blog.manage" || p.resource === "blog") && isPermissionSelected(p.id)
  );
  
  const hasPortfolioPermission = allPermissions.some(
    (p: any) => (p.original_key === "portfolio.manage" || p.resource === "portfolio") && isPermissionSelected(p.id)
  );

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
              {selectedCount} / {filteredPermissions.length}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {hasContentPermission && !hasBlogPermission && !hasPortfolioPermission && (
          <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-600">
                  ⚠️ توجه: تولید محتوا بدون دسترسی وبلاگ یا نمونه‌کار
                </p>
                <p className="text-xs text-amber-600/80 mt-1">
                  این نقش می‌تواند محتوا تولید کند ولی بدون <strong>دسترسی وبلاگ یا نمونه‌کار</strong>، نمی‌تواند محتوا را در دیتابیس ذخیره کند.
                  <br />
                  برای فعال کردن قابلیت ذخیره محتوا، <strong>دسترسی وبلاگ یا نمونه‌کار</strong> را نیز فعال کنید.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {hasImagePermission && !hasMediaPermission && (
          <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-600">
                  ⚠️ توجه: تولید تصویر بدون دسترسی مدیا
                </p>
                <p className="text-xs text-amber-600/80 mt-1">
                  این نقش می‌تواند تصویر تولید کند ولی بدون <strong>دسترسی مدیا</strong>، نمی‌تواند تصاویر را در دیتابیس ذخیره کند.
                  <br />
                  برای فعال کردن قابلیت ذخیره تصاویر، <strong>دسترسی مدیا</strong> را نیز فعال کنید.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {hasAudioPermission && !hasMediaPermission && (
          <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-600">
                  ⚠️ توجه: تولید صدا/پادکست بدون دسترسی مدیا
                </p>
                <p className="text-xs text-amber-600/80 mt-1">
                  این نقش می‌تواند فایل صوتی تولید کند ولی بدون <strong>دسترسی مدیا</strong>، نمی‌تواند فایل‌ها را در دیتابیس ذخیره کند.
                  <br />
                  برای فعال کردن قابلیت ذخیره فایل‌های صوتی، <strong>دسترسی مدیا</strong> را نیز فعال کنید.
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPermissions
            .sort((a, b) => {
              return (
                aiUsedPermissions.indexOf(a.original_key || "") -
                aiUsedPermissions.indexOf(b.original_key || "")
              );
            })
            .map((perm) => {
              const isSelected = isPermissionSelected(perm.id);
              const isDisabled =
                isAiManageSelected &&
                perm.original_key !== "ai.manage" &&
                perm.original_key?.startsWith("ai.");

              const canToggle = !(perm.requires_superadmin && !isSuperAdmin) && !isDisabled;

              return (
                <div
                  key={perm.id}
                  className={`relative flex items-center gap-4 p-4 rounded-lg border transition-all duration-200 ${
                    isSelected
                      ? "border-yellow-600 bg-yellow-500/10"
                      : "border-br bg-card"
                  } ${!canToggle ? "opacity-50" : ""}`}
                >
                  <div className="flex-shrink-0">
                    <div
                      className={`p-2 rounded-lg transition-colors ${
                        isSelected
                          ? "bg-yellow-500/20"
                          : "bg-bg"
                      }`}
                    >
                      {getResourceIcon("ai")}
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h3 className={`text-sm font-medium leading-tight ${
                          isSelected ? "text-yellow-600" : "text-font-p"
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
                        {isDisabled && (
                          <div title="دسترسی کامل AI انتخاب شده است">
                            <Shield className="h-4 w-4 text-yellow-600" />
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

