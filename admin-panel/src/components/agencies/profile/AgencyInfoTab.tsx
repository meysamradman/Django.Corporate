import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Input } from "@/components/elements/Input";
import { Button } from "@/components/elements/Button";
import { FormField } from "@/components/forms/FormField";
import { Building2, Mail, MapPin } from "lucide-react";
import type { RealEstateAgency } from "@/types/real_estate/agency/realEstateAgency";
import type { AgencyFormData } from "@/types/real_estate/agency/realEstateAgency";
import type { ProvinceCompact, CityCompact } from "@/types/shared/location";
import { locationApi } from "@/api/shared/location/location";
import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/elements/Select";
import { Switch } from "@/components/elements/Switch";
import { Item, ItemContent, ItemTitle, ItemDescription, ItemActions } from "@/components/elements/Item";

interface AgencyInfoTabProps {
    agency: RealEstateAgency;
    formData: AgencyFormData;
    editMode: boolean;
    setEditMode: (value: boolean) => void;
    handleInputChange: (field: string, value: string | boolean) => void;
    handleSaveProfile: () => void;
    isSaving?: boolean;
    fieldErrors?: Record<string, string>;
    onProvinceChange?: (provinceName: string, provinceId: number) => void;
    onCityChange?: (cityName: string, cityId: number) => void;
    agencyId?: string;
}

