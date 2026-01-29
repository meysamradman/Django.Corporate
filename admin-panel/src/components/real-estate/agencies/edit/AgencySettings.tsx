import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Input } from "@/components/elements/Input";
import { FormField } from "@/components/shared/FormField";
import type { UseFormReturn } from "react-hook-form";
import type { AgencyFormValues } from "@/components/real-estate/validations/agencySchema";
import { Settings } from "lucide-react";

interface SettingsTabProps {
  form: UseFormReturn<AgencyFormValues>;
  editMode: boolean;
  fieldErrors?: Record<string, string>;
  handleInputChange?: (field: string, value: any) => void;
}

export default function AgencySettings({
  form,
  editMode,
  fieldErrors = {},
}: SettingsTabProps) {
  const { register, formState: { errors } } = form;

  return (
    <div className="space-y-6">
      <CardWithIcon
        icon={Settings}
        title="اطلاعات آماری"
        iconBgColor="bg-primary/10"
        iconColor="stroke-primary"
        borderColor="border-b-primary"
        className="hover:shadow-lg transition-all duration-300"
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            label="رتبه (0-5)"
            htmlFor="rating"
            error={errors.rating?.message || fieldErrors.rating}
          >
            <Input
              id="rating"
              type="number"
              step="0.1"
              min="0"
              max="5"
              placeholder="4.5"
              disabled={!editMode}
              {...register("rating", {
                valueAsNumber: true,
                min: 0,
                max: 5
              })}
            />
          </FormField>

          <FormField
            label="تعداد نظرات"
            htmlFor="total_reviews"
            error={errors.total_reviews?.message || fieldErrors.total_reviews}
          >
            <Input
              id="total_reviews"
              type="number"
              min="0"
              placeholder="0"
              disabled={!editMode}
              {...register("total_reviews", {
                valueAsNumber: true,
                min: 0
              })}
            />
          </FormField>
        </div>
      </CardWithIcon>

    </div>
  );
}
