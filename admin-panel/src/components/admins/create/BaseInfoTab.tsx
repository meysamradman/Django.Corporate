import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Input } from "@/components/elements/Input";
import { Label } from "@/components/elements/Label";
import { FormField } from "@/components/forms/FormField";
import type { UseFormReturn } from "react-hook-form";
import type { AdminFormValues } from "@/components/admins/validations/adminSchema";
import { User, ShieldCheck, Building2 } from "lucide-react";
import { filterNumericOnly } from "@/core/filters/numeric";
import { Item, ItemContent, ItemTitle, ItemDescription, ItemActions } from "@/components/elements/Item";
import { Switch } from "@/components/elements/Switch";

interface BaseInfoTabProps {
  form: UseFormReturn<AdminFormValues>;
  editMode: boolean;
}

export default function BaseInfoTab({
  form,
  editMode,
}: BaseInfoTabProps) {
  const { register, formState: { errors }, setValue, watch } = form;
  return (
    <div className="space-y-6">
      <CardWithIcon
        icon={User}
        title="اطلاعات احراز هویت"
        iconBgColor="bg-primary/10"
        iconColor="stroke-primary"
        borderColor="border-b-primary"
        className="hover:shadow-lg transition-all duration-300"
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            label="شماره موبایل"
            htmlFor="mobile"
            error={errors.mobile?.message}
            required
          >
            <Input
              id="mobile"
              type="text"
              inputMode="tel"
              placeholder="09xxxxxxxxx"
              disabled={!editMode}
              {...register("mobile", {
                onChange: (e) => {
                  const filteredValue = filterNumericOnly(e.target.value);
                  e.target.value = filteredValue;
                  form.setValue("mobile", filteredValue);
                }
              })}
            />
          </FormField>

          <FormField
            label="ایمیل"
            htmlFor="email"
            error={errors.email?.message}
          >
            <Input
              id="email"
              type="email"
              placeholder="example@domain.com"
              disabled={!editMode}
              {...register("email")}
            />
          </FormField>

          <FormField
            label="رمز عبور"
            htmlFor="password"
            error={errors.password?.message}
            required
            description="رمز عبور باید حداقل 8 کاراکتر و شامل حروف بزرگ، کوچک، عدد و کاراکتر ویژه باشد"
          >
            <Input
              id="password"
              type="password"
              placeholder="حداقل 8 کاراکتر"
              disabled={!editMode}
              {...register("password")}
            />
          </FormField>

          <FormField
            label="نام کامل"
            htmlFor="full_name"
            error={errors.full_name?.message}
            required
          >
            <Input
              id="full_name"
              type="text"
              placeholder="نام و نام خانوادگی"
              disabled={!editMode}
              {...register("full_name")}
            />
          </FormField>
        </div>

        <div className="mt-8 space-y-4">
          <Label className="text-base font-semibold text-font-p mb-2 block">نوع دسترسی کاربر</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Admin Selection Card */}
            <div
              onClick={() => {
                if (editMode) {
                  setValue("admin_role_type", "admin");
                }
              }}
              className={`relative cursor-pointer rounded-2xl border-2 p-5 transition-all duration-300 group ${watch("admin_role_type") !== "consultant"
                ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
                : "border-br bg-card hover:border-gray-0"
                }`}
            >
              <div className="flex items-start gap-4">
                <div className={`rounded-xl p-3 transition-colors ${watch("admin_role_type") !== "consultant" ? "bg-primary text-white" : "bg-bg text-gray-1 group-hover:bg-gray-0"
                  }`}>
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h4 className={`font-bold transition-colors ${watch("admin_role_type") !== "consultant" ? "text-primary" : "text-font-p"
                    }`}>مدیر سیستم</h4>
                  <p className="text-xs text-font-s mt-1 leading-relaxed">دسترسی کامل یا محدود به بخش‌های مدیریتی و تنظیمات فنی</p>
                </div>
                {watch("admin_role_type") !== "consultant" && (
                  <div className="absolute top-3 left-3">
                    <div className="bg-primary rounded-full p-1">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Consultant Selection Card */}
            <div
              onClick={() => {
                if (editMode) {
                  setValue("admin_role_type", "consultant");
                  setValue("is_superuser", false);
                }
              }}
              className={`relative cursor-pointer rounded-2xl border-2 p-5 transition-all duration-300 group ${watch("admin_role_type") === "consultant"
                ? "border-blue-1 bg-blue-0/10 shadow-md shadow-blue-1/10"
                : "border-br bg-card hover:border-gray-0"
                }`}
            >
              <div className="flex items-start gap-4">
                <div className={`rounded-xl p-3 transition-colors ${watch("admin_role_type") === "consultant" ? "bg-blue-1 text-white" : "bg-bg text-gray-1 group-hover:bg-gray-0"
                  }`}>
                  <Building2 className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h4 className={`font-bold transition-colors ${watch("admin_role_type") === "consultant" ? "text-blue-1" : "text-font-p"
                    }`}>مشاور املاک</h4>
                  <p className="text-xs text-font-s mt-1 leading-relaxed">دسترسی به بخش املاک، ثبت آگهی و مدیریت فایل‌های شخصی (Property Agent)</p>
                </div>
                {watch("admin_role_type") === "consultant" && (
                  <div className="absolute top-3 left-3">
                    <div className="bg-blue-1 rounded-full p-1">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-green-1/40 bg-green-0/30 hover:border-green-1/60 transition-colors overflow-hidden mt-6">
            <Item variant="default" size="default" className="py-5">
              <ItemContent>
                <ItemTitle className="text-green-2">وضعیت فعال حساب</ItemTitle>
                <ItemDescription>
                  با غیرفعال شدن این تیک، ادمین کلاً از سیستم خارج شده و امکان ورود مجدد را نخواهد داشت.
                </ItemDescription>
              </ItemContent>
              <ItemActions>
                <Switch
                  checked={watch("is_active") ?? true}
                  disabled={!editMode}
                  onCheckedChange={(checked) => setValue("is_active", checked)}
                />
              </ItemActions>
            </Item>
          </div>
        </div>
      </CardWithIcon>
    </div>
  );
}