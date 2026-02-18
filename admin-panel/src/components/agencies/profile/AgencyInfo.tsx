import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Input } from "@/components/elements/Input";
import { Button } from "@/components/elements/Button";
import { FormField } from "@/components/shared/FormField";
import { Building2, Mail, MapPin, Phone, Clock, Star } from "lucide-react";
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

export function AgencyInfo({
    agency,
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
        <div className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
                <div className="lg:col-span-2 space-y-6 lg:sticky lg:top-6 h-fit transition-all duration-300">
                    <CardWithIcon
                        icon={Building2}
                        title="اطلاعات آژانس"
                        iconBgColor="bg-blue"
                        iconColor="stroke-blue-2"
                        cardBorderColor="border-b-blue-1"
                        className="border-0 shadow-md hover:shadow-xl transition-all duration-300 relative overflow-hidden bg-linear-to-br from-card via-card to-muted/30 before:absolute before:right-0 before:top-0 before:h-full before:w-1 before:bg-linear-to-b before:from-blue-1 before:via-blue-1 before:to-blue-1"
                        contentClassName="pt-4 pb-4"
                    >
                        <div className="space-y-0 [&>div:not(:last-child)]:border-b">
                            <div className="flex items-center justify-between gap-3 py-3">
                                <div className="flex items-center gap-2">
                                    <Building2 className="w-4 h-4 text-font-s shrink-0" />
                                    <label>نام آژانس:</label>
                                </div>
                                <div className="flex-1 ms-2 text-left min-w-0 overflow-hidden">
                                    <span className="text-font-p">{formData.name || agency.name || "وارد نشده"}</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between gap-3 py-3">
                                <div className="flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-font-s shrink-0" />
                                    <label>تلفن:</label>
                                </div>
                                <p className="text-font-p text-left">{formData.phone || agency.phone || "وارد نشده"}</p>
                            </div>

                            <div className="flex items-center justify-between gap-3 py-3">
                                <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-font-s shrink-0" />
                                    <label>ایمیل:</label>
                                </div>
                                <div className="flex-1 ms-2 text-left min-w-0 overflow-hidden">
                                    <span className="text-font-p break-all">{formData.email || agency.email || "وارد نشده"}</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between gap-3 py-3">
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-font-s shrink-0" />
                                    <label>شهر:</label>
                                </div>
                                <p className="text-font-p text-left">{formData.city || agency.city_name || "وارد نشده"}</p>
                            </div>

                            <div className="flex items-center justify-between gap-3 py-3">
                                <div className="flex items-center gap-2">
                                    <Star className="w-4 h-4 text-font-s shrink-0" />
                                    <label>رتبه:</label>
                                </div>
                                <p className="text-font-p text-left">{formData.rating || String(agency.rating ?? "-")}</p>
                            </div>

                            {agency.created_at && (
                                <div className="flex items-center justify-between gap-3 py-3">
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-font-s shrink-0" />
                                        <label>تاریخ ایجاد:</label>
                                    </div>
                                    <p className="text-font-p text-left">{new Date(agency.created_at).toLocaleDateString("fa-IR")}</p>
                                </div>
                            )}

                            <div className="py-4 space-y-3">
                                <div className="rounded-xl border border-green-1/40 bg-green-0/30 hover:border-green-1/60 transition-all duration-300 overflow-hidden shadow-sm hover:shadow-md">
                                    <Item variant="default" size="default" className="py-3">
                                        <ItemContent>
                                            <ItemTitle className="text-green-2 text-sm font-bold">وضعیت فعال</ItemTitle>
                                            <ItemDescription className="text-xs">حساب این آژانس را فعال یا غیرفعال کنید.</ItemDescription>
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

                                <div className="rounded-xl border border-blue-1/40 bg-blue-0/30 hover:border-blue-1/60 transition-all duration-300 overflow-hidden shadow-sm hover:shadow-md">
                                    <Item variant="default" size="default" className="py-3">
                                        <ItemContent>
                                            <ItemTitle className="text-blue-2 text-sm font-bold">تأیید شده</ItemTitle>
                                            <ItemDescription className="text-xs">وضعیت تأیید این آژانس را تعیین کنید.</ItemDescription>
                                        </ItemContent>
                                        <ItemActions>
                                            <Switch
                                                checked={formData.is_verified}
                                                onCheckedChange={(checked) => handleInputChange("is_verified", checked)}
                                                disabled={!editMode}
                                            />
                                        </ItemActions>
                                    </Item>
                                </div>
                            </div>
                        </div>
                    </CardWithIcon>
                </div>

                <div className="lg:col-span-4 space-y-6">
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
                </div>
            </div>
        </div>
    );
}

export default AgencyInfo;
