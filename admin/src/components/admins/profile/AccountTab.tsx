"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/elements/Card";
import { Input } from "@/components/elements/Input";
import { Button } from "@/components/elements/Button";
import { Label } from "@/components/elements/Label";
import { Separator } from "@/components/elements/Separator";
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
        <TabsContent value="account" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Left Column: Details */}
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>درباره</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4 text-sm font-medium">
                                <div className="flex items-center gap-4">
                                    <User className="w-4 h-4 text-muted-foreground" />
                                    <span>نام کامل:</span>
                                    <span className="text-muted-foreground">
                                        {formData.firstName && formData.lastName
                                            ? `${formData.firstName} ${formData.lastName}`
                                            : admin.full_name || "نام وارد نشده"
                                        }
                                    </span>
                                </div>
                                <div className="flex items-center gap-4">
                                    {admin.is_active ? (
                                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                                    ) : (
                                        <XCircle className="w-4 h-4 text-red-500" />
                                    )}
                                    <span>وضعیت:</span>
                                    <span className="text-muted-foreground">{admin.is_active ? "فعال" : "غیرفعال"}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <Calendar className="w-4 h-4 text-muted-foreground" />
                                    <span>تاریخ تولد:</span>
                                    <span className="text-muted-foreground">
                                        {formData.birthDate ? formatDate(formData.birthDate) : "وارد نشده"}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <Globe className="w-4 h-4 text-muted-foreground" />
                                    <span>کشور:</span>
                                    <span className="text-muted-foreground">ایران</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <Map className="w-4 h-4 text-muted-foreground" />
                                    <span>استان:</span>
                                    <span className="text-muted-foreground">{formData.province || "وارد نشده"}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <MapPin className="w-4 h-4 text-muted-foreground" />
                                    <span>شهر:</span>
                                    <span className="text-muted-foreground">{formData.city || "وارد نشده"}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <Fingerprint className="w-4 h-4 text-muted-foreground" />
                                    <span>کد ملی:</span>
                                    <span className="text-muted-foreground">{formData.nationalId || "وارد نشده"}</span>
                                </div>
                            </div>
                            <Separator />
                            <h4 className="text-sm font-semibold">اطلاعات تماس</h4>
                            <div className="space-y-4 text-sm font-medium">
                                <div className="flex items-center gap-4">
                                    <Mail className="w-4 h-4 text-muted-foreground" />
                                    <span>ایمیل:</span>
                                    <span className="text-muted-foreground break-all">{formData.email || admin.email || "وارد نشده"}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <Smartphone className="w-4 h-4 text-muted-foreground" />
                                    <span>موبایل:</span>
                                    <span className="text-muted-foreground">{formData.mobile || admin.mobile || "وارد نشده"}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <Phone className="w-4 h-4 text-muted-foreground" />
                                    <span>تلفن:</span>
                                    <span className="text-muted-foreground">{formData.phone || "وارد نشده"}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <MapPin className="w-4 h-4 text-muted-foreground" />
                                    <span>آدرس:</span>
                                    <span className="text-muted-foreground">{formData.address || "وارد نشده"}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Edit Form */}
                <div className="lg:col-span-3 space-y-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>اطلاعات کاربری</CardTitle>
                            </div>
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
                        </CardHeader>
                        <CardContent className="space-y-6">
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
                                <div className="space-y-2">
                                    <Label htmlFor="birthDate">تاریخ تولد</Label>
                                    <PersianDatePicker
                                        value={formData.birthDate || ""}
                                        onChange={handleBirthDateChange}
                                        placeholder="تاریخ تولد را انتخاب کنید"
                                        disabled={!editMode}
                                    />
                                </div>
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
                                <div className="space-y-2">
                                    <Label htmlFor="phone">تلفن</Label>
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
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
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
                                <div className="space-y-2">
                                    <Label htmlFor="province">استان</Label>
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
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="city">شهر</Label>
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
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="address">آدرس</Label>
                                    <Input
                                        id="address"
                                        value={formData.address || ""}
                                        onChange={(e) => handleInputChange("address", e.target.value)}
                                        disabled={!editMode}
                                        placeholder="آدرس خود را وارد کنید"
                                        className="w-full"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="bio">بیوگرافی</Label>
                                <Textarea
                                    id="bio"
                                    value={formData.bio || ""}
                                    onChange={(e) => handleInputChange("bio", e.target.value)}
                                    disabled={!editMode}
                                    placeholder="درباره خود بنویسید..."
                                    rows={4}
                                />
                            </div>

                        </CardContent>
                    </Card>
                </div>
            </div>
        </TabsContent>
    );
}