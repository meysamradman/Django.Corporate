import React from "react";
import type { UseFormReturn } from "react-hook-form";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { FormFieldInput, FormFieldTextarea } from "@/components/forms/FormField";
import { Button } from "@/components/elements/Button";
import { User, Save, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface RoleBasicInfoFormProps<T extends { name: string; description?: string; permission_ids?: number[] }> {
  form: UseFormReturn<T>;
  onSubmit: (data: T) => Promise<void>;
  isSubmitting: boolean;
  submitButtonText?: string;
  hideSubmitButton?: boolean;
}

export function RoleBasicInfoForm<T extends { name: string; description?: string; permission_ids?: number[] }>({
  form,
  onSubmit,
  isSubmitting,
  submitButtonText = "بروزرسانی",
  hideSubmitButton = false,
}: RoleBasicInfoFormProps<T>) {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = form;

  return (
    <CardWithIcon
      icon={User}
      title="اطلاعات پایه"
      iconBgColor="bg-blue"
      iconColor="stroke-blue-2"
      borderColor="border-b-blue-1"
      className="hover:shadow-lg transition-all duration-300"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <FormFieldInput
          label="نام"
          id="name"
          required
          error={errors.name?.message as string}
          placeholder="نام نقش را وارد کنید"
          {...register("name" as any)}
        />

        <FormFieldTextarea
          label="توضیحات"
          id="description"
          error={errors.description?.message as string}
          placeholder="توضیحات نقش را وارد کنید (حداکثر ۳۰۰ کاراکتر)"
          rows={3}
          maxLength={300}
          {...register("description" as any)}
        />

        {!hideSubmitButton && (
          <div className="flex gap-4 justify-end">
            <Button type="submit" disabled={isSubmitting} className="flex items-center gap-2">
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {submitButtonText}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
              disabled={isSubmitting}
            >
              لغو
            </Button>
          </div>
        )}
      </form>
    </CardWithIcon>
  );
}

