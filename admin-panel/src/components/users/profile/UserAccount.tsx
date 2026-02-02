import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Input } from "@/components/elements/Input";
import { Button } from "@/components/elements/Button";
import { Textarea } from "@/components/elements/Textarea";
import { TabsContent } from "@/components/elements/Tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/elements/Select";
import { FormField } from "@/components/shared/FormField";
import {
    User, Mail, Phone, MapPin, Fingerprint, Globe, Map, Edit2, Smartphone, Calendar
} from "lucide-react";
import type { UserWithProfile } from "@/types/auth/user";
import type { ProvinceCompact, CityCompact } from "@/types/shared/location";
import { locationApi } from "@/api/shared/location/location";
import { useState, useEffect } from "react";
import { PersianDatePicker } from "@/components/elements/PersianDatePicker";
import { filterNumericOnly } from "@/core/utils/numeric";
import { Switch } from "@/components/elements/Switch";
import { Item, ItemContent, ItemTitle, ItemDescription, ItemActions } from "@/components/elements/Item";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/core/auth/AuthContext';
import { showSuccess, showError } from '@/core/toast';
import { adminApi } from '@/api/admins/admins';
import { hasPermission } from "@/core/permissions/utils/permissionUtils";

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
    userId?: string;
}

export function UserAccount({
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
    userId,
}: AccountTabProps) {

    const [provinces, setProvinces] = useState<ProvinceCompact[]>([]);
    const [cities, setCities] = useState<CityCompact[]>([]);
    const [loadingProvinces, setLoadingProvinces] = useState(false);
    const [loadingCities, setLoadingCities] = useState(false);
    const [isActive, setIsActive] = useState(user.is_active);
    const queryClient = useQueryClient();
    const { user: currentUser } = useAuth();

    const userPermissionsObj = {
        permissions: currentUser?.permissions || [],
        is_super: currentUser?.is_superuser || false,
        is_superuser: currentUser?.is_superuser || false
    };

    const canManagePermissions = currentUser && (
        currentUser.is_superuser ||
        hasPermission(userPermissionsObj, 'role.manage') ||
        hasPermission(userPermissionsObj, 'admin.manage') ||
        hasPermission(userPermissionsObj, 'user.manage')
    );

    useEffect(() => {
        setIsActive(user.is_active);
    }, [user.is_active]);

    useEffect(() => {
        const fetchProvinces = async () => {
            setLoadingProvinces(true);
            try {
                const provinces = await locationApi.getProvincesCompact();
                setProvinces(provinces);
            } catch (error) {
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
                } catch (error) {
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

    const updateActiveStatusMutation = useMutation({
        mutationFn: async (newStatus: boolean) => {
            const targetUserId = userId && !isNaN(Number(userId)) ? Number(userId) : user?.id;

            if (!targetUserId) {
                throw new Error("شناسه کاربر یافت نشد");
            }

            return await adminApi.updateUserStatusByType(targetUserId, newStatus, 'user');
        },
        onSuccess: async (updatedUser) => {
            setIsActive(updatedUser.is_active);
            const queryKeyForInvalidate = userId || String(user?.id);
            await queryClient.setQueryData(['user', queryKeyForInvalidate], updatedUser);
            await queryClient.invalidateQueries({ queryKey: ['user', queryKeyForInvalidate] });
            await queryClient.invalidateQueries({ queryKey: ['users'] });

            showSuccess("وضعیت حساب کاربری با موفقیت به‌روزرسانی شد");
        },
        onError: (error) => {
            setIsActive(user.is_active);
            showError(error, { customMessage: "خطا در به‌روزرسانی وضعیت حساب کاربری" });
        },
    });

    const handleActiveStatusChange = (checked: boolean) => {
        setIsActive(checked);
        updateActiveStatusMutation.mutate(checked);
    };

    return (
        <TabsContent value="account">
            <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
                <div className="lg:col-span-2 space-y-6">
                    <CardWithIcon
                        icon={User}
                        title="اطلاعات کاربران"
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
                                                    : user.full_name || "نام وارد نشده"
                                                }
                                            </span>
                                        </div>
                                    </div>
                                    {canManagePermissions && (
                                        <div className="py-3 space-y-3">
                                            <div className="rounded-xl border border-green-1/40 bg-green-0/30 hover:border-green-1/60 transition-colors overflow-hidden">
                                                <Item variant="default" size="default" className="py-4">
                                                    <ItemContent>
                                                        <ItemTitle className="text-green-2 text-sm">وضعیت فعال</ItemTitle>
                                                        <ItemDescription className="text-xs">
                                                            حساب کاربری این کاربر را فعال یا غیرفعال کنید.
                                                        </ItemDescription>
                                                    </ItemContent>
                                                    <ItemActions>
                                                        <Switch
                                                            checked={isActive}
                                                            onCheckedChange={handleActiveStatusChange}
                                                            disabled={updateActiveStatusMutation.isPending}
                                                        />
                                                    </ItemActions>
                                                </Item>
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between gap-3 py-3">
                                        <div className="flex items-center gap-2">
                                            <Smartphone className="w-4 h-4 text-font-s flex-shrink-0" />
                                            <label>موبایل:</label>
                                        </div>
                                        <p className="text-font-p text-left">{formData.mobile || user.mobile || "وارد نشده"}</p>
                                    </div>
                                    <div className="flex items-center justify-between gap-3 py-3">
                                        <div className="flex items-center gap-2">
                                            <Mail className="w-4 h-4 text-font-s flex-shrink-0" />
                                            <label>ایمیل:</label>
                                        </div>
                                        <div className="flex-1 ms-2 text-left min-w-0 overflow-hidden">
                                            <span className="text-font-p break-all">{formData.email || user.email || "وارد نشده"}</span>
                                        </div>
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
                                            <Calendar className="w-4 h-4 text-font-s flex-shrink-0" />
                                            <label>تاریخ تولد:</label>
                                        </div>
                                        <p className="text-font-p text-left">
                                            {formData.birthDate || "وارد نشده"}
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

                <div className="lg:col-span-4 space-y-6">
                    <CardWithIcon
                        icon={User}
                        title="اطلاعات کاربری"
                        iconBgColor="bg-primary/10"
                        iconColor="stroke-primary"
                        borderColor="border-b-primary"
                        className="hover:shadow-lg transition-all duration-300"
                        titleExtra={
                            !editMode && (
                                <Button variant="outline" size="sm" onClick={() => setEditMode(true)}>
                                    <Edit2 className="w-4 h-4" />
                                    ویرایش
                                </Button>
                            )
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
                                    onChange={(e) => {
                                        const filteredValue = filterNumericOnly(e.target.value);
                                        handleInputChange("nationalId", filteredValue);
                                    }}
                                    disabled={!editMode}
                                    placeholder="کد ملی"
                                    type="text"
                                    inputMode="numeric"
                                />
                            </FormField>
                            <FormField
                                label="تلفن"
                                htmlFor="phone"
                            >
                                <Input
                                    id="phone"
                                    value={formData.phone}
                                    onChange={(e) => {
                                        const filteredValue = filterNumericOnly(e.target.value);
                                        handleInputChange("phone", filteredValue);
                                    }}
                                    disabled={!editMode}
                                    placeholder="تلفن ثابت"
                                    type="text"
                                    inputMode="tel"
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
                                    onChange={(e) => {
                                        const filteredValue = filterNumericOnly(e.target.value);
                                        handleInputChange("mobile", filteredValue);
                                    }}
                                    disabled={!editMode}
                                    type="text"
                                    inputMode="tel"
                                    placeholder="09xxxxxxxxx"
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
                    </CardWithIcon>
                </div>
            </div>
        </TabsContent>
    );
}