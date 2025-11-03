"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/elements/Card";
import { Input } from "@/components/elements/Input";
import { FormField } from "@/components/forms/FormField";
import { UseFormReturn } from "react-hook-form";
import { UserFormValues } from "@/core/validations/userSchema";
import { User } from "lucide-react";

// Function to prevent non-numeric input
const preventNonNumeric = (e: React.KeyboardEvent<HTMLInputElement>) => {
  // Allow: backspace, delete, tab, escape, enter
  if ([46, 8, 9, 27, 13].includes(e.keyCode) ||
    // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
    (e.keyCode === 65 && e.ctrlKey === true) ||
    (e.keyCode === 67 && e.ctrlKey === true) ||
    (e.keyCode === 86 && e.ctrlKey === true) ||
    (e.keyCode === 88 && e.ctrlKey === true) ||
    // Allow: home, end, left, right
    (e.keyCode >= 35 && e.keyCode <= 39)) {
    return; // let it happen, don't do anything
  }
  // Ensure that it is a number and stop the keypress
  if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
    e.preventDefault();
  }
};

// Function to prevent non-numeric paste
const preventNonNumericPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
  const paste = e.clipboardData.getData('text');
  if (!/^\d*$/.test(paste)) {
    e.preventDefault();
  }
};

interface BaseInfoTabProps {
  form: UseFormReturn<UserFormValues>;
  editMode: boolean;
}

export default function BaseInfoTab({
  form,
  editMode,
}: BaseInfoTabProps) {
  const { register, formState: { errors } } = form;
  return (
    <div className="space-y-6">
      <Card className="hover:shadow-lg transition-all duration-300 border-b-4 border-b-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl shadow-sm">
              <User className="w-5 h-5 stroke-primary" />
            </div>
            اطلاعات احراز هویت
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
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
                {...register("mobile")}
                onKeyDown={preventNonNumeric}
                onPaste={preventNonNumericPaste}
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
        </CardContent>
      </Card>
    </div>
  );
}