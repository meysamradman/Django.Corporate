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
    User, Mail, Phone, MapPin, Fingerprint, CheckCircle2, XCircle, Edit2, Smartphone, Calendar
} from "lucide-react";
import { UserWithProfile } from "@/types/auth/user";
import { ProvinceCompact, CityCompact } from "@/types/shared/location";
import { locationApi } from "@/api/location/route";
import { useState, useEffect } from "react";
import { PersianDatePicker } from "@/components/elements/PersianDatePicker";

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
    birthDate: string;
}

interface AccountTabProps {
    user: UserWithProfile;
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
    user,
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
        const selectedProvince = provinces.find(p => p.name === provinceName);
        if (selectedProvince && onProvinceChange) {
            onProvinceChange(provinceName, selectedProvince.id);
        }
    };

    const handleCityChange = (cityName: string) => {
        const selectedCity = cities.find(c => c.name === cityName);
        if (selectedCity && onCityChange) {
            onCityChange(cityName, selectedCity.id);
        }
    };

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
                                            : user.full_name || "نام وارد نشده"
                                        }
                                    </span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <Smartphone className="w-4 h-4 text-muted-foreground" />
                                    <span>موبایل:</span>
                                    <span className="text-muted-foreground" dir="ltr">{formData.mobile || "وارد نشده"}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    {user.is_active ? (
                                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                                    ) : (
                                        <XCircle className="w-4 h-4 text-red-500" />
                                    )}
                                    <span>وضعیت:</span>
                                    <span className="text-muted-foreground">{user.is_active ? "فعال" : "غیرفعال"}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <Calendar className="w-4 h-4 text-muted-foreground" />
                                    <span>تاریخ تولد:</span>
                                    <span className="text-muted-foreground">{formData.birthDate || "وارد نشده"}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <MapPin className="w-4 h-4 text-muted-foreground" />
                                    <span>کشور:</span>
                                    <span className="text-muted-foreground">ایران</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <MapPin className="w-4 h-4 text-muted-foreground" />
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
                        </CardContent>
                    </Card>

                    {/* اطلاعات تماس */}
                    <Card>
                        <CardHeader>
                            <CardTitle>اطلاعات تماس</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4 text-sm font-medium">
                                <div className="flex items-center gap-4">
                                    <Mail className="w-4 h-4 text-muted-foreground" />
                                    <span>ایمیل:</span>
                                    <span className="text-muted-foreground text-xs break-all">{formData.email || "وارد نشده"}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <Smartphone className="w-4 h-4 text-muted-foreground" />
                                    <span>موبایل:</span>
                                    <span className="text-muted-foreground" dir="ltr">{formData.mobile || "وارد نشده"}</span>
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

                {/* ستون راست: فرم */}
                <div className="lg:col-span-3 space-y-6">
                    {/* اطلاعات کامل */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>اطلاعات کاربری</CardTitle>
                            </div>
                            {!editMode && (
                                <Button variant="outline" size="sm" onClick={() => setEditMode(true)}>
                                    <Edit2 className="w-4 h-4 me-2" />
                                    ویرایش
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    label="نام"
                                    error={fieldErrors.firstName}
                                    required
                                >
                                    <Input
                                        id="firstName"
                                        value={formData.firstName}
                                        onChange={(e) => handleInputChange("firstName", e.target.value)}
                                        disabled={!editMode}
                                        placeholder="نام"
                                    />
                                </FormField>
                                <FormField
                                    label="نام خانوادگی"
                                    error={fieldErrors.lastName}
                                    required
                                >
                                    <Input
                                        id="lastName"
                                        value={formData.lastName}
                                        onChange={(e) => handleInputChange("lastName", e.target.value)}
                                        disabled={!editMode}
                                        placeholder="نام خانوادگی"
                                    />
                                </FormField>
                                <div className="space-y-2">
                                    <Label htmlFor="birthDate">تاریخ تولد</Label>
                                    <PersianDatePicker
                                        value={formData.birthDate}
                                        onChange={handleBirthDateChange}
                                        disabled={!editMode}
                                    />
                                </div>
                                <FormField
                                    label="کد ملی"
                                    error={fieldErrors.nationalId}
                                >
                                    <Input
                                        id="nationalId"
                                        value={formData.nationalId}
                                        onChange={(e) => handleInputChange("nationalId", e.target.value)}
                                        disabled={!editMode}
                                        placeholder="کد ملی"
                                        type="text"
                                        inputMode="numeric"
                                        onKeyDown={preventNonNumeric}
                                        onPaste={preventNonNumericPaste}
                                    />
                                </FormField>
                            </div>

                            <Separator />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    label="شماره موبایل"
                                    error={fieldErrors.mobile}
                                    required
                                >
                                    <Input
                                        id="mobile"
                                        value={formData.mobile}
                                        onChange={(e) => handleInputChange("mobile", e.target.value)}
                                        disabled={!editMode}
                                        type="text"
                                        inputMode="tel"
                                        placeholder="09xxxxxxxxx"
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
                                        value={formData.email}
                                        onChange={(e) => handleInputChange("email", e.target.value)}
                                        disabled={!editMode}
                                        placeholder="example@domain.com"
                                    />
                                </FormField>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">تلفن</Label>
                                    <Input
                                        id="phone"
                                        value={formData.phone}
                                        onChange={(e) => handleInputChange("phone", e.target.value)}
                                        disabled={!editMode}
                                        placeholder="تلفن ثابت"
                                        type="text"
                                        inputMode="tel"
                                        onKeyDown={preventNonNumeric}
                                        onPaste={preventNonNumericPaste}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="province">استان</Label>
                                    <Select
                                        value={formData.province}
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
                                        value={formData.city}
                                        onValueChange={handleCityChange}
                                        disabled={!editMode || loadingCities || !formData.province}
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
                                        value={formData.address}
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
                                    value={formData.bio}
                                    onChange={(e) => handleInputChange("bio", e.target.value)}
                                    disabled={!editMode}
                                    placeholder="درباره خود بنویسید"
                                    rows={3}
                                />
                            </div>

                            {editMode && (
                                <div className="flex gap-2 pt-4">
                                    <Button onClick={handleSaveProfile} disabled={isSaving}>
                                        {isSaving ? "در حال ذخیره..." : "ذخیره تغییرات"}
                                    </Button>
                                    <Button variant="outline" onClick={() => setEditMode(false)}>
                                        انصراف
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </TabsContent>
    );
}