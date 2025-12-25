import { useState, useEffect, useMemo, useCallback, type ChangeEvent } from "react";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { TabsContent } from "@/components/elements/Tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/elements/Select";
import { Label } from "@/components/elements/Label";
import { FormField, FormFieldTextarea } from "@/components/forms/FormField";
import { Input } from "@/components/elements/Input";
import { MapPin, Loader2 } from "lucide-react";
import PropertyLocationMap from "@/components/real-estate/PropertyLocationMap";
import { realEstateApi } from "@/api/real-estate";
import type { RealEstateProvince, RealEstateCity, RealEstateCityRegion } from "@/types/real_estate/location";

interface LocationTabProps {
    formData: any;
    handleInputChange: (field: string, value: any) => void;
    editMode: boolean;
    latitude?: number | null;
    longitude?: number | null;
    onLocationChange?: (latitude: number | null, longitude: number | null) => void;
    regionName?: string | null;
}

export default function LocationTab(props: LocationTabProps) {
    const { formData, handleInputChange, editMode, latitude, longitude, onLocationChange, regionName } = props;

    const [provinces, setProvinces] = useState<any[]>([]);
    const [cities, setCities] = useState<RealEstateCity[]>([]);
    const [cityRegions, setCityRegions] = useState<RealEstateCityRegion[]>([]);
    const [loading, setLoading] = useState(false);

    // Selected values
    const selectedProvinceId = formData?.province;
    const selectedCityId = formData?.city;
    const selectedRegionId = formData?.region;

    // Derived values for map
    const provinceName = useMemo(() => {
        const province = provinces.find(p => p.id === selectedProvinceId);
        return province?.name || null;
    }, [provinces, selectedProvinceId]);

    const cityName = useMemo(() => {
        const city = cities.find(c => c.id === selectedCityId);
        return city?.name || null;
    }, [cities, selectedCityId]);

    // Load provinces on mount
    useEffect(() => {
        const loadProvinces = async () => {
            try {
                setLoading(true);
                const data = await realEstateApi.getProvinces();
                setProvinces(data);
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
            return;
        }

        const loadCities = async () => {
            try {
                setLoading(true);
                const data = await realEstateApi.getProvinceCities(selectedProvinceId);
                setCities(data);
            } catch (error) {
                console.error('Error loading cities:', error);
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
                // TODO: Add getCityRegions method to realEstateApi
                const response = await fetch(`/api/admin/real-estate-cities/${selectedCityId}/regions/?is_active=true&limit=1000`);
                if (response.ok) {
                    const data = await response.json();
                    const regions = data.results || data;
                    // Ensure it's always an array
                    setCityRegions(Array.isArray(regions) ? regions : []);
                } else {
                    console.error('Failed to load city regions');
                    setCityRegions([]);
                }
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
    }, [handleInputChange]);

    const handleCityChange = useCallback((value: string) => {
        const cityId = value ? Number(value) : null;
        handleInputChange("city", cityId);
        // Reset dependent field
        handleInputChange("region", null);
    }, [handleInputChange]);

    const handleRegionChange = useCallback((value: string) => {
        const regionId = value ? Number(value) : null;
        handleInputChange("region", regionId);
    }, [handleInputChange]);

    return (
        <TabsContent value="location" className="mt-0 space-y-6">
            <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1 min-w-0">
                    <div className="space-y-6">
                        {/* Province Selection */}
                        <CardWithIcon
                            title="استان"
                            icon={MapPin}
                        >
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
                        </CardWithIcon>

                        {/* City Selection */}
                        <CardWithIcon
                            title="شهر"
                            icon={MapPin}
                        >
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
                        </CardWithIcon>

                        {/* Region Selection */}
                        <CardWithIcon
                            title="منطقه"
                            icon={MapPin}
                        >
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
                                                {region.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </FormField>
                        </CardWithIcon>

                        {/* Neighborhood */}
                        <CardWithIcon
                            title="محله"
                            icon={MapPin}
                        >
                            <FormField label="محله">
                                <Input
                                    placeholder="محله را وارد کنید"
                                    disabled={!editMode}
                                    value={formData?.neighborhood || ""}
                                    onChange={(e) => handleInputChange("neighborhood", e.target.value)}
                                />
                            </FormField>
                        </CardWithIcon>

                        {/* Address */}
                        <CardWithIcon
                            title="آدرس کامل"
                            icon={MapPin}
                        >
                            <FormField label="آدرس">
                                <FormFieldTextarea
                                    placeholder="آدرس کامل را وارد کنید"
                                    disabled={!editMode}
                                    rows={3}
                                    value={formData?.address || ""}
                                    onChange={(e) => handleInputChange("address", e.target.value)}
                                />
                            </FormField>
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
                            cityId={selectedCityId || null}
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
                            onRegionUpdate={useCallback((regionId: number) => {
                                // Find the region object and set it
                                const region = cityRegions.find(r => r.code === regionId);
                                if (region) {
                                    handleInputChange("region", region.id);
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
        </TabsContent>
    );
}
