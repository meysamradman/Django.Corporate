"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/elements/Card";
import { Input } from "@/components/elements/Input";
import { Button } from "@/components/elements/Button";
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
        <TabsContent value="account">
            <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
                {/* Left Column: Details */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-0 shadow-md hover:shadow-xl transition-all duration-300 relative overflow-hidden bg-gradient-to-br from-card via-card to-muted/30 before:absolute before:right-0 before:top-0 before:h-full before:w-1 before:bg-gradient-to-b before:from-blue-500 before:via-blue-400 before:to-blue-300">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3">
                                <div className="p-2.5 bg-blue-100 rounded-xl shadow-sm">
                                    <User className="w-5 h-5 stroke-blue-600" />
                                </div>
                                درباره
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 pb-4">
                            <div className="space-y-5">
                                <div>
                                    <div className="space-y-0 [&>div:not(:last-child)]:border-b">
                                        <div className="flex items-center justify-between gap-3 pb-3">
                                            <div className="flex items-center gap-2">
                                                <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                                <label>نام کامل:</label>
                                            </div>
                                            <div className="flex-1 ms-2 text-left min-w-0 overflow-hidden">
                                                <span className="text-foreground">
                                                    {formData.firstName && formData.lastName
                                                        ? `${formData.firstName} ${formData.lastName}`
                                                        : user.full_name || "نام وارد نشده"
                                                    }
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between gap-3 py-3">
                                            <div className="flex items-center gap-2">
                                                {user.is_active ? (
                                                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                                                ) : (
                                                    <XCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                                                )}
                                                <label>وضعیت:</label>
                                            </div>
                                            <p className="text-foreground text-left">
                                                {user.is_active ? "فعال" : "غیرفعال"}
                                            </p>
                                        </div>
                                        <div className="flex items-center justify-between gap-3 py-3">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                                <label>تاریخ تولد:</label>
                                            </div>
                                            <p className="text-foreground text-left">
                                                {formData.birthDate || "وارد نشده"}
                                            </p>
                                        </div>
                                        <div className="flex items-center justify-between gap-3 py-3">
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                                <label>کشور:</label>
                                            </div>
                                            <p className="text-foreground text-left">ایران</p>
                                        </div>
                                        <div className="flex items-center justify-between gap-3 py-3">
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                                <label>استان:</label>
                                            </div>
                                            <p className="text-foreground text-left">{formData.province || "وارد نشده"}</p>
                                        </div>
                                        <div className="flex items-center justify-between gap-3 py-3">
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                                <label>شهر:</label>
                                            </div>
                                            <p className="text-foreground text-left">{formData.city || "وارد نشده"}</p>
                                        </div>
                                        <div className="flex items-center justify-between gap-3 pt-3">
                                            <div className="flex items-center gap-2">
                                                <Fingerprint className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                                <label>کد ملی:</label>
                                            </div>
                                            <p className="text-foreground text-left">{formData.nationalId || "وارد نشده"}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="relative my-6">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-border/50"></div>
                                    </div>
                                    <div className="relative flex justify-center">
                                        <div className="bg-card px-3 py-1 rounded-full border border-border/50 shadow-sm">
                                            <div className="h-1 w-12 bg-gradient-to-r from-transparent via-primary/30 to-transparent rounded-full"></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-2">
                                    <div className="space-y-0 [&>div:not(:last-child)]:border-b">
                                        <div className="flex items-center justify-between gap-3 pb-3">
                                            <div className="flex items-center gap-2">
                                                <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                                <label>ایمیل:</label>
                                            </div>
                                            <div className="flex-1 ms-2 text-left min-w-0 overflow-hidden">
                                                <span className="text-foreground break-all">{formData.email || user.email || "وارد نشده"}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between gap-3 py-3">
                                            <div className="flex items-center gap-2">
                                                <Smartphone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                                <label>موبایل:</label>
                                            </div>
                                            <p className="text-foreground text-left">{formData.mobile || user.mobile || "وارد نشده"}</p>
                                        </div>
                                        <div className="flex items-center justify-between gap-3 py-3">
                                            <div className="flex items-center gap-2">
                                                <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                                <label>تلفن:</label>
                                            </div>
                                            <p className="text-foreground text-left">{formData.phone || "وارد نشده"}</p>
                                        </div>
                                        <div className="flex items-center justify-between gap-3 pt-3">
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                                <label>آدرس:</label>
                                            </div>
                                            <div className="flex-1 ms-2 text-left min-w-0 overflow-hidden">
                                                <span className="text-foreground">{formData.address || "وارد نشده"}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Edit Form */}
                <div className="lg:col-span-4 space-y-6">
                    <Card className="hover:shadow-lg transition-all duration-300 border-b-4 border-b-primary">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center gap-3">
                                <div className="p-2.5 bg-primary/10 rounded-xl shadow-sm">
                                    <User className="w-5 h-5 stroke-primary" />
                                </div>
                                اطلاعات کاربری
                            </CardTitle>
                            {!editMode && (
                                <Button variant="outline" size="sm" onClick={() => setEditMode(true)}>
                                    <Edit2 className="w-4 h-4 me-2" />
                                    ویرایش
                                </Button>
                            )}
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
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <FormField
                                    label="تاریخ تولد"
                                    htmlFor="birthDate"
                                >
                                    <PersianDatePicker
                                        value={formData.birthDate}
                                        onChange={handleBirthDateChange}
                                        disabled={!editMode}
                                    />
                                </FormField>
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
                                <FormField
                                    label="تلفن"
                                    htmlFor="phone"
                                >
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
                                </FormField>
                            </div>

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
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                <FormField
                                    label="استان"
                                    htmlFor="province"
                                >
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
                                </FormField>
                                <FormField
                                    label="شهر"
                                    htmlFor="city"
                                >
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
                                </FormField>
                                <FormField
                                    label="آدرس"
                                    htmlFor="address"
                                >
                                    <Input
                                        id="address"
                                        value={formData.address}
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
                                    value={formData.bio}
                                    onChange={(e) => handleInputChange("bio", e.target.value)}
                                    disabled={!editMode}
                                    placeholder="درباره خود بنویسید"
                                    rows={3}
                                />
                            </FormField>

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