
import type { UseFormReturn } from "react-hook-form";
import { FormFieldInput, FormFieldTextarea } from "@/components/shared/FormField";
import type { PropertyFormValues } from "@/components/real-estate/validations/propertySchema";

interface RealEstateLocationAddressProps {
    form?: UseFormReturn<PropertyFormValues>;
    formData?: any;
    handleInputChange?: (field: string, value: any) => void;
    editMode: boolean;
    isFormApproach: boolean;
    errors?: Record<string, string>;
}

export function RealEstateLocationAddress({
    form,
    formData,
    handleInputChange,
    editMode,
    isFormApproach,
    errors: manualErrors
}: RealEstateLocationAddressProps) {
    const { register, formState: { errors: formErrors } } = isFormApproach
        ? form!
        : { register: null, formState: { errors: {} as any } };

    const errorsObj = isFormApproach ? formErrors : manualErrors || {};

    return (
        <div className="space-y-6">
            <FormFieldInput
                label="نام محله / خیابان اصلی"
                id="neighborhood"
                placeholder="مثلاً: پاسداران"
                disabled={!editMode}
                error={isFormApproach ? (errorsObj.neighborhood as any)?.message : errorsObj?.neighborhood}
                {...(isFormApproach ? register?.("neighborhood") : {
                    value: formData?.neighborhood || "",
                    onChange: (e) => handleInputChange?.("neighborhood", e.target.value)
                })}
            />

            <FormFieldTextarea
                label="آدرس دقیق"
                id="address"
                placeholder="خیابان، کوچه، پلاک، واحد..."
                rows={3}
                disabled={!editMode}
                error={isFormApproach ? (errorsObj.address as any)?.message : errorsObj?.address}
                {...(isFormApproach ? register?.("address") : {
                    value: formData?.address || "",
                    onChange: (e) => handleInputChange?.("address", e.target.value)
                })}
            />
        </div>
    );
}