export function AgencyInfoTab({
    formData,
    editMode,
    setEditMode,
    handleInputChange,
    handleSaveProfile,
    isSaving = false,
    fieldErrors = {},
    onProvinceChange,
    onCityChange,
}: AgencyInfoTabProps) {
    const [provinces, setProvinces] = useState<ProvinceCompact[]>([]);
    const [cities, setCities] = useState<CityCompact[]>([]);
    const [loadingProvinces, setLoadingProvinces] = useState(false);
    const [loadingCities, setLoadingCities] = useState(false);

    useEffect(() => {
        const fetchProvinces = async () => {
            setLoadingProvinces(true);
            try {
                const provinces = await locationApi.getProvincesCompact();
                setProvinces(provinces);
            } catch {
            } finally {
                setLoadingProvinces(false);
            }
        };

        fetchProvinces();
    }, []);

    useEffect(() => {
        if (formData.province && provinces.length > 0) {
            const fetchCities = async () => {
                setLoadingCities(true);
                try {
                    const selectedProvince = provinces.find(p => p.name === formData.province);
                    if (selectedProvince) {
                        const cities = await locationApi.getCitiesCompactByProvince(selectedProvince.id);
                        setCities(cities);
                    }
                } catch {
                } finally {
                    setLoadingCities(false);
                }
            };

            fetchCities();
        } else {
            setCities([]);
        }
    }, [formData.province, provinces]);

    const handleProvinceChange = (provinceName: string) => {
        const selectedProvince = provinces.find(p => p.name === provinceName);
        if (selectedProvince && onProvinceChange) {
            onProvinceChange(provinceName, selectedProvince.id);
        } else {
            handleInputChange("province", provinceName);
            handleInputChange("city", "");
        }
    };

    const handleCityChange = (cityName: string) => {
        const selectedCity = cities.find(c => c.name === cityName);
        if (selectedCity && onCityChange) {
            onCityChange(cityName, selectedCity.id);
        } else {
            handleInputChange("city", cityName);
        }
    };

    return (
        <div className="space-y-6 mt-6">
            <CardWithIcon
                icon={Building2}
                title="اطلاعات اصلی آژانس"
                titleExtra={
                    editMode ? (
                        <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => { setEditMode(false); handleInputChange("cancel", ""); }} disabled={isSaving}>
                                لغو
                            </Button>
                            <Button size="sm" onClick={handleSaveProfile} disabled={isSaving}>
                                {isSaving ? "در حال ذخیره..." : "ذخیره"}
                            </Button>
                        </div>
                    ) : (
                        <Button size="sm" variant="outline" onClick={() => setEditMode(true)}>
                            ویرایش
                        </Button>
                    )
                }
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField label="نام آژانس" error={fieldErrors.name} required>
                        <Input
                            value={formData.name}
                            onChange={(e) => handleInputChange("name", e.target.value)}
                            placeholder="نام آژانس را وارد کنید"
                            disabled={!editMode}
                        />
                    </FormField>

                    <FormField label="شماره پروانه" error={fieldErrors.license_number} required>
                        <Input
                            value={formData.license_number}
                            onChange={(e) => handleInputChange("license_number", e.target.value)}
                            placeholder="شماره پروانه"
                            disabled={!editMode}
                        />
                    </FormField>

                    <FormField label="تاریخ انقضای پروانه">
                        <Input
                            type="date"
                            value={formData.license_expire_date}
                            onChange={(e) => handleInputChange("license_expire_date", e.target.value)}
                            disabled={!editMode}
                        />
                    </FormField>

                    <FormField label="رتبه">
                        <Input
                            type="number"
                            step="0.1"
                            min="0"
                            max="5"
                            value={formData.rating}
                            onChange={(e) => handleInputChange("rating", e.target.value)}
                            placeholder="رتبه (0-5)"
                            disabled={!editMode}
                        />
                    </FormField>
                </div>
            </CardWithIcon>

            <CardWithIcon icon={Mail} title="اطلاعات تماس">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField label="ایمیل" error={fieldErrors.email} required>
                        <Input
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleInputChange("email", e.target.value)}
                            placeholder="example@domain.com"
                            disabled={!editMode}
                        />
                    </FormField>

                    <FormField label="تلفن" error={fieldErrors.phone} required>
                        <Input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => handleInputChange("phone", e.target.value)}
                            placeholder="021-12345678"
                            disabled={!editMode}
                        />
                    </FormField>

                    <FormField label="وبسایت" className="md:col-span-2">
                        <Input
                            type="url"
                            value={formData.website}
                            onChange={(e) => handleInputChange("website", e.target.value)}
                            placeholder="https://example.com"
                            disabled={!editMode}
                        />
                    </FormField>
                </div>
            </CardWithIcon>

            <CardWithIcon icon={MapPin} title="موقعیت مکانی">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField label="استان">
                        <Select value={formData.province} onValueChange={handleProvinceChange} disabled={!editMode || loadingProvinces}>
                            <SelectTrigger>
                                <SelectValue placeholder={loadingProvinces ? "در حال بارگذاری..." : "انتخاب استان"} />
                            </SelectTrigger>
                            <SelectContent>
                                {provinces.map((province) => (
                                    <SelectItem key={province.id} value={province.name}>
                                        {province.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </FormField>

                    <FormField label="شهر">
                        <Select value={formData.city} onValueChange={handleCityChange} disabled={!editMode || !formData.province || loadingCities}>
                            <SelectTrigger>
                                <SelectValue placeholder={loadingCities ? "در حال بارگذاری..." : "انتخاب شهر"} />
                            </SelectTrigger>
                            <SelectContent>
                                {cities.map((city) => (
                                    <SelectItem key={city.id} value={city.name}>
                                        {city.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </FormField>

                    <FormField label="آدرس" className="md:col-span-2">
                        <Input
                            value={formData.address}
                            onChange={(e) => handleInputChange("address", e.target.value)}
                            placeholder="آدرس کامل آژانس"
                            disabled={!editMode}
                        />
                    </FormField>
                </div>
            </CardWithIcon>

            <CardWithIcon icon={Building2} title="وضعیت">
                <div className="space-y-4">
                    <Item>
                        <ItemContent>
                            <ItemTitle>تأیید شده</ItemTitle>
                            <ItemDescription>آیا این آژانس تأیید شده است؟</ItemDescription>
                        </ItemContent>
                        <ItemActions>
                            <Switch
                                checked={formData.is_verified}
                                onCheckedChange={(checked) => handleInputChange("is_verified", checked)}
                                disabled={!editMode}
                            />
                        </ItemActions>
                    </Item>

                    <Item>
                        <ItemContent>
                            <ItemTitle>فعال</ItemTitle>
                            <ItemDescription>وضعیت فعال بودن آژانس</ItemDescription>
                        </ItemContent>
                        <ItemActions>
                            <Switch
                                checked={formData.is_active}
                                onCheckedChange={(checked) => handleInputChange("is_active", checked)}
                                disabled={!editMode}
                            />
                        </ItemActions>
                    </Item>
                </div>
            </CardWithIcon>
        </div>
    );
}

export default AgencyInfoTab;
