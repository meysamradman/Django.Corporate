import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Input } from "@/components/elements/Input";
import { FormField } from "@/components/shared/FormField";
import type { UseFormReturn } from "react-hook-form";
import type { AgencyFormValues } from "@/components/real-estate/validations/agencySchema";
import { Building2 } from "lucide-react";
import { filterNumericOnly } from "@/core/filters/numeric";
import { Item, ItemContent, ItemTitle, ItemDescription, ItemActions } from "@/components/elements/Item";
import { Switch } from "@/components/elements/Switch";
import { PersianDatePicker } from "@/components/elements/PersianDatePicker";

interface BaseInfoTabProps {
  form: UseFormReturn<AgencyFormValues>;
  editMode: boolean;
  agencyData?: any;
  fieldErrors?: Record<string, string>;
  handleInputChange?: (field: string, value: any) => void;
}

export default function AgencyInfo({
  form,
  editMode,
  fieldErrors = {},
  handleInputChange,
}: BaseInfoTabProps) {
  const { register, formState: { errors }, setValue, watch } = form;

  const handleChange = (field: string, value: any) => {
    if (handleInputChange) {
      handleInputChange(field, value);
    } else {
      form.setValue(field as keyof AgencyFormValues, value);
    }
  };

  return (
    <div className="space-y-6">
      <CardWithIcon
        icon={Building2}
        title="اطلاعات احراز هویت"
        iconBgColor="bg-primary/10"
        iconColor="stroke-primary"
        borderColor="border-b-primary"
        className="hover:shadow-lg transition-all duration-300"
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            label="نام آژانس"
            htmlFor="name"
            error={errors.name?.message || fieldErrors.name}
            required
          >
            <Input
              id="name"
              type="text"
              placeholder="نام آژانس املاک"
              disabled={!editMode}
              {...register("name", {
                onChange: (e) => handleInputChange && handleInputChange("name", e.target.value)
              })}
            />
          </FormField>

          <FormField
            label="نامک"
            htmlFor="slug"
            error={errors.slug?.message || fieldErrors.slug}
            description="برای نمایش در وب‌سایت"
            required
          >
            <Input
              id="slug"
              type="text"
              placeholder="agency-name"
              disabled={!editMode}
              {...register("slug", {
                onChange: (e) => handleInputChange && handleInputChange("slug", e.target.value)
              })}
            />
          </FormField>

          <FormField
            label="شماره پروانه"
            htmlFor="license_number"
            error={errors.license_number?.message || fieldErrors.license_number}
          >
            <Input
              id="license_number"
              type="text"
              placeholder="شماره پروانه کسب"
              disabled={!editMode}
              {...register("license_number")}
            />
          </FormField>

          <FormField
            label="تاریخ انقضای پروانه"
            htmlFor="license_expire_date"
            error={errors.license_expire_date?.message || fieldErrors.license_expire_date}
          >
            <PersianDatePicker
              value={watch("license_expire_date") || ""}
              onChange={(value) => setValue("license_expire_date", value)}
              disabled={!editMode}
              placeholder="انتخاب تاریخ انقضا"
            />
          </FormField>

          <FormField
            label="شماره موبایل"
            htmlFor="phone"
            error={errors.phone?.message || fieldErrors.phone}
            required
          >
            <Input
              id="phone"
              type="text"
              inputMode="tel"
              placeholder="09xxxxxxxxx"
              disabled={!editMode}
              {...register("phone", {
                onChange: (e) => {
                  const filteredValue = filterNumericOnly(e.target.value);
                  e.target.value = filteredValue;
                  handleChange("phone", filteredValue);
                }
              })}
            />
          </FormField>

          <FormField
            label="ایمیل"
            htmlFor="email"
            error={errors.email?.message || fieldErrors.email}
          >
            <Input
              id="email"
              type="email"
              placeholder="example@domain.com"
              disabled={!editMode}
              {...register("email")}
            />
          </FormField>
        </div>

        <div className="mt-6 space-y-4">
          <div className="rounded-xl border border-blue-1/40 bg-blue-0/30 hover:border-blue-1/60 transition-colors overflow-hidden">
            <Item variant="default" size="default" className="py-5">
              <ItemContent>
                <ItemTitle className="text-blue-2">وضعیت فعال</ItemTitle>
                <ItemDescription>
                  آژانس در لیست نمایش داده شده و امکان رزرو دارد.
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