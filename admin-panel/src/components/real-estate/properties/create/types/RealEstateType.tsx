
import { useState, useEffect, lazy, Suspense } from "react";
import type { UseFormReturn } from "react-hook-form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/elements/Select";
import { Button } from "@/components/elements/Button";
import { Plus } from "lucide-react";
import { realEstateApi } from "@/api/real-estate";
import { cn } from "@/core/utils/cn";
import { FormField } from "@/components/shared/FormField";
import type { PropertyType } from "@/types/real_estate/type/propertyType";
import type { PropertyState } from "@/types/real_estate/state/realEstateState";
import type { PropertyFormValues } from "@/components/real-estate/validations/propertySchema";

const PropertyTypeSide = lazy(() =>
    import("../../../types/PropertyTypeSide").then(module => ({ default: module.PropertyTypeSide }))
);

const PropertyStateSide = lazy(() =>
    import("../../../states/PropertyStateSide").then(module => ({ default: module.PropertyStateSide }))
);

interface RealEstateTypeProps {
    form?: UseFormReturn<PropertyFormValues>;
    formData?: any;
    handleInputChange?: (field: string, value: any) => void;
    editMode: boolean;
    isFormApproach: boolean;
}

export function RealEstateType(props: RealEstateTypeProps) {
    const { form, formData, handleInputChange, editMode, isFormApproach } = props;
    const { formErrors, watch, setValue } = isFormApproach && form
        ? { formErrors: form.formState.errors, watch: form.watch, setValue: form.setValue }
        : { formErrors: (props as any).errors || {}, watch: null, setValue: null };

    const [propertyTypes, setPropertyTypes] = useState<PropertyType[]>([]);
    const [propertyStates, setPropertyStates] = useState<PropertyState[]>([]);
    const [loadingTypes, setLoadingTypes] = useState(true);
    const [loadingStates, setLoadingStates] = useState(true);
    const [showTypeDialog, setShowTypeDialog] = useState(false);
    const [showStateDialog, setShowStateDialog] = useState(false);

    const fetchTypes = async () => {
        try {
            const typesResponse = await realEstateApi.getTypes({ page: 1, size: 100, is_active: true });
            setPropertyTypes(typesResponse.data || []);
        } finally {
            setLoadingTypes(false);
        }
    };

    const fetchStates = async () => {
        try {
            const statesResponse = await realEstateApi.getStates({ page: 1, size: 100, is_active: true });
            setPropertyStates(statesResponse.data || []);
        } finally {
            setLoadingStates(false);
        }
    };

    useEffect(() => {
        fetchTypes();
        fetchStates();
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
        <div className="grid grid-cols-1 gap-6">
            <FormField
                label="نوع ملک"
                required
                error={isFormApproach ? formErrors.property_type?.message : formErrors?.property_type}
            >
                <div className="flex gap-2">
                    <Select
                        disabled={!editMode || loadingTypes}
                        value={isFormApproach ? (watch?.("property_type") ? String(watch("property_type")) : "") : (formData?.property_type ? String(formData.property_type) : "")}
                        onValueChange={handlePropertyTypeChange}
                    >
                        <SelectTrigger className={cn("w-full", (isFormApproach ? formErrors.property_type?.message : formErrors?.property_type) && "border-red-1")}>
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
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="shrink-0 border-blue-1 text-blue-2 hover:bg-blue"
                        onClick={() => setShowTypeDialog(true)}
                        disabled={!editMode}
                    >
                        <Plus className="w-4 h-4" />
                    </Button>
                </div>
            </FormField>

            <FormField
                label="وضعیت ملک"
                required
                error={isFormApproach ? formErrors.state?.message : formErrors?.state}
            >
                <div className="flex gap-2">
                    <Select
                        disabled={!editMode || loadingStates}
                        value={isFormApproach ? (watch?.("state") ? String(watch("state")) : "") : (formData?.state ? String(formData.state) : "")}
                        onValueChange={handleStateChange}
                    >
                        <SelectTrigger className={cn("w-full", (isFormApproach ? formErrors.state?.message : formErrors?.state) && "border-red-1")}>
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
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="shrink-0 border-blue-1 text-blue-2 hover:bg-blue"
                        onClick={() => setShowStateDialog(true)}
                        disabled={!editMode}
                    >
                        <Plus className="w-4 h-4" />
                    </Button>
                </div>
            </FormField>

            <Suspense fallback={null}>
                <PropertyTypeSide
                    isOpen={showTypeDialog}
                    onClose={() => setShowTypeDialog(false)}
                    onSuccess={() => {
                        fetchTypes();
                    }}
                />
                <PropertyStateSide
                    isOpen={showStateDialog}
                    onClose={() => setShowStateDialog(false)}
                    onSuccess={() => {
                        fetchStates();
                    }}
                />
            </Suspense>
        </div>
    );
}
