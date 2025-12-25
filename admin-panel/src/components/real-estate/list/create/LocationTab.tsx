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
}

export default function LocationTab(props: LocationTabProps) {
    const { formData, handleInputChange, editMode, latitude, longitude, onLocationChange } = props;

    // Debug Logging
    useEffect(() => {
        console.log('LocationTab Props Update:', {
            lat: latitude,
            lng: longitude,
            city: formData?.city,
            province: formData?.province,
            address: formData?.address
        });
    }, [latitude, longitude, formData?.city, formData?.province, formData?.address]);

    const [provinces, setProvinces] = useState<any[]>([]);
    const [cities, setCities] = useState<RealEstateCity[]>([]);
    const [cityRegions, setCityRegions] = useState<RealEstateCityRegion[]>([]);
    const [loading, setLoading] = useState(false);

    // Selected values
    const selectedProvinceId = formData?.province;
    const selectedCityId = formData?.city;
    const selectedRegionId = formData?.region;

    // Derived values for map - with proper state management
    const [provinceName, setProvinceName] = useState<string>('');
    const [cityName, setCityName] = useState<string>('');
    const [pendingCityId, setPendingCityId] = useState<number | null>(null);

    // Update province name when provinces or selected province changes
    useEffect(() => {
        const province = provinces.find(p => p.id === selectedProvinceId);
        setProvinceName(province?.name || '');
    }, [provinces, selectedProvinceId]);

    // Update city name when cities are loaded and city is selected or pending
    useEffect(() => {
        const cityIdToCheck = selectedCityId || pendingCityId;

        if (cityIdToCheck && cities.length > 0) {
            const city = cities.find(c => c.id === cityIdToCheck);
            if (city) {
                setCityName(city.name);
                setPendingCityId(null);
            } else {
                // City not found in current cities, maybe province changed
                setCityName('');
                if (pendingCityId === cityIdToCheck) {
                    setPendingCityId(null);
                }
            }
        } else if (!selectedCityId && !pendingCityId) {
            setCityName('');
        }
    }, [cities, selectedCityId, pendingCityId]);


    // Load provinces on mount
    useEffect(() => {
        const loadProvinces = async () => {
            try {
                setLoading(true);
                const data = await realEstateApi.getProvinces();
                setProvinces(data);

                // Set province name if province is already selected
                if (selectedProvinceId) {
                    const province = data.find(p => p.id === selectedProvinceId);
                    if (province) {
                        setProvinceName(province.name);
                    }
                }
            } catch (error) {
                console.error('Error loading provinces:', error);
            } finally {
                setLoading(false);
            }
        };

        loadProvinces();
    }, []);

    // Load cities when province changes
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
                console.error('Error loading cities:', error);
                setCities([]);
                setCityName('');
            } finally {
                setLoading(false);
            }
        };

        loadCities();
    }, [selectedProvinceId]);

    // Load city regions when city changes
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
                console.error('Error loading city regions:', error);
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
        // Reset dependent fields
        handleInputChange("city", null);
        handleInputChange("region", null);
        handleInputChange("latitude", null);
        handleInputChange("longitude", null);
        // Reset names and pending state
        setCityName('');
        setPendingCityId(null);
        // Province name will be updated by useEffect
    }, [handleInputChange]);

    const handleCityChange = useCallback((value: string) => {
        const cityId = value ? Number(value) : null;
        handleInputChange("city", cityId);
        // Reset dependent field
        handleInputChange("region", null);
        handleInputChange("latitude", null);
        handleInputChange("longitude", null);

        setPendingCityId(cityId);

        // Set city name immediately if available
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
        // If cities not loaded yet, pendingCityId will be used when cities are loaded
    }, [handleInputChange, cities]);

    const handleRegionChange = useCallback((value: string) => {
        const regionId = value && value.trim() ? Number(value) : null;
        handleInputChange("region", regionId);
    }, [handleInputChange]);

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
                                <FormField label="استان">
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

                                {/* City Selection */}
                                <FormField label="شهر">
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

                                {/* Region Selection - Only for major cities */}
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

                                {/* Neighborhood */}
                                <FormField label="محله">
                                    <Input
                                        placeholder="محله را وارد کنید"
                                        disabled={!editMode}
                                        value={formData?.neighborhood || ""}
                                        onChange={(e) => handleInputChange("neighborhood", e.target.value)}
                                    />
                                </FormField>
                            </div>
                        </CardWithIcon>

                        {/* Address */}
                        <CardWithIcon
                            title="آدرس کامل"
                            icon={MapPin}
                        >
                            <FormFieldTextarea
                                label="آدرس"
                                placeholder="آدرس کامل را وارد کنید"
                                disabled={!editMode}
                                rows={3}
                                value={formData?.address || ""}
                                onChange={(e) => handleInputChange("address", e.target.value)}
                            />
                        </CardWithIcon>
                    </div>
                </div>

                {/* Map Section */}
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
                                // Find the region by Code (since map returns region number)
                                const region = cityRegions.find(r => r.code === regionCode);
                                if (region) {
                                    handleInputChange("region", region.id);
                                    handleInputChange("region_name", region.name);
                                    console.log(`✅ Auto-selected region: ${region.name} (ID: ${region.id})`);
                                } else {
                                    // Fallback: Set region name text if ID not found in DB
                                    // This allows saving "Region X" even if it's not in the dropdown
                                    handleInputChange("region", null);
                                    handleInputChange("region_name", `منطقه ${regionCode}`);
                                    console.log(`⚠️ Region ID not found, set text: منطقه ${regionCode}`);
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
