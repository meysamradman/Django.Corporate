import React from "react";
import { AlertCircle } from "lucide-react";
import { getPermissionTranslation } from "@/core/messages/permissions";

interface Resource {
  resource: string;
  display_name: string;
  permissions: any[];
}

interface PermissionWarningAlertProps {
  logicalPermissionErrors: string[];
  standardResources: Resource[];
  getResourceIcon: (resourceKey: string) => React.ReactElement;
}

export function PermissionWarningAlert({
  logicalPermissionErrors,
  standardResources,
  getResourceIcon,
}: PermissionWarningAlertProps) {
  if (logicalPermissionErrors.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-amber-1 bg-amber p-4 animate-in fade-in slide-in-from-top-2">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-amber-0 rounded-full shrink-0 border border-amber-1">
          <AlertCircle className="h-5 w-5 text-amber-2" />
        </div>
        <div className="space-y-1">
          <h4 className="font-medium text-amber-2">
            توجه: دسترسی‌های ناقص شناسایی شد
          </h4>
          <p className="text-sm text-font-s leading-relaxed">
            شما برای برخی ماژول‌ها دسترسی عملیاتی (ایجاد، ویرایش یا حذف)
            داده‌اید، اما دسترسی <strong>«مشاهده»</strong> را فعال نکرده‌اید.
            <br />
            کاربران بدون دسترسی مشاهده، معمولاً نمی‌توانند وارد بخش مربوطه
            شوند تا عملیاتی انجام دهند.
          </p>
          <div className="pt-2 flex flex-wrap gap-2">
            {logicalPermissionErrors.map((resourceKey) => {
              const resource = standardResources.find(
                (r) => r.resource === resourceKey
              );
              return (
                <span
                  key={resourceKey}
                  className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-amber-0 text-amber-2 border border-amber-1"
                >
                  {resource
                    ? getPermissionTranslation(resource.display_name, "resource")
                    : resourceKey}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

