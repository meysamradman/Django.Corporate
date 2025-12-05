"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/elements/Card";
import { Checkbox } from "@/components/elements/Checkbox";
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
              const isDisabled =
                isAiManageSelected &&
                perm.original_key !== "ai.manage" &&
                perm.original_key?.startsWith("ai.");

              return (
                <div
                  key={perm.id}
                  onClick={() => {
                    if (perm.requires_superadmin && !isSuperAdmin) return;
                    if (isDisabled) return;
                    onTogglePermission(perm.id);
                  }}
                  className={`group relative flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all duration-200 ${
                    perm.requires_superadmin && !isSuperAdmin
                      ? "cursor-not-allowed opacity-50"
                      : isDisabled
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
                  {isDisabled && (
                    <div
                      className="absolute top-2 left-2 text-yellow-600"
                      title="دسترسی کامل AI انتخاب شده است"
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

