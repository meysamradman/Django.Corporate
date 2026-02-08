import { useState, useEffect, useCallback } from "react";
import type { UseFormReturn } from "react-hook-form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/elements/Select";
import { FormField } from "@/components/shared/FormField";
import { realEstateApi } from "@/api/real-estate";
import { cn } from "@/core/utils/cn";
import type { PropertyFormValues } from "@/components/real-estate/validations/propertySchema";

interface LocationSelectorsProps {
    form?: UseFormReturn<PropertyFormValues>;
    formData?: any;
    handleInputChange?: (field: string, value: any) => void;
    editMode: boolean;
    isFormApproach: boolean;
    errors?: Record<string, string>;
    districtName?: string | null;
}

export function LocationSelectors({
    form,
    formData,
    handleInputChange,
    editMode,
    isFormApproach,
    errors: manualErrors
}: LocationSelectorsProps) {
    const { watch, setValue, formState: { errors: formErrors } } = isFormApproach
        ? form!
        : { watch: null, setValue: null, formState: { errors: {} as any } };

    const errorsObj = isFormApproach ? formErrors : manualErrors || {};
    const selectedProvinceId = isFormApproach ? watch?.("province") : formData?.province;
    const selectedCityId = isFormApproach ? watch?.("city") : formData?.city;

    const [provinces, setProvinces] = useState<any[]>([]);
    const [cities, setCities] = useState<any[]>([]);
    const [cityRegions, setCityRegions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const loadProvinces = async () => {
            try {
                setLoading(true);
                const data = await realEstateApi.getProvinces();
                setProvinces(data || []);
            } catch (error) {
                console.error("Error loading provinces:", error);
            } finally {
                setLoading(false);
            }
        };
        loadProvinces();
    }, []);

    useEffect(() => {
        if (!selectedProvinceId) {
            setCities([]);
            return;
        }
        const loadCities = async () => {
            try {
                setLoading(true);
                const data = await realEstateApi.getProvinceCities(Number(selectedProvinceId));
                setCities(data || []);
            } catch (error) {
                setCities([]);
            } finally {
                setLoading(false);
            }
        };
        loadCities();
    }, [selectedProvinceId]);

    useEffect(() => {
        if (!selectedCityId) {
            setCityRegions([]);
            return;
        }
        const loadCityRegions = async () => {
            try {
                setLoading(true);
                const data = await realEstateApi.getCityRegionsByCity(Number(selectedCityId));
                setCityRegions(data || []);
            } catch (error) {
                setCityRegions([]);
            } finally {
                setLoading(false);
            }
        };
        loadCityRegions();
    }, [selectedCityId]);

    const handleProvinceChange = useCallback((value: string) => {
        const provinceId = value ? Number(value) : null;
        if (isFormApproach && setValue) {
            setValue("province", provinceId as any, { shouldValidate: true });
            setValue("city", null as any, { shouldValidate: false });
            setValue("region", null as any, { shouldValidate: false });
        } else {
            handleInputChange?.("province", provinceId);
            handleInputChange?.("city", null);
            handleInputChange?.("region", null);
        }
    }, [isFormApproach, setValue, handleInputChange]);

    const handleCityChange = useCallback((value: string) => {
        const cityId = value ? Number(value) : null;
        if (isFormApproach && setValue) {
            setValue("city", cityId as any, { shouldValidate: true });
            setValue("region", null as any, { shouldValidate: false });
        } else {
            handleInputChange?.("city", cityId);
            handleInputChange?.("region", null);
        }
    }, [isFormApproach, setValue, handleInputChange]);

    const handleRegionChange = useCallback((value: string) => {
        const regionId = value ? Number(value) : null;
        if (isFormApproach && setValue) {
            setValue("region", regionId as any, { shouldValidate: true });
        } else {
            handleInputChange?.("region", regionId);
        }
    }, [isFormApproach, setValue, handleInputChange]);

    const cityError = isFormApproach ? (errorsObj.city as any)?.message : errorsObj?.city;
    const provinceError = isFormApproach ? (errorsObj.province as any)?.message : errorsObj?.province;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FormField label="استان" required error={provinceError}>
                <Select
                    value={selectedProvinceId ? String(selectedProvinceId) : ""}
                    onValueChange={handleProvinceChange}
                    disabled={!editMode || loading}
                >
                    <SelectTrigger className={cn(provinceError && "border-red-1")}>
                        <SelectValue placeholder="استان را انتخاب کنید" />
                    </SelectTrigger>
                    <SelectContent>
                        {provinces.map((p) => (
                            <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </FormField>

            <FormField label="شهر" required error={cityError}>
                <Select
                    value={selectedCityId ? String(selectedCityId) : ""}
                    onValueChange={handleCityChange}
                    disabled={!editMode || !selectedProvinceId || loading}
                >
                    <SelectTrigger className={cn(cityError && "border-red-1")}>
                        <SelectValue placeholder="شهر را انتخاب کنید" />
                    </SelectTrigger>
                    <SelectContent>
                        {cities.map((c) => (
                            <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </FormField>

            {cityRegions.length > 0 && (
                <FormField label="منطقه (اختیاری)">
                    <Select
                        value={formData?.region ? String(formData.region) : (isFormApproach ? watch?.("region")?.toString() : "")}
                        onValueChange={handleRegionChange}
                        disabled={!editMode || !selectedCityId || loading}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="منطقه را انتخاب کنید" />
                        </SelectTrigger>
                        <SelectContent>
                            {cityRegions.map((region) => (
                                <SelectItem key={region.id} value={region.id.toString()}>
                                    {region.name} (منطقه {region.code})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </FormField>
            )}
        </div>
    );
}
