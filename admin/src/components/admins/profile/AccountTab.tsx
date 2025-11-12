"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/elements/Card";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Input } from "@/components/elements/Input";
import { Button } from "@/components/elements/Button";
import { Label } from "@/components/elements/Label";
import { Textarea } from "@/components/elements/Textarea";
import { TabsContent } from "@/components/elements/Tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/elements/Select";
import { FormField } from "@/components/forms/FormField";
import {
    User, Mail, Phone, MapPin, Fingerprint, Globe, Map, CheckCircle2, XCircle, Edit2, Smartphone, Calendar
} from "lucide-react";
import { AdminWithProfile } from "@/types/auth/admin";
import { ProvinceCompact, CityCompact } from "@/types/shared/location";
import { locationApi } from "@/api/location/route";
import { useState, useEffect } from "react";
import { PersianDatePicker } from "@/components/elements/PersianDatePicker";
import { formatDate } from "@/core/utils/format";

// Function to prevent non-numeric input
const preventNonNumeric = (e: React.KeyboardEvent<HTMLInputElement>) => {
  // Allow: backspace, delete, tab, escape, enter
  if ([46, 8, 9, 27, 13].includes(e.keyCode) ||
    // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
    (e.keyCode === 65 && e.ctrlKey === true) ||
    (e.keyCode === 67 && e.ctrlKey === true) ||
    (e.keyCode === 86 && e.ctrlKey === true) ||
    (e.keyCode === 88 && e.ctrlKey === true) ||
    // Allow: home, end, left, right
    (e.keyCode >= 35 && e.keyCode <= 39)) {
    return; // let it happen, don't do anything
  }
  // Ensure that it is a number and stop the keypress
  if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
    e.preventDefault();
  }
};

// Function to prevent non-numeric paste
const preventNonNumericPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
  const paste = e.clipboardData.getData('text');
  if (!/^\d*$/.test(paste)) {
    e.preventDefault();
  }
};

interface FormData {
    firstName: string;
    lastName: string;
    email: string;
    mobile: string;
    phone: string;
    nationalId: string;
    address: string;
    province: string;
    city: string;
    bio: string;
    birthDate: string; // Add birthDate field
}

interface AccountTabProps {
    admin: AdminWithProfile;
    formData: FormData;
    editMode: boolean;
    setEditMode: (value: boolean) => void;
    handleInputChange: (field: string, value: string) => void;
    handleSaveProfile: () => void;
    isSaving?: boolean;
    fieldErrors?: Record<string, string>;
    onProvinceChange?: (provinceName: string, provinceId: number) => void;
    onCityChange?: (cityName: string, cityId: number) => void;
}

