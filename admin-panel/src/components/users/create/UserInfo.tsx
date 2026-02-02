import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Input } from "@/components/elements/Input";
import { FormField } from "@/components/shared/FormField";
import type { UseFormReturn } from "react-hook-form";
import type { UserFormValues } from "@/components/users/validations/userSchema";
import { User } from "lucide-react";
import { filterNumericOnly } from "@/core/utils/numeric";
import { Item, ItemContent, ItemTitle, ItemDescription, ItemActions } from "@/components/elements/Item";
import { Switch } from "@/components/elements/Switch";

interface BaseInfoTabProps {
  form: UseFormReturn<UserFormValues>;
  editMode: boolean;
}

export default function UserInfo({
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

        <div className="mt-6 space-y-4">
          <div className="rounded-xl border border-green-1/40 bg-green-0/30 hover:border-green-1/60 transition-colors overflow-hidden">
            <Item variant="default" size="default" className="py-5">
              <ItemContent>
                <ItemTitle className="text-green-2">وضعیت فعال</ItemTitle>
                <ItemDescription>
                  با غیرفعال شدن، کاربر از سیستم خارج شده و امکان ورود نخواهد داشت.
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