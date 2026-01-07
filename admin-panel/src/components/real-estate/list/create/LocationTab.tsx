import { useState, useEffect, useCallback } from "react";
import type { UseFormReturn } from "react-hook-form";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/elements/Select";
import { FormField, FormFieldTextarea, FormFieldInput } from "@/components/forms/FormField";
import { Input } from "@/components/elements/Input";
import { MapPin, Loader2 } from "lucide-react";
import PropertyLocationMap from "@/components/real-estate/layouts/PropertyLocationMap";
import { realEstateApi } from "@/api/real-estate";
import type { RealEstateCity, RealEstateCityRegion } from "@/types/real_estate/location";
import type { PropertyFormValues } from "@/components/real-estate/validations/propertySchema";

interface LocationTabFormProps {
    form: UseFormReturn<PropertyFormValues>;
    editMode: boolean;
    latitude?: number | null;
    longitude?: number | null;
    onLocationChange?: (latitude: number | null, longitude: number | null) => void;
    regionName?: string;
    districtName?: string | null;
    onRegionNameChange?: (value: string) => void;
    onDistrictNameChange?: (value: string | null) => void;
}

interface LocationTabManualProps {
    formData: any;
    handleInputChange: (field: string, value: any) => void;
    editMode: boolean;
    latitude?: number | null;
    longitude?: number | null;
    onLocationChange?: (latitude: number | null, longitude: number | null) => void;
    errors?: Record<string, string>;
}

type LocationTabProps = LocationTabFormProps | LocationTabManualProps;

