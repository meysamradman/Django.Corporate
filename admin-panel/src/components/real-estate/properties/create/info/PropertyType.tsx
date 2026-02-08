
import { useState, useEffect } from "react";
import type { UseFormReturn } from "react-hook-form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/elements/Select";
import { realEstateApi } from "@/api/real-estate";
import { cn } from "@/core/utils/cn";
import { FormField } from "@/components/shared/FormField";
import type { PropertyType } from "@/types/real_estate/type/propertyType";
import type { PropertyState } from "@/types/real_estate/state/realEstateState";
import type { PropertyFormValues } from "@/components/real-estate/validations/propertySchema";

interface PropertyTypeProps {
    form?: UseFormReturn<PropertyFormValues>;
    formData?: any;
    handleInputChange?: (field: string, value: any) => void;
    editMode: boolean;
    isFormApproach: boolean;
}

export function PropertyType({ form, formData, handleInputChange, editMode, isFormApproach }: PropertyTypeProps) {
    const { formState: { errors }, watch, setValue } = isFormApproach && form
        ? form
        : { formState: { errors: {} as any }, watch: null, setValue: null };

    const [propertyTypes, setPropertyTypes] = useState<PropertyType[]>([]);
    const [propertyStates, setPropertyStates] = useState<PropertyState[]>([]);
    const [loadingTypes, setLoadingTypes] = useState(true);
    const [loadingStates, setLoadingStates] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const typesResponse = await realEstateApi.getTypes({ page: 1, size: 100, is_active: true });
                setPropertyTypes(typesResponse.data || []);
            } finally {
                setLoadingTypes(false);
            }

            try {
                const statesResponse = await realEstateApi.getStates({ page: 1, size: 100, is_active: true });
                setPropertyStates(statesResponse.data || []);
            } finally {
                setLoadingStates(false);
            }
        };
        fetchData();
    }, []);

    const handlePropertyTypeChange = (value: string) => {
        if (isFormApproach && setValue) {
            setValue("property_type", value ? Number(value) : undefined!, { shouldValidate: false });
        } else {
            handleInputChange?.("property_type", value ? Number(value) : null);
        }
    };

    const handleStateChange = (value: string) => {
        if (isFormApproach && setValue) {
            setValue("state", value ? Number(value) : undefined!, { shouldValidate: false });
        } else {
            handleInputChange?.("state", value ? Number(value) : null);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <FormField
                label="نوع ملک"
                required
                error={isFormApproach ? errors.property_type?.message : errors?.property_type}
            >
                <Select
                    disabled={!editMode || loadingTypes}
                    value={isFormApproach ? (watch?.("property_type") ? String(watch("property_type")) : "") : (formData?.property_type ? String(formData.property_type) : "")}
                    onValueChange={handlePropertyTypeChange}
                >
                    <SelectTrigger className={cn((isFormApproach ? errors.property_type?.message : errors?.property_type) && "border-red-1")}>
                        <SelectValue placeholder={loadingTypes ? "در حال بارگذاری..." : "نوع ملک را انتخاب کنید"} />
                    </SelectTrigger>
                    <SelectContent>
                        {(propertyTypes || []).map((type) => (
                            <SelectItem key={type.id} value={String(type.id)}>
                                {type.title}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </FormField>

            <FormField
                label="وضعیت ملک"
                required
                error={isFormApproach ? errors.state?.message : errors?.state}
            >
                <Select
                    disabled={!editMode || loadingStates}
                    value={isFormApproach ? (watch?.("state") ? String(watch("state")) : "") : (formData?.state ? String(formData.state) : "")}
                    onValueChange={handleStateChange}
                >
                    <SelectTrigger className={cn((isFormApproach ? errors.state?.message : errors?.state) && "border-red-1")}>
                        <SelectValue placeholder={loadingStates ? "در حال بارگذاری..." : "مثلاً فروشی، اجاره‌ای..."} />
                    </SelectTrigger>
                    <SelectContent>
                        {(propertyStates || []).map((state) => (
                            <SelectItem key={state.id} value={String(state.id)}>
                                {state.title}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </FormField>
        </div>
    );
}
