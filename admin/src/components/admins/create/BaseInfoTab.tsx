"use client";

import { Card, CardContent } from "@/components/elements/Card";
import { Input } from "@/components/elements/Input";
import { Label } from "@/components/elements/Label";
import { UseFormReturn } from "react-hook-form";
import { AdminFormValues } from "@/core/validations/adminSchema";

interface BaseInfoTabProps {
  form: UseFormReturn<AdminFormValues>;
  editMode: boolean;
}

export default function BaseInfoTab({
  form,
  editMode,
}: BaseInfoTabProps) {
  const { register, formState: { errors } } = form;
  return (
    <div className="mt-6 space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-6">
            {/* اطلاعات احراز هویت */}
            <div>
              <h3 className="text-lg font-medium mb-4">اطلاعات احراز هویت</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="mobile">
                    شماره موبایل <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="mobile"
                    type="text"
                    placeholder="09xxxxxxxxx"
                    disabled={!editMode}
                    className={errors.mobile ? "border-destructive" : ""}
                    {...register("mobile")}
                  />
                  {errors.mobile && (
                    <p className="text-xs text-destructive">{errors.mobile.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">ایمیل (اختیاری)</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="example@domain.com"
                    disabled={!editMode}
                    className={errors.email ? "border-destructive" : ""}
                    {...register("email")}
                  />
                  {errors.email && (
                    <p className="text-xs text-destructive">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">
                    رمز عبور <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="حداقل 8 کاراکتر"
                    disabled={!editMode}
                    className={errors.password ? "border-destructive" : ""}
                    {...register("password")}
                  />
                  {errors.password && (
                    <p className="text-xs text-destructive">{errors.password.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    رمز عبور باید حداقل 8 کاراکتر و شامل حروف بزرگ، کوچک، عدد و کاراکتر ویژه باشد
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="full_name">
                    نام کامل <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="full_name"
                    type="text"
                    placeholder="نام و نام خانوادگی"
                    disabled={!editMode}
                    className={errors.full_name ? "border-destructive" : ""}
                    {...register("full_name")}
                  />
                  {errors.full_name && (
                    <p className="text-xs text-destructive">{errors.full_name.message}</p>
                  )}
                </div>
              </div>
            </div>

          </div>
        </CardContent>
      </Card>
    </div>
  );
}

