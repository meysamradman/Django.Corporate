"use client";

import { Card, CardContent } from "@/components/elements/Card";
import { Label } from "@/components/elements/Label";
import { Switch } from "@/components/elements/Switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/elements/Select";
import { Role } from "@/types/auth/permission";
import { ShieldCheck, ShieldAlert } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { AdminFormValues } from "@/core/validations/adminSchema";

interface PermissionsTabProps {
  form: UseFormReturn<AdminFormValues>;
  roles: Role[];
  loadingRoles: boolean;
  rolesError: string | null;
  editMode: boolean;
}

export default function PermissionsTab({
  form,
  roles,
  loadingRoles,
  rolesError,
  editMode,
}: PermissionsTabProps) {
  const { formState: { errors }, setValue, watch } = form;
  const isSuperuser = watch("is_superuser");
  const roleId = watch("role_id");

  return (
    <div className="mt-6 space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-6">
            {/* انتخاب نقش */}
            <div>
              <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5" />
                نقش و سطح دسترسی
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="role">نقش کاربری</Label>
                  {rolesError && (
                    <p className="text-sm text-destructive mb-2">{rolesError}</p>
                  )}
                  <Select
                    value={roleId}
                    onValueChange={(value) => setValue("role_id", value)}
                    disabled={loadingRoles || !editMode}
                  >
                    <SelectTrigger
                      className="w-full"
                      aria-invalid={!!errors.role_id}
                    >
                      <SelectValue placeholder="انتخاب نقش..." />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingRoles ? (
                        <SelectItem value="loading" disabled>
                          در حال بارگذاری نقش‌ها...
                        </SelectItem>
                      ) : roles.length === 0 && !rolesError ? (
                        <SelectItem value="no-roles" disabled>
                          نقشی موجود نیست
                        </SelectItem>
                      ) : (
                        <>
                          <SelectItem value="none">بدون نقش</SelectItem>
                          {roles.map((role) => (
                            <SelectItem key={role.id} value={role.id.toString()}>
                              {role.display_name || role.name}
                            </SelectItem>
                          ))}
                        </>
                      )}
                    </SelectContent>
                  </Select>
                  {errors.role_id && (
                    <p className="text-sm text-destructive">{errors.role_id.message}</p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    نقش کاربری تعیین می‌کند که این ادمین به چه بخش‌هایی دسترسی دارد
                  </p>
                </div>
              </div>
            </div>

            {/* دسترسی‌های خاص */}
            <div>
              <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5" />
                دسترسی‌های ویژه
              </h3>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between rounded-lg border p-4 bg-amber-50 dark:bg-amber-950/10">
                  <div className="space-y-0.5 flex-1">
                    <Label htmlFor="is_superuser" className="text-base cursor-pointer flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-amber-600" />
                      <span className="font-semibold text-amber-900 dark:text-amber-100">
                        سوپر ادمین
                      </span>
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      دسترسی کامل و نامحدود به تمام بخش‌های پنل (بدون توجه به نقش)
                    </p>
                    <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mt-1">
                      ⚠️ توجه: این دسترسی تمام محدودیت‌ها را نادیده می‌گیرد
                    </p>
                  </div>
                  <Switch
                    id="is_superuser"
                    checked={isSuperuser}
                    onCheckedChange={(checked) => setValue("is_superuser", checked)}
                    disabled={!editMode}
                  />
                </div>

              </div>
            </div>


          </div>
        </CardContent>
      </Card>
    </div>
  );
}
