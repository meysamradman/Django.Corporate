
import { useState, useEffect, useCallback, useRef } from "react";
import type { UseFormReturn } from "react-hook-form";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Input } from "@/components/elements/Input";
import { Button } from "@/components/elements/Button";
import { MapPin, Loader2, LocateFixed, ChevronDown, ChevronUp } from "lucide-react";
import LocationMap from "@/components/real-estate/layouts/LocationMap.tsx";
import { realEstateApi } from "@/api/real-estate";
import { settingsApi } from "@/api/settings/settings";
import type { PropertyFormValues } from "@/components/real-estate/validations/propertySchema";
import {
    buildAddressFromReverseData,
    normalizeCoordinateText,
    normalizeLocationName,
    parseCombinedCoordinates,
    type ReverseGeocodeResult,
} from "./locationCoordinate.utils";
import { useLocationOptions } from "./useLocationOptions";

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

    const [manualLatLng, setManualLatLng] = useState<string>("");
    const [manualLat, setManualLat] = useState<string>(""
    );
    const [manualLng, setManualLng] = useState<string>(""
    );
    const [manualCoordError, setManualCoordError] = useState<string>("");
    const [previewCoordinates, setPreviewCoordinates] = useState<{ lat: number; lng: number } | null>(null);
    const [showAdvancedCoordinateInputs, setShowAdvancedCoordinateInputs] = useState(false);

    const selectedProvinceId = isFormApproach ? watch?.("province") : formData?.province;
    const selectedCityId = isFormApproach ? watch?.("city") : formData?.city;
    const selectedRegionId = isFormApproach ? watch?.("region") : formData?.region;

    const {
        provinces,
        setProvinces,
        setCities,
        cityRegions,
        setCityRegions,
        loading,
        selectedCity,
        selectedProvince,
    } = useLocationOptions(selectedProvinceId, selectedCityId);

    const suppressRegionToMapSyncRef = useRef(false);
    const lastProgrammaticRegionIdRef = useRef<number | null>(null);
    const resolveLocationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const canPickLocation = editMode;
    const canApplyManualCoordinates = editMode;

    useEffect(() => {
        if (!canPickLocation || !selectedRegionId || !selectedCity?.name) return;

        const regionIdNumber = Number(selectedRegionId);
        if (Number.isFinite(regionIdNumber) && lastProgrammaticRegionIdRef.current !== null) {
            if (regionIdNumber === lastProgrammaticRegionIdRef.current) {
                return;
            }
            lastProgrammaticRegionIdRef.current = null;
        }

        if (suppressRegionToMapSyncRef.current) {
            suppressRegionToMapSyncRef.current = false;
            return;
        }

        const selectedRegion = cityRegions.find((region) => Number(region?.id) === Number(selectedRegionId));
        if (!selectedRegion) return;

        const geocodeRegionCenter = async () => {
            try {
                const regionQuery = String(selectedRegion?.name || '').trim() || `منطقه ${selectedRegion?.code ?? ''}`.trim();
                const cityQuery = String(selectedCity?.name || '').trim();
                const provinceQuery = String(selectedProvince?.name || '').trim();
                const geocodeResult = await settingsApi.geocodeMap(regionQuery, cityQuery, provinceQuery);

                const lat = Number(geocodeResult?.latitude);
                const lng = Number(geocodeResult?.longitude);
                if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

                setPreviewCoordinates({ lat, lng });
                onLocationChange?.(lat, lng);
            } catch (error) {
                console.error('Region geocoding failed', error);
            }
        };

        geocodeRegionCenter();
    }, [
        canPickLocation,
        selectedRegionId,
        selectedCityId,
        selectedCity?.name,
        selectedProvince?.name,
        cityRegions,
        onLocationChange,
    ]);

    const viewLatitude = selectedCity?.latitude || selectedProvince?.latitude;
    const viewLongitude = selectedCity?.longitude || selectedProvince?.longitude;
    const mapLatitude = previewCoordinates?.lat ?? (typeof latitude === "number" ? latitude : null);
    const mapLongitude = previewCoordinates?.lng ?? (typeof longitude === "number" ? longitude : null);
    const hasExactLocation = typeof mapLatitude === "number" && typeof mapLongitude === "number";

    useEffect(() => {
        if (!previewCoordinates) return;
        if (typeof latitude !== "number" || typeof longitude !== "number") return;

        const latDelta = Math.abs(previewCoordinates.lat - latitude);
        const lngDelta = Math.abs(previewCoordinates.lng - longitude);
        if (latDelta < 0.000001 && lngDelta < 0.000001) {
            setPreviewCoordinates(null);
        }
    }, [previewCoordinates, latitude, longitude]);

    useEffect(() => {
        if (typeof latitude === "number" && Number.isFinite(latitude)) {
            setManualLat(latitude.toFixed(6));
        }
        if (typeof longitude === "number" && Number.isFinite(longitude)) {
            setManualLng(longitude.toFixed(6));
        }
        if (typeof latitude === "number" && typeof longitude === "number" && Number.isFinite(latitude) && Number.isFinite(longitude)) {
            setManualLatLng(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        }
    }, [latitude, longitude]);

    const setFieldValue = useCallback((field: "province" | "city" | "region" | "address" | "neighborhood", value: any, validate = false) => {
        if (isFormApproach && setValue) {
            setValue(field as any, value as any, { shouldValidate: validate });
            return;
        }
        handleInputChange?.(field, value);
    }, [isFormApproach, setValue, handleInputChange]);

    const resolveLocationFieldsFromCoordinates = useCallback(async (lat: number, lng: number) => {
        try {
            const data: ReverseGeocodeResult = await settingsApi.reverseGeocodeMap(lat, lng);
            const addr = data?.address || {};

            const provinceName = String(addr.state || addr.province || "").trim();
            const cityName = String(addr.city || addr.town || addr.village || addr.hamlet || addr.county || "").trim();
            const displayAddress = String(data?.display_name || "").trim();
            const { address: formattedAddress, neighborhood } = buildAddressFromReverseData(data);

            if (formattedAddress) {
                setFieldValue("address", formattedAddress, false);
            }
            if (neighborhood) {
                setFieldValue("neighborhood", neighborhood, false);
            }

            let provinceSource = provinces;
            if ((!provinceSource || provinceSource.length === 0) && provinceName) {
                try {
                    const provincesData = await realEstateApi.getProvinces();
                    provinceSource = provincesData || [];
                    setProvinces(provinceSource);
                } catch (error) {
                    provinceSource = [];
                }
            }

            let matchedProvince: any | undefined;
            if (provinceName && provinceSource.length > 0) {
                const normalizedProvince = normalizeLocationName(provinceName);
                matchedProvince = provinceSource.find((province) => {
                    const candidate = normalizeLocationName(province?.name);
                    return candidate === normalizedProvince || candidate.includes(normalizedProvince) || normalizedProvince.includes(candidate);
                });
            }

            let matchedCity: any | undefined;
            let provinceCities: any[] = [];

            if (matchedProvince?.id) {
                const provinceId = Number(matchedProvince.id);
                setFieldValue("province", provinceId, true);

                provinceCities = await realEstateApi.getProvinceCities(provinceId);

                setCities(provinceCities || []);
            }

            if (cityName && provinceCities.length > 0) {
                const normalizedCity = normalizeLocationName(cityName);
                matchedCity = provinceCities.find((city) => {
                    const candidate = normalizeLocationName(city?.name);
                    return candidate === normalizedCity || candidate.includes(normalizedCity) || normalizedCity.includes(candidate);
                });

                if (matchedCity?.id) {
                    setFieldValue("city", Number(matchedCity.id), true);
                }
            }

            let matchedRegionId: number | undefined;
            const regionText = `${displayAddress} ${String(addr.city_district || "")}`;
            const normalizedRegionText = normalizeCoordinateText(regionText);
            const regionMatch = normalizedRegionText.match(/منطقه\s*(\d+)/i) || normalizedRegionText.match(/District\s*(\d+)/i);

            if (matchedCity?.id && regionMatch) {
                const regionCode = Number(regionMatch[1]);
                if (Number.isFinite(regionCode)) {
                    const regions = await realEstateApi.getCityRegionsByCity(Number(matchedCity.id));
                    if (Array.isArray(regions) && regions.length > 0) {
                        setCityRegions(regions);
                        const matchedRegion = regions.find((region) => Number(region?.code) === regionCode);
                        if (matchedRegion?.id) {
                            matchedRegionId = Number(matchedRegion.id);
                            suppressRegionToMapSyncRef.current = true;
                            lastProgrammaticRegionIdRef.current = matchedRegionId;
                            setFieldValue("region", matchedRegionId, true);
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Coordinate reverse resolve failed", error);
        }
    }, [buildAddressFromReverseData, normalizeCoordinateText, normalizeLocationName, provinces, setFieldValue]);

    const scheduleResolveLocationFieldsFromCoordinates = useCallback((lat: number, lng: number) => {
        if (resolveLocationTimeoutRef.current) {
            clearTimeout(resolveLocationTimeoutRef.current);
        }

        resolveLocationTimeoutRef.current = setTimeout(() => {
            resolveLocationFieldsFromCoordinates(lat, lng);
        }, 350);
    }, [resolveLocationFieldsFromCoordinates]);

    useEffect(() => {
        return () => {
            if (resolveLocationTimeoutRef.current) {
                clearTimeout(resolveLocationTimeoutRef.current);
            }
        };
    }, []);

    const applyManualCoordinates = useCallback(async () => {
        if (!canApplyManualCoordinates || !onLocationChange) return;

        let lat = parseFloat(manualLat.trim());
        let lng = parseFloat(manualLng.trim());

        if (manualLatLng.trim()) {
            const combined = parseCombinedCoordinates(manualLatLng);
            if (!combined) {
                setManualCoordError("فرمت ترکیبی معتبر نیست. مثال: 35.740938, 51.301914");
                return;
            }
            lat = combined.lat;
            lng = combined.lng;
            setManualLat(lat.toFixed(6));
            setManualLng(lng.toFixed(6));
            setManualLatLng(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        }

        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
            setManualCoordError("مختصات معتبر نیست. مقدار عددی وارد کنید.");
            return;
        }

        if (lat < -90 || lat > 90) {
            setManualCoordError("Latitude باید بین -90 تا 90 باشد.");
            return;
        }

        if (lng < -180 || lng > 180) {
            setManualCoordError("Longitude باید بین -180 تا 180 باشد.");
            return;
        }

        setManualCoordError("");
        setPreviewCoordinates({ lat, lng });
        onLocationChange(lat, lng);
        await resolveLocationFieldsFromCoordinates(lat, lng);
    }, [
        canApplyManualCoordinates,
        manualLat,
        manualLng,
        manualLatLng,
        onLocationChange,
        parseCombinedCoordinates,
        resolveLocationFieldsFromCoordinates,
    ]);

    return (
        <CardWithIcon
            title="انتخاب موقعیت روی نقشه"
            icon={MapPin}
            iconBgColor="bg-blue"
            iconColor="stroke-blue-2"
            cardBorderColor="border-b-blue-1"
        >
            <div className="mb-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg border border-br bg-card px-3 py-2 flex items-center justify-between">
                    <span className="text-font-s">استان/شهر فعال</span>
                    <span className={selectedProvince && selectedCity ? "text-green-2 font-semibold" : "text-amber-1 font-semibold"}>
                        {selectedProvince && selectedCity ? `${selectedProvince.name} / ${selectedCity.name}` : "تعیین نشده"}
                    </span>
                </div>
                <div className="rounded-lg border border-br bg-card px-3 py-2 flex items-center justify-between">
                    <span className="text-font-s">موقعیت دقیق</span>
                    <span className={hasExactLocation ? "text-green-2 font-semibold" : "text-amber-1 font-semibold"}>
                        {hasExactLocation ? "ثبت شده" : "ثبت نشده"}
                    </span>
                </div>
            </div>

            <div className="mb-4 rounded-lg border border-br bg-bg/30 px-3 py-2 text-xs text-font-s">
                {canPickLocation
                    ? "برای ثبت دقیق، روی نقشه کلیک کنید یا نشانگر را جابه‌جا کنید."
                    : "برای فعال شدن انتخاب موقعیت، حالت ویرایش باید فعال باشد."}
            </div>

            <LocationMap
                latitude={mapLatitude}
                longitude={mapLongitude}
                cityName={selectedCity?.name || ""}
                provinceName={selectedProvince?.name || ""}
                viewLatitude={viewLatitude}
                viewLongitude={viewLongitude}
                onLocationChange={useCallback((lat, lng) => {
                    onLocationChange?.(lat, lng);
                    if (typeof lat === "number" && typeof lng === "number") {
                        scheduleResolveLocationFieldsFromCoordinates(lat, lng);
                    }
                }, [onLocationChange, scheduleResolveLocationFieldsFromCoordinates])}
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
                    if (!regionCode || cityRegions.length === 0) return;

                    const matchedRegion = cityRegions.find((region) => {
                        const code = Number(region?.code);
                        return Number.isFinite(code) && code === Number(regionCode);
                    });

                    if (!matchedRegion?.id) return;

                    suppressRegionToMapSyncRef.current = true;
                    lastProgrammaticRegionIdRef.current = Number(matchedRegion.id);

                    if (isFormApproach && setValue) {
                        setValue("region", Number(matchedRegion.id) as any, { shouldValidate: true });
                    } else {
                        handleInputChange?.("region", Number(matchedRegion.id));
                    }
                }, [cityRegions, isFormApproach, setValue, handleInputChange])}
                disabled={!canPickLocation}
            />

            <div className="mt-3 rounded-lg border border-br bg-card px-3 py-3 space-y-3">
                <div className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 text-font-s">
                        <LocateFixed className="w-3.5 h-3.5 text-blue-2" />
                        مختصات انتخاب‌شده
                    </div>
                    {hasExactLocation ? (
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]">
                            <span className="font-semibold text-font-p">Lat: {Number(mapLatitude).toFixed(6)}</span>
                            <span className="font-semibold text-font-p">Lng: {Number(mapLongitude).toFixed(6)}</span>
                        </div>
                    ) : (
                        <span className="text-[11px] text-font-s">ثبت نشده</span>
                    )}
                </div>

                <div className="text-[11px] text-font-s">کپی مستقیم از گوگل: `lat, lng` و سپس اعمال.</div>

                <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 items-center">
                    <Input
                        value={manualLatLng}
                        onChange={(event) => {
                            const value = event.target.value;
                            setManualLatLng(value);
                            if (manualCoordError) setManualCoordError("");

                            const parsed = parseCombinedCoordinates(value);
                            if (parsed) {
                                setManualLat(parsed.lat.toFixed(6));
                                setManualLng(parsed.lng.toFixed(6));
                            }
                        }}
                        placeholder="35.74093893688781, 51.30191441426698"
                        disabled={!canApplyManualCoordinates}
                        className="h-10"
                    />
                    <Button type="button" size="sm" className="h-10 px-4" onClick={applyManualCoordinates} disabled={!canApplyManualCoordinates}>
                        اعمال مختصات
                    </Button>
                </div>

                <button
                    type="button"
                    onClick={() => setShowAdvancedCoordinateInputs((previous) => !previous)}
                    className="w-full flex items-center justify-center gap-1 text-[11px] text-blue-2 hover:text-blue-1 transition-colors"
                >
                    {showAdvancedCoordinateInputs ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    {showAdvancedCoordinateInputs ? "بستن ورود دقیق Lat/Lng" : "ورود دقیق Lat/Lng"}
                </button>

                {showAdvancedCoordinateInputs && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <Input
                            value={manualLat}
                            onChange={(event) => {
                                setManualLat(event.target.value);
                                if (manualCoordError) setManualCoordError("");
                            }}
                            placeholder="Latitude (مثال: 35.701220)"
                            disabled={!canApplyManualCoordinates}
                            className="h-10"
                        />
                        <Input
                            value={manualLng}
                            onChange={(event) => {
                                setManualLng(event.target.value);
                                if (manualCoordError) setManualCoordError("");
                            }}
                            placeholder="Longitude (مثال: 51.432370)"
                            disabled={!canApplyManualCoordinates}
                            className="h-10"
                        />
                    </div>
                )}

                {manualCoordError && <div className="text-[11px] text-red-2">{manualCoordError}</div>}
            </div>

            {loading && (
                <div className="flex items-center justify-center p-4">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-2" />
                    <span className="mr-2">در حال بارگذاری...</span>
                </div>
            )}
        </CardWithIcon>
    );
}