export default function LocationTab(props: LocationTabProps) {
    const isFormApproach = 'form' in props;
    const { register, formState: { errors }, watch, setValue } = isFormApproach
        ? props.form
        : { register: null, formState: { errors: {} as any }, watch: null, setValue: null };
    const formData = isFormApproach ? null : (props as any).formData;
    const handleInputChange = isFormApproach ? null : (props as any).handleInputChange;
    const editMode = isFormApproach ? (props as any).editMode : (props as any).editMode;
    const latitude = isFormApproach ? (props as LocationTabFormProps).latitude : (props as any).latitude;
    const longitude = isFormApproach ? (props as LocationTabFormProps).longitude : (props as any).longitude;
    const onLocationChange = isFormApproach ? (props as LocationTabFormProps).onLocationChange : (props as any).onLocationChange;
    const regionName = isFormApproach ? (props as LocationTabFormProps).regionName : undefined;
    const districtName = isFormApproach ? (props as LocationTabFormProps).districtName : undefined;
    const onRegionNameChange = isFormApproach ? (props as LocationTabFormProps).onRegionNameChange : undefined;
    const onDistrictNameChange = isFormApproach ? (props as LocationTabFormProps).onDistrictNameChange : undefined;
    const errorsObj = isFormApproach ? errors : (props as any).errors || {};
    const [provinces, setProvinces] = useState<any[]>([]);
    const [cities, setCities] = useState<RealEstateCity[]>([]);
    const [cityRegions, setCityRegions] = useState<RealEstateCityRegion[]>([]);
    const [loading, setLoading] = useState(false);

    const selectedProvinceId = isFormApproach ? watch?.("province") : formData?.province;
    const selectedCityId = isFormApproach ? watch?.("city") : formData?.city;
    const selectedRegionId = isFormApproach ? watch?.("district") : formData?.region;

    const [provinceName, setProvinceName] = useState<string>('');
    const [cityName, setCityName] = useState<string>('');
    const [pendingCityId, setPendingCityId] = useState<number | null>(null);

    useEffect(() => {
        const province = provinces.find(p => p.id === selectedProvinceId);
        setProvinceName(province?.name || '');
    }, [provinces, selectedProvinceId]);

    useEffect(() => {
        const cityIdToCheck = selectedCityId || pendingCityId;

        if (cityIdToCheck && cities.length > 0) {
            const city = cities.find(c => c.id === cityIdToCheck);
            if (city) {
                setCityName(city.name);
                setPendingCityId(null);
            } else {
                setCityName('');
                if (pendingCityId === cityIdToCheck) {
                    setPendingCityId(null);
                }
            }
        } else if (!selectedCityId && !pendingCityId) {
            setCityName('');
        }
    }, [cities, selectedCityId, pendingCityId]);


    useEffect(() => {
        const loadProvinces = async () => {
            try {
                setLoading(true);
                const data = await realEstateApi.getProvinces();
                setProvinces(data);

                if (selectedProvinceId) {
                    const province = data.find(p => p.id === selectedProvinceId);
                    if (province) {
                        setProvinceName(province.name);
                    }
                }
            } catch (error) {
            } finally {
                setLoading(false);
            }
        };

        loadProvinces();
    }, []);

    useEffect(() => {
        if (!selectedProvinceId) {
            setCities([]);
            setCityName('');
            return;
        }

        const loadCities = async () => {
            try {
                setLoading(true);
                const data = await realEstateApi.getProvinceCities(selectedProvinceId);
                setCities(data);
            } catch (error) {
                setCities([]);
                setCityName('');
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
                const regions = await realEstateApi.getCityRegionsByCity(selectedCityId);
                setCityRegions(regions);
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
            setValue("province", provinceId as any, { shouldValidate: false });
            setValue("city", null as any, { shouldValidate: false });
            setValue("district", null as any, { shouldValidate: false });
            setValue("latitude", null, { shouldValidate: false });
            setValue("longitude", null, { shouldValidate: false });
        } else {
            handleInputChange?.("province", provinceId);
            handleInputChange?.("city", null);
            handleInputChange?.("region", null);
            handleInputChange?.("latitude", null);
            handleInputChange?.("longitude", null);
        }
        setCityName('');
        setPendingCityId(null);
    }, [isFormApproach, setValue, handleInputChange]);

    const handleCityChange = useCallback((value: string) => {
        const cityId = value ? Number(value) : null;
        if (isFormApproach && setValue) {
            setValue("city", cityId as any, { shouldValidate: false });
            setValue("district", null as any, { shouldValidate: false });
            setValue("latitude", null, { shouldValidate: false });
            setValue("longitude", null, { shouldValidate: false });
        } else {
            handleInputChange?.("city", cityId);
            handleInputChange?.("region", null);
            handleInputChange?.("latitude", null);
            handleInputChange?.("longitude", null);
        }

        setPendingCityId(cityId);

        if (cityId && cities.length > 0) {
            const city = cities.find(c => c.id === cityId);
            if (city) {
                setCityName(city.name);
                setPendingCityId(null);
            }
        } else if (!cityId) {
            setCityName('');
            setPendingCityId(null);
        }

    }, [isFormApproach, setValue, handleInputChange, cities]);

    const handleRegionChange = useCallback((value: string) => {
        const regionId = value && value.trim() ? Number(value) : null;
        if (isFormApproach && setValue) {
            setValue("district", regionId as any, { shouldValidate: false });
        } else {
            handleInputChange?.("region", regionId);
        }
    }, [isFormApproach, setValue, handleInputChange]);

    const selectedCity = selectedCityId ? cities.find(c => c.id === selectedCityId) : null;
    const selectedProvince = selectedProvinceId ? provinces.find(p => p.id === selectedProvinceId) : null;

    let viewLatitude = undefined;
    let viewLongitude = undefined;

    if (selectedCityId) {
        viewLatitude = selectedCity?.latitude;
        viewLongitude = selectedCity?.longitude;
    } else if (selectedProvinceId) {
        viewLatitude = selectedProvince?.latitude;
        viewLongitude = selectedProvince?.longitude;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1 min-w-0">
                    <div className="space-y-6">
                        {/* Location Fields Card */}
                        <CardWithIcon
                            title="اطلاعات مکانی"
                            icon={MapPin}
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Province Selection */}
                                <FormField label="استان" required error={isFormApproach ? errorsObj.province?.message : errorsObj?.province}>
                                    <Select
                                        value={selectedProvinceId ? String(selectedProvinceId) : ""}
                                        onValueChange={handleProvinceChange}
                                        disabled={!editMode || loading}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="استان را انتخاب کنید" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {(provinces || []).map((province) => (
                                                <SelectItem key={province.id} value={province.id.toString()}>
                                                    {province.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </FormField>

                                <FormField label="شهر" required error={isFormApproach ? errorsObj.city?.message : errorsObj?.city}>
                                    <Select
                                        value={selectedCityId ? String(selectedCityId) : ""}
                                        onValueChange={handleCityChange}
                                        disabled={!editMode || !selectedProvinceId || loading}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="شهر را انتخاب کنید" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {(cities || []).map((city) => (
                                                <SelectItem key={city.id} value={city.id.toString()}>
                                                    {city.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </FormField>

                                {isFormApproach ? (
                                    <FormFieldInput
                                        label="محله"
                                        placeholder="محله را وارد کنید"
                                        disabled={!editMode}
                                        error={errorsObj.neighborhood?.message}
                                        {...(register ? register("neighborhood") : {})}
                                    />
                                ) : (
                                    <FormField label="محله">
                                        <Input
                                            placeholder="محله را وارد کنید"
                                            disabled={!editMode}
                                            value={formData?.neighborhood || ""}
                                            onChange={(e) => handleInputChange?.("neighborhood", e.target.value)}
                                        />
                                    </FormField>
                                )}

                                {cityRegions.length > 0 && (
                                    <FormField label="منطقه (اختیاری - فقط شهرهای بزرگ)">
                                        <Select
                                            value={selectedRegionId ? String(selectedRegionId) : ""}
                                            onValueChange={handleRegionChange}
                                            disabled={!editMode || !selectedCityId || loading}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="منطقه را انتخاب کنید" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {(cityRegions || []).map((region) => (
                                                    <SelectItem key={region.id} value={region.id.toString()}>
                                                        {region.name} (منطقه {region.code})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </FormField>
                                )}
                            </div>
                        </CardWithIcon>

                        <CardWithIcon
                            title="آدرس کامل"
                            icon={MapPin}
                        >
                            {isFormApproach ? (
                                <FormFieldTextarea
                                    label="آدرس"
                                    required
                                    error={errorsObj.address?.message}
                                    placeholder="آدرس کامل را وارد کنید"
                                    disabled={!editMode}
                                    rows={3}
                                    {...(register ? register("address") : {})}
                                />
                            ) : (
                                <FormFieldTextarea
                                    label="آدرس"
                                    required
                                    error={errorsObj?.address}
                                    placeholder="آدرس کامل را وارد کنید"
                                    disabled={!editMode}
                                    rows={3}
                                    value={formData?.address || ""}
                                    onChange={(e) => handleInputChange?.("address", e.target.value)}
                                />
                            )}
                        </CardWithIcon>
                    </div>
                </div>

                <div className="flex-1 min-w-0">
                    <CardWithIcon
                        title="انتخاب موقعیت روی نقشه"
                        icon={MapPin}
                    >
                        <PropertyLocationMap
                            latitude={latitude ?? null}
                            longitude={longitude ?? null}
                            cityName={cityName}
                            provinceName={provinceName}
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
                            onRegionUpdate={useCallback((regionCode: number) => {
                                const region = cityRegions.find(r => r.code === regionCode);
                                if (isFormApproach && setValue) {
                                    if (region) {
                                        setValue("district", region.id as any, { shouldValidate: false });
                                        onRegionNameChange?.(region.name);
                                    } else {
                                        setValue("district", null as any, { shouldValidate: false });
                                        onRegionNameChange?.(`منطقه ${regionCode}`);
                                    }
                                } else {
                                    if (region) {
                                        handleInputChange?.("region", region.id);
                                        handleInputChange?.("region_name", region.name);
                                    } else {
                                        handleInputChange?.("region", null);
                                        handleInputChange?.("region_name", `منطقه ${regionCode}`);
                                    }
                                }
                            }, [isFormApproach, setValue, cityRegions, handleInputChange, onRegionNameChange])}
                            disabled={!editMode || !selectedCityId}
                        />

                        {loading && (
                            <div className="flex items-center justify-center p-4">
                                <Loader2 className="w-6 h-6 animate-spin text-blue-2" />
                                <span className="mr-2">در حال بارگذاری...</span>
                            </div>
                        )}
                    </CardWithIcon>
                </div>
            </div>
        </div>
    );
}
