
import { useState, useEffect, useCallback } from "react";
import type { UseFormReturn } from "react-hook-form";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { MapPin, Loader2 } from "lucide-react";
import LocationMap from "@/components/real-estate/layouts/LocationMap.tsx";
import { realEstateApi } from "@/api/real-estate";
import type { PropertyFormValues } from "@/components/real-estate/validations/propertySchema";

interface RealEstateLocationMapPickerProps {
    form?: UseFormReturn<PropertyFormValues>;
    formData?: any;
    handleInputChange?: (field: string, value: any) => void;
    editMode: boolean;
    isFormApproach: boolean;
    latitude?: number | null;
    longitude?: number | null;
    onLocationChange?: (lat: number | null, lng: number | null) => void;
}

export function RealEstateLocationMapPicker({
    form,
    formData,
    handleInputChange,
    editMode,
    isFormApproach,
    latitude,
    longitude,
    onLocationChange
}: RealEstateLocationMapPickerProps) {
    const { watch, setValue } = isFormApproach
        ? form!
        : { watch: null, setValue: null };

    const [provinces, setProvinces] = useState<any[]>([]);
    const [cities, setCities] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const selectedProvinceId = isFormApproach ? watch?.("province") : formData?.province;
    const selectedCityId = isFormApproach ? watch?.("city") : formData?.city;

    useEffect(() => {
        const loadInitial = async () => {
            try {
                setLoading(true);
                const pData = await realEstateApi.getProvinces();
                setProvinces(pData || []);
                if (selectedProvinceId) {
                    const cData = await realEstateApi.getProvinceCities(Number(selectedProvinceId));
                    setCities(cData || []);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        loadInitial();
    }, [selectedProvinceId]);

    const selectedCity = selectedCityId ? cities.find(c => c.id === Number(selectedCityId)) : null;
    const selectedProvince = selectedProvinceId ? provinces.find(p => p.id === Number(selectedProvinceId)) : null;

    const viewLatitude = selectedCity?.latitude || selectedProvince?.latitude;
    const viewLongitude = selectedCity?.longitude || selectedProvince?.longitude;

    return (
        <CardWithIcon
            title="انتخاب موقعیت روی نقشه"
            icon={MapPin}
            iconBgColor="bg-blue"
            iconColor="stroke-blue-2"
            cardBorderColor="border-b-blue-1"
        >
            <LocationMap
                latitude={latitude ?? null}
                longitude={longitude ?? null}
                cityName={selectedCity?.name || ""}
                provinceName={selectedProvince?.name || ""}
                viewLatitude={viewLatitude}
                viewLongitude={viewLongitude}
                onLocationChange={useCallback((lat, lng) => {
                    onLocationChange?.(lat, lng);
                }, [onLocationChange])}
                onAddressUpdate={useCallback((address: string) => {
                    if (isFormApproach && setValue) {
                        setValue("address", address, { shouldValidate: false });
                    } else {
                        handleInputChange?.("address", address);
                    }
                }, [isFormApproach, setValue, handleInputChange])}
                onNeighborhoodUpdate={useCallback((neighborhood: string) => {
                    if (isFormApproach && setValue) {
                        setValue("neighborhood", neighborhood, { shouldValidate: false });
                    } else {
                        handleInputChange?.("neighborhood", neighborhood);
                    }
                }, [isFormApproach, setValue, handleInputChange])}
                disabled={!editMode || !selectedCityId}
            />

            {loading && (
                <div className="flex items-center justify-center p-4">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-2" />
                    <span className="mr-2">در حال بارگذاری...</span>
                </div>
            )}
        </CardWithIcon>
    );
}
