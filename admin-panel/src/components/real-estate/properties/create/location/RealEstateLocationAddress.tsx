
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormFieldInput
                    label="نام محله / خیابان اصلی"
                    id="neighborhood"
                    placeholder="مثلاً: پاسداران"
                    disabled={!editMode}
                    className="h-11 bg-bg/20 border-muted/20"
                    error={isFormApproach ? (errorsObj.neighborhood as any)?.message : errorsObj?.neighborhood}
                    {...(isFormApproach ? register?.("neighborhood") : {
                        value: formData?.neighborhood || "",
                        onChange: (e) => handleInputChange?.("neighborhood", e.target.value)
                    })}
                />

                <FormFieldInput
                    label="کد پستی"
                    id="postal_code"
                    placeholder="۱۰ رقم (مانند: ۱۲۳۴۵۶۷۸۹۰)"
                    disabled={!editMode}
                    className="h-11 bg-bg/20 border-muted/20"
                    maxLength={10}
                    error={isFormApproach ? (errorsObj.postal_code as any)?.message : errorsObj?.postal_code}
                    {...(isFormApproach ? register?.("postal_code") : {
                        value: formData?.postal_code || "",
                        onChange: (e) => handleInputChange?.("postal_code", e.target.value)
                    })}
                />
            </div>

            <FormFieldTextarea
                label="آدرس دقیق"
                id="address"
                placeholder="خیابان، کوچه، پلاک، واحد..."
                rows={3}
                disabled={!editMode}
                className="bg-bg/20 border-muted/20"
                error={isFormApproach ? (errorsObj.address as any)?.message : errorsObj?.address}
                {...(isFormApproach ? register?.("address") : {
                    value: formData?.address || "",
                    onChange: (e) => handleInputChange?.("address", e.target.value)
                })}
            />
        </div>
    );
}
