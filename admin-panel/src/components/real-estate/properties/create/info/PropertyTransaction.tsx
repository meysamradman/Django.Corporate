
import { useState, useEffect } from "react";
import type { UseFormReturn } from "react-hook-form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/elements/Select";
import { realEstateApi } from "@/api/real-estate";
import { cn } from "@/core/utils/cn";
import { FormField } from "@/components/shared/FormField";
import type { PropertyFormValues } from "@/components/real-estate/validations/propertySchema";

interface PropertyTransactionProps {
    form?: UseFormReturn<PropertyFormValues>;
    formData?: any;
    handleInputChange?: (field: string, value: any) => void;
    editMode: boolean;
    isFormApproach: boolean;
}

export function PropertyTransaction({ form, formData, handleInputChange, editMode, isFormApproach }: PropertyTransactionProps) {
    const { formState: { errors }, watch, setValue } = isFormApproach && form
        ? form
        : { formState: { errors: {} as any }, watch: null, setValue: null };

    const [statusOptions, setStatusOptions] = useState<[string, string][]>([]);
    const [loadingOptions, setLoadingOptions] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const optionsResponse = await realEstateApi.getFieldOptions();
                if (optionsResponse.status) {
                    setStatusOptions(optionsResponse.status);
                }
            } finally {
                setLoadingOptions(false);
            }
        };
        fetchData();
    }, []);

    const handleStatusChange = (value: string) => {
        if (isFormApproach && setValue) {
            setValue("status", value as any, { shouldValidate: false });
        } else {
            handleInputChange?.("status", value);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <FormField
                label="وضعیت معامله"
                required
                error={isFormApproach ? errors.status?.message : errors?.status}
            >
                <Select
                    disabled={!editMode || loadingOptions}
                    value={isFormApproach ? (watch?.("status") || "") : (formData?.status || "")}
                    onValueChange={handleStatusChange}
                >
                    <SelectTrigger className={cn((isFormApproach ? errors.status?.message : errors?.status) && "border-red-1")}>
                        <SelectValue placeholder={loadingOptions ? "در حال بارگذاری..." : "انتخاب وضعیت..."} />
                    </SelectTrigger>
                    <SelectContent>
                        {statusOptions.map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                                {label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </FormField>
        </div>
    );
}
