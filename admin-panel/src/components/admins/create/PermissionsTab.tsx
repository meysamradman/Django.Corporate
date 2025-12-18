"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/elements/Card";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { FormField } from "@/components/forms/FormField";
import { Switch } from "@/components/elements/Switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/elements/Select";
import { Role } from "@/types/auth/permission";
import { ShieldCheck, ShieldAlert } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { AdminFormValues } from "@/components/admins/validations/adminSchema";

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
    <div className="space-y-6">
      <CardWithIcon
        icon={ShieldCheck}
        title="نقش و سطح دسترسی"
        iconBgColor="bg-blue"
        iconColor="stroke-blue-2"
        borderColor="border-b-blue-1"
        className="hover:shadow-lg transition-all duration-300"
      >
          <FormField
            label="نقش کاربری"
            htmlFor="role"
            error={errors.role_id?.message || rolesError || undefined}
            description="نقش کاربری تعیین می‌کند که این ادمین به چه بخش‌هایی دسترسی دارد"
          >
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
          </FormField>
      </CardWithIcon>

      <CardWithIcon
        icon={ShieldAlert}
        title="دسترسی‌های ویژه"
        iconBgColor="bg-yellow"
        iconColor="stroke-yellow-2"
        borderColor="border-b-yellow-1"
        className="hover:shadow-lg transition-all duration-300"
      >
          <div className="flex items-center justify-between rounded-lg border p-4 bg-amber">
            <div className="space-y-0.5 flex-1">
              <label htmlFor="is_superuser" className="text-base cursor-pointer flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-1" />
                <span className="font-semibold text-amber-2">
                  سوپر ادمین
                </span>
              </label>
              <p className="text-sm text-font-s">
                دسترسی کامل و نامحدود به تمام بخش‌های پنل (بدون توجه به نقش)
              </p>
              <p className="text-xs text-amber-1 font-medium mt-1">
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
      </CardWithIcon>
    </div>
  );
}