export function AccountTab({
    admin,
    formData,
    editMode,
    setEditMode,
    handleInputChange,
    handleSaveProfile,
    isSaving = false,
    fieldErrors = {},
    onProvinceChange,
    onCityChange,
}: AccountTabProps) {
    const [provinces, setProvinces] = useState<ProvinceCompact[]>([]);
    const [cities, setCities] = useState<CityCompact[]>([]);
    const [loadingProvinces, setLoadingProvinces] = useState(false);
    const [loadingCities, setLoadingCities] = useState(false);

    // Fetch provinces on component mount
    useEffect(() => {
        const fetchProvinces = async () => {
            setLoadingProvinces(true);
            try {
                const provinces = await locationApi.getProvincesCompact();
                setProvinces(provinces);
            } catch (error) {
                console.error("Error fetching provinces:", error);
            } finally {
                setLoadingProvinces(false);
            }
        };

        fetchProvinces();
    }, []);

    // Fetch cities when province changes
    useEffect(() => {
        if (formData.province && provinces.length > 0) {
            const fetchCities = async () => {
                setLoadingCities(true);
                try {
                // Find province ID by name
                const selectedProvince = provinces.find(p => p.name === formData.province);
                if (selectedProvince) {
                    const cities = await locationApi.getCitiesCompactByProvince(selectedProvince.id);
                    setCities(cities);
                }
                } catch (error) {
                    console.error("Error fetching cities:", error);
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
        // پیدا کردن ID از روی نام
        const selectedProvince = provinces.find(p => p.name === provinceName);
        if (selectedProvince && onProvinceChange) {
            onProvinceChange(provinceName, selectedProvince.id);
        } else {
            // Fallback به روش قدیمی
            handleInputChange("province", provinceName);
            handleInputChange("city", "");
        }
    };

    const handleCityChange = (cityName: string) => {
        // پیدا کردن ID از روی نام
        const selectedCity = cities.find(c => c.name === cityName);
        if (selectedCity && onCityChange) {
            onCityChange(cityName, selectedCity.id);
        } else {
            // Fallback به روش قدیمی
            handleInputChange("city", cityName);
        }
    };

    // Handle birth date change
    const handleBirthDateChange = (dateString: string) => {
        handleInputChange("birthDate", dateString);
    };
    
    return (
        <TabsContent value="account">
            <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
                {/* Left Column: Details */}
                <div className="lg:col-span-2 space-y-6">
                    <CardWithIcon
                        icon={User}
                        title="اطلاعات ادمین"
                        iconBgColor="bg-blue"
                        iconColor="stroke-blue-2"
                        borderColor="border-b-blue-1"
                        className="border-0 shadow-md hover:shadow-xl transition-all duration-300 relative overflow-hidden bg-gradient-to-br from-card via-card to-muted/30 before:absolute before:right-0 before:top-0 before:h-full before:w-1 before:bg-gradient-to-b before:from-blue-1 before:via-blue-1 before:to-blue-1"
                        contentClassName="pt-4 pb-4"
                    >
                            <div className="space-y-5">
                                <div>
                                    <div className="space-y-0 [&>div:not(:last-child)]:border-b">
                                        <div className="flex items-center justify-between gap-3 pb-3">
                                            <div className="flex items-center gap-2">
                                                <User className="w-4 h-4 text-font-s flex-shrink-0" />
                                                <label>نام کامل:</label>
                                            </div>
                                            <div className="flex-1 ms-2 text-left min-w-0 overflow-hidden">
                                                <span className="text-font-p">
                                                    {formData.firstName && formData.lastName
                                                        ? `${formData.firstName} ${formData.lastName}`
                                                        : admin.full_name || "نام وارد نشده"
                                                    }
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between gap-3 py-3">
                                            <div className="flex items-center gap-2">
                                                {admin.is_active ? (
                                                    <CheckCircle2 className="w-4 h-4 text-green-1 flex-shrink-0" />
                                                ) : (
                                                    <XCircle className="w-4 h-4 text-red-1 flex-shrink-0" />
                                                )}
                                                <label>وضعیت:</label>
                                            </div>
                                            <p className="text-font-p text-left">
                                                {admin.is_active ? "فعال" : "غیرفعال"}
                                            </p>
                                        </div>
                                        <div className="flex items-center justify-between gap-3 py-3">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-font-s flex-shrink-0" />
                                                <label>تاریخ تولد:</label>
                                            </div>
                                            <p className="text-font-p text-left">
                                                {formData.birthDate ? formatDate(formData.birthDate) : "وارد نشده"}
                                            </p>
                                        </div>
                                        <div className="flex items-center justify-between gap-3 py-3">
                                            <div className="flex items-center gap-2">
                                                <Globe className="w-4 h-4 text-font-s flex-shrink-0" />
                                                <label>کشور:</label>
                                            </div>
                                            <p className="text-font-p text-left">ایران</p>
                                        </div>
                                        <div className="flex items-center justify-between gap-3 py-3">
                                            <div className="flex items-center gap-2">
                                                <Map className="w-4 h-4 text-font-s flex-shrink-0" />
                                                <label>استان:</label>
                                            </div>
                                            <p className="text-font-p text-left">{formData.province || "وارد نشده"}</p>
                                        </div>
                                        <div className="flex items-center justify-between gap-3 py-3">
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-4 h-4 text-font-s flex-shrink-0" />
                                                <label>شهر:</label>
                                            </div>
                                            <p className="text-font-p text-left">{formData.city || "وارد نشده"}</p>
                                        </div>
                                        <div className="flex items-center justify-between gap-3 pt-3">
                                            <div className="flex items-center gap-2">
                                                <Fingerprint className="w-4 h-4 text-font-s flex-shrink-0" />
                                                <label>کد ملی:</label>
                                            </div>
                                            <p className="text-font-p text-left">{formData.nationalId || "وارد نشده"}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="relative my-6">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-br/50"></div>
                                    </div>
                                    <div className="relative flex justify-center">
                                        <div className="bg-card px-3 py-1 rounded-full border border-br/50 shadow-sm">
                                            <div className="h-1 w-12 bg-gradient-to-r from-transparent via-primary/30 to-transparent rounded-full"></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-2">
                                    <div className="space-y-0 [&>div:not(:last-child)]:border-b">
                                        <div className="flex items-center justify-between gap-3 pb-3">
                                            <div className="flex items-center gap-2">
                                                <Mail className="w-4 h-4 text-font-s flex-shrink-0" />
                                                <label>ایمیل:</label>
                                            </div>
                                            <div className="flex-1 ms-2 text-left min-w-0 overflow-hidden">
                                                <span className="text-font-p break-all">{formData.email || admin.email || "وارد نشده"}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between gap-3 py-3">
                                            <div className="flex items-center gap-2">
                                                <Smartphone className="w-4 h-4 text-font-s flex-shrink-0" />
                                                <label>موبایل:</label>
                                            </div>
                                            <p className="text-font-p text-left">{formData.mobile || admin.mobile || "وارد نشده"}</p>
                                        </div>
                                        <div className="flex items-center justify-between gap-3 py-3">
                                            <div className="flex items-center gap-2">
                                                <Phone className="w-4 h-4 text-font-s flex-shrink-0" />
                                                <label>تلفن:</label>
                                            </div>
                                            <p className="text-font-p text-left">{formData.phone || "وارد نشده"}</p>
                                        </div>
                                        <div className="flex items-center justify-between gap-3 pt-3">
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-4 h-4 text-font-s flex-shrink-0" />
                                                <label>آدرس:</label>
                                            </div>
                                            <div className="flex-1 ms-2 text-left min-w-0 overflow-hidden">
                                                <span className="text-font-p">{formData.address || "وارد نشده"}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                    </CardWithIcon>
                </div>

                {/* Right Column: Edit Form */}
                <div className="lg:col-span-4 space-y-6">
                    <CardWithIcon
                        icon={Edit2}
                        title="اطلاعات کاربری"
                        iconBgColor="bg-primary/10"
                        iconColor="stroke-primary"
                        borderColor="border-b-primary"
                        className="hover:shadow-lg transition-all duration-300"
                        titleExtra={
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => setEditMode(!editMode)}>
                                    <Edit2 className="w-4 h-4 me-2" />
                                    {editMode ? "لغو" : "ویرایش"}
                                </Button>
                                {editMode && (
                                    <Button size="sm" onClick={handleSaveProfile} disabled={isSaving}>
                                        {isSaving ? "در حال ذخیره..." : "ذخیره"}
                                    </Button>
                                )}
                            </div>
                        }
                        contentClassName="space-y-6"
                    >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        label="نام"
                                        error={fieldErrors.firstName}
                                        required
                                    >
                                        <Input
                                            id="firstName"
                                            value={formData.firstName || ""}
                                            onChange={(e) => handleInputChange("firstName", e.target.value)}
                                            disabled={!editMode}
                                            placeholder="نام خود را وارد کنید"
                                        />
                                    </FormField>
                                    <FormField
                                        label="نام خانوادگی"
                                        error={fieldErrors.lastName}
                                        required
                                    >
                                        <Input
                                            id="lastName"
                                            value={formData.lastName || ""}
                                            onChange={(e) => handleInputChange("lastName", e.target.value)}
                                            disabled={!editMode}
                                            placeholder="نام خانوادگی خود را وارد کنید"
                                        />
                                    </FormField>
                                </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <FormField
                                    label="تاریخ تولد"
                                    htmlFor="birthDate"
                                >
                                    <PersianDatePicker
                                        value={formData.birthDate || ""}
                                        onChange={handleBirthDateChange}
                                        placeholder="تاریخ تولد را انتخاب کنید"
                                        disabled={!editMode}
                                    />
                                </FormField>
                                <FormField
                                    label="کد ملی"
                                    error={fieldErrors.nationalId}
                                >
                                    <Input
                                        id="nationalId"
                                        value={formData.nationalId || ""}
                                        onChange={(e) => handleInputChange("nationalId", e.target.value)}
                                        disabled={!editMode}
                                        placeholder="کد ملی خود را وارد کنید"
                                        inputMode="numeric"
                                        onKeyDown={preventNonNumeric}
                                        onPaste={preventNonNumericPaste}
                                    />
                                </FormField>
                                <FormField
                                    label="تلفن"
                                    htmlFor="phone"
                                >
                                    <Input
                                        id="phone"
                                        type="tel"
                                        value={formData.phone || ""}
                                        onChange={(e) => handleInputChange("phone", e.target.value)}
                                        disabled={!editMode}
                                        placeholder="تلفن ثابت را وارد کنید"
                                        inputMode="tel"
                                        onKeyDown={preventNonNumeric}
                                        onPaste={preventNonNumericPaste}
                                    />
                                </FormField>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    label="موبایل"
                                    error={fieldErrors.mobile}
                                    required
                                >
                                    <Input
                                        id="mobile"
                                        type="tel"
                                        value={formData.mobile || ""}
                                        onChange={(e) => handleInputChange("mobile", e.target.value)}
                                        disabled={!editMode}
                                        placeholder="شماره موبایل خود را وارد کنید"
                                        inputMode="tel"
                                        onKeyDown={preventNonNumeric}
                                        onPaste={preventNonNumericPaste}
                                    />
                                </FormField>
                                <FormField
                                    label="ایمیل"
                                    error={fieldErrors.email}
                                >
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email || ""}
                                        onChange={(e) => handleInputChange("email", e.target.value)}
                                        disabled={!editMode}
                                        placeholder="آدرس ایمیل خود را وارد کنید"
                                    />
                                </FormField>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                <FormField
                                    label="استان"
                                    htmlFor="province"
                                >
                                    <Select
                                        value={formData.province || ""}
                                        onValueChange={handleProvinceChange}
                                        disabled={!editMode || loadingProvinces}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder={loadingProvinces ? "در حال بارگذاری..." : "استان خود را انتخاب کنید"} />
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
                                <FormField
                                    label="شهر"
                                    htmlFor="city"
                                >
                                    <Select
                                        value={formData.city || ""}
                                        onValueChange={handleCityChange}
                                        disabled={!editMode || loadingCities}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder={
                                                !formData.province 
                                                    ? "ابتدا استان را انتخاب کنید" 
                                                    : loadingCities 
                                                        ? "در حال بارگذاری..." 
                                                        : cities.length === 0
                                                            ? "شهری برای این استان یافت نشد"
                                                            : "شهر خود را انتخاب کنید"
                                            } />
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
                                <FormField
                                    label="آدرس"
                                    htmlFor="address"
                                >
                                    <Input
                                        id="address"
                                        value={formData.address || ""}
                                        onChange={(e) => handleInputChange("address", e.target.value)}
                                        disabled={!editMode}
                                        placeholder="آدرس خود را وارد کنید"
                                        className="w-full"
                                    />
                                </FormField>
                            </div>

                            <FormField
                                label="بیوگرافی"
                                htmlFor="bio"
                            >
                                <Textarea
                                    id="bio"
                                    value={formData.bio || ""}
                                    onChange={(e) => handleInputChange("bio", e.target.value)}
                                    disabled={!editMode}
                                    placeholder="درباره خود بنویسید..."
                                    rows={4}
                                />
                            </FormField>

                    </CardWithIcon>
                </div>
            </div>
        </TabsContent>
    );
}