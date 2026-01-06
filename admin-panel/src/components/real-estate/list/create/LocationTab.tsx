import { useState, useEffect, useCallback } from "react";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/elements/Select";
import { FormField, FormFieldTextarea } from "@/components/forms/FormField";
import { Input } from "@/components/elements/Input";
import { MapPin, Loader2 } from "lucide-react";
import PropertyLocationMap from "@/components/real-estate/PropertyLocationMap";
import { realEstateApi } from "@/api/real-estate";
import type { RealEstateCity, RealEstateCityRegion } from "@/types/real_estate/location";

interface LocationTabProps {
    formData: any;
    handleInputChange: (field: string, value: any) => void;
    editMode: boolean;
    latitude?: number | null;
    longitude?: number | null;
    onLocationChange?: (latitude: number | null, longitude: number | null) => void;
    errors?: Record<string, string>;
}

export default function LocationTab(props: LocationTabProps) {
    const { formData, handleInputChange, editMode, latitude, longitude, onLocationChange, errors } = props;
    const [provinces, setProvinces] = useState<any[]>([]);
    const [cities, setCities] = useState<RealEstateCity[]>([]);
    const [cityRegions, setCityRegions] = useState<RealEstateCityRegion[]>([]);
    const [loading, setLoading] = useState(false);

    const selectedProvinceId = formData?.province;
    const selectedCityId = formData?.city;
    const selectedRegionId = formData?.region;

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
        handleInputChange("province", provinceId);
        handleInputChange("city", null);
        handleInputChange("region", null);
        handleInputChange("latitude", null);
        handleInputChange("longitude", null);
        setCityName('');
        setPendingCityId(null);
    }, [handleInputChange]);

    const handleCityChange = useCallback((value: string) => {
        const cityId = value ? Number(value) : null;
        handleInputChange("city", cityId);
        handleInputChange("region", null);
        handleInputChange("latitude", null);
        handleInputChange("longitude", null);

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

    }, [handleInputChange, cities]);

    const handleRegionChange = useCallback((value: string) => {
        const regionId = value && value.trim() ? Number(value) : null;
        handleInputChange("region", regionId);
    }, [handleInputChange]);

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
                                <FormField label="استان" required error={errors?.province}>
                                    <Select
                                        value={selectedProvinceId?.toString() || ""}
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

                                <FormField label="شهر" required error={errors?.city}>
                                    <Select
                                        value={selectedCityId?.toString() || ""}
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

                                <FormField label="محله">
                                    <Input
                                        placeholder="محله را وارد کنید"
                                        disabled={!editMode}
                                        value={formData?.neighborhood || ""}
                                        onChange={(e) => handleInputChange("neighborhood", e.target.value)}
                                    />
                                </FormField>

                                {cityRegions.length > 0 && (
                                    <FormField label="منطقه (اختیاری - فقط شهرهای بزرگ)">
                                        <Select
                                            value={selectedRegionId?.toString() || ""}
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
                            <FormFieldTextarea
                                label="آدرس"
                                required
                                error={errors?.address}
                                placeholder="آدرس کامل را وارد کنید"
                                disabled={!editMode}
                                rows={3}
                                value={formData?.address || ""}
                                onChange={(e) => handleInputChange("address", e.target.value)}
                            />
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
                                handleInputChange("address", address);
                            }, [handleInputChange])}
                            onNeighborhoodUpdate={useCallback((neighborhood: string) => {
                                handleInputChange("neighborhood", neighborhood);
                            }, [handleInputChange])}
                            onRegionUpdate={useCallback((regionCode: number) => {
                                const region = cityRegions.find(r => r.code === regionCode);
                                if (region) {
                                    handleInputChange("region", region.id);
                                    handleInputChange("region_name", region.name);
                                } else {
                                    handleInputChange("region", null);
                                    handleInputChange("region_name", `منطقه ${regionCode}`);
                                }
                            }, [cityRegions, handleInputChange])}
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
