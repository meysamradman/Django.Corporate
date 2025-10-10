"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { toast } from "@/components/elements/Sonner";
import { adminApi } from "@/api/admins/route";
// import { AdminWithProfile } from "@/types/auth/admin";

import { roleApi } from "@/api/roles/route";
import { Role } from "@/types/auth/permission";
import { showErrorToast } from "@/core/config/errorHandler";
import { Button } from "@/components/elements/Button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/components/elements/Card";
import { Input } from "@/components/elements/Input";
import { Label } from "@/components/elements/Label";
import { Switch } from "@/components/elements/Switch";
import { Loader2, Save, X } from "lucide-react";
import { Textarea } from "@/components/elements/Textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/elements/Select";
import { validateMobileLegacy, validateEmailLegacy, validatePasswordLegacy, filterNumericOnly } from "@/core/utils/validations";
// import { fetchApi } from "@/core/config/fetch";
import { MediaSelector } from "@/components/media/selectors/MediaSelector";
import { Media } from "@/types/shared/media";

export function CreateAdminForm() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);

    const [roles, setRoles] = useState<Role[]>([]);
    const [loadingRoles, setLoadingRoles] = useState(true);
    const [rolesError, setRolesError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        mobile: '',
        email: '',
        password: '',
        full_name: '', // Add full_name here
        is_superuser: false,
        is_staff: false,
        is_active: true,
        profile_first_name: '',
        profile_last_name: '',
        profile_birth_date: '',
        profile_national_id: '',
        profile_address: '',
        profile_department: '',
        profile_position: '',
        profile_bio: '',
        profile_notes: '',
        role_id: 'none',
    });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        const fetchRoles = async () => {
            setLoadingRoles(true);
            setRolesError(null);
            try {
                const response = await roleApi.getRoleList({ is_active: true });
                console.log('🔍 Roles response:', response); // Debug log
                
                // Handle different response structures
                let fetchedRoles: Role[] = [];
                
                if (response.data && Array.isArray(response.data)) {
                    // Direct array response
                    fetchedRoles = response.data;
                } else if (response.data && typeof response.data === 'object' && 'results' in response.data && Array.isArray((response.data as any).results)) {
                    // Paginated response
                    fetchedRoles = (response.data as any).results;
                } else if (response && Array.isArray(response)) {
                    // Response is directly an array
                    fetchedRoles = response;
                } else {
                    console.warn('Unexpected roles response structure:', response);
                    fetchedRoles = [];
                }
                
                console.log('🔍 Processed roles:', fetchedRoles);
                setRoles(fetchedRoles);
                
                // Set default role selection
                setFormData(prev => ({ ...prev, role_id: 'none' }));
            } catch (error) {
                console.error('Error fetching roles:', error);
                setRolesError('بارگذاری نقش‌ها ناموفق بود.');
                setFormData(prev => ({ ...prev, role_id: 'none' }));
                showErrorToast(error, 'بارگذاری نقش‌ها ناموفق بود');
            } finally {
                setLoadingRoles(false);
            }
        };
        fetchRoles();
    }, []);



    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setFormErrors({});

        const mobileValidationError = validateMobileLegacy(formData.mobile);
        if (mobileValidationError) {
            setFormErrors({ mobile: mobileValidationError });
            setLoading(false);
            return;
        }

        const emailValidationError = validateEmailLegacy(formData.email);
        if (emailValidationError) {
            setFormErrors({ email: emailValidationError });
            setLoading(false);
            return;
        }

        const passwordValidationError = validatePasswordLegacy(formData.password);
        if (passwordValidationError) {
            setFormErrors({ password: passwordValidationError });
            setLoading(false);
            return;
        }

        try {
            // Build profile object
            const profileData: Partial<{
                first_name: string | null;
                last_name: string | null;
                birth_date: string | null;
                national_id: string | null;
                address: string | null;
                department: string | null;
                position: string | null;
                bio: string | null;
                notes: string | null;
            }> = {};
            
            profileData.first_name = formData.profile_first_name || null;
            profileData.last_name = formData.profile_last_name || null;
            profileData.birth_date = formData.profile_birth_date || null;
            profileData.national_id = formData.profile_national_id || null;
            profileData.address = formData.profile_address || null;
            profileData.department = formData.profile_department || null;
            profileData.position = formData.profile_position || null;
            profileData.bio = formData.profile_bio || null;
            profileData.notes = formData.profile_notes || null;

            const adminDataToSubmit: Record<string, unknown> = {
                mobile: formData.mobile,
                email: formData.email || undefined,
                full_name: formData.full_name || undefined, // Add this line
                password: formData.password,
                is_active: formData.is_active,
                is_staff: formData.is_staff,
                is_superuser: formData.is_superuser,
                ...(formData.role_id !== 'none' && { role_id: Number(formData.role_id) }),
            };

            // Add profile data if available
            if (Object.keys(profileData).length > 0) {
                adminDataToSubmit.profile = profileData;
            }
            
            // Add profile_picture_id if a media item is selected
            if (selectedMedia?.id) {
                adminDataToSubmit.profile_picture_id = selectedMedia.id;
            }

            // Send JSON data for admin creation
            await adminApi.createAdmin(adminDataToSubmit, undefined);

            toast.success("ادمین با موفقیت ایجاد شد");
            router.push("/admins");
        } catch (error: unknown) {
            console.error("Error creating admin:", error);
            const apiError = error as { response?: { message?: string; errors?: Record<string, string[]> }; message?: string };
            const message = apiError.response?.message || apiError.message || "خطا در ایجاد ادمین";
            const errors = apiError.response?.errors;
            let description = "";
            if (errors) {
                description = Object.entries(errors)
                    .map(([key, value]) => `${key}: ${(value as string[]).join(', ')}`)
                    .join('\n');
            }
            toast.error(message, { description: description || undefined });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        
        if (name.startsWith('profile.')) {
            // Convert profile.first_name to profile_first_name
            const fieldName = name.replace('profile.', 'profile_');
            setFormData(prev => ({
                ...prev,
                [fieldName]: value
            }));
        } else {
            let processedValue = value;
            if (name === "mobile") {
                processedValue = filterNumericOnly(value);
            }
            
            setFormData(prev => ({
                ...prev,
                [name]: processedValue
            }));
            
            if (name === "password") {
                 const validationError = validatePasswordLegacy(value);
                 setFormErrors(prev => ({ ...prev, password: validationError || '' }));
            } else if (name === "mobile") {
                 const validationError = validateMobileLegacy(processedValue);
                 setFormErrors(prev => ({ ...prev, mobile: validationError || '' }));
            } else if (name === "email") {
                 const validationError = validateEmailLegacy(value);
                 setFormErrors(prev => ({ ...prev, email: validationError || '' }));
            }
        }
    };

    const handleSwitchChange = (name: string, checked: boolean) => {
        setFormData(prev => ({
            ...prev,
            [name]: checked
        }));
    };

    const handleRoleChange = (value: string) => {
        setFormData({ ...formData, role_id: value });
        setFormErrors(prev => ({ ...prev, role_id: '' }));
    };

    return (
        <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 min-w-0">
                <Card>
                    <form onSubmit={handleSubmit} id="create-admin-form">
                        <CardContent className="space-y-4">
                    <MediaSelector
                        selectedMedia={selectedMedia}
                        onMediaSelect={setSelectedMedia}
                        label="تصویر پروفایل"
                        size="md"
                    />
                    
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="mobile">شماره موبایل *</Label>
                            <Input 
                                id="mobile" 
                                name="mobile" 
                                type="text"
                                value={formData.mobile}
                                onChange={handleChange}
                                placeholder="شماره موبایل وارد کنید"
                                required
                                className={formErrors.mobile ? "border-red-500" : ""}
                            />
                            {formErrors.mobile && (
                                <p className="text-xs text-destructive">{formErrors.mobile}</p>
                            )}
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="email">ایمیل (اختیاری)</Label>
                            <Input 
                                id="email" 
                                name="email" 
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="ایمیل وارد کنید"
                                className={formErrors.email ? "border-red-500" : ""}
                            />
                            {formErrors.email && (
                                <p className="text-xs text-destructive">{formErrors.email}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="full_name">نام کامل (اختیاری)</Label>
                            <Input 
                                id="full_name" 
                                name="full_name" 
                                type="text"
                                value={formData.full_name}
                                onChange={handleChange}
                                placeholder="نام کامل وارد کنید"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="role">نقش</Label>
                            <div className="relative">
                                {rolesError && <p className="text-sm text-destructive mb-2">{rolesError}</p>}
                                <Select 
                                    value={formData.role_id} 
                                    onValueChange={handleRoleChange}
                                    disabled={loadingRoles}
                                >
                                    <SelectTrigger className="w-full" aria-invalid={!!formErrors.role_id}>
                                        <SelectValue placeholder="انتخاب نقش..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {loadingRoles ? (
                                            <SelectItem value="loading" disabled>در حال بارگذاری نقش‌ها...</SelectItem>
                                        ) : roles.length === 0 && !rolesError ? (
                                            <SelectItem value="no-roles" disabled>نقشی موجود نیست</SelectItem>
                                        ) : (
                                            <>
                                                <SelectItem value="none">بدون نقش</SelectItem>
                                                {roles.map(role => (
                                                    <SelectItem key={role.id} value={role.id.toString()}>
                                                        {role.display_name || role.name}
                                                    </SelectItem>
                                                ))}
                                            </>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                            {formErrors.role_id && <p className="text-sm text-destructive">{formErrors.role_id}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">رمز عبور *</Label>
                            <Input 
                                id="password" 
                                name="password" 
                                type="password" 
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="رمز عبور وارد کنید"
                                required
                                className={formErrors.password ? "border-red-500" : ""}
                            />
                            {formErrors.password && (
                                <p className="text-xs text-destructive">{formErrors.password}</p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="profile.first_name">نام (اختیاری)</Label>
                            <Input
                                id="profile.first_name"
                                name="profile.first_name"
                                value={formData.profile_first_name}
                                onChange={handleChange}
                                placeholder="نام وارد کنید"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="profile.last_name">نام خانوادگی (اختیاری)</Label>
                            <Input
                                id="profile.last_name"
                                name="profile.last_name"
                                value={formData.profile_last_name}
                                onChange={handleChange}
                                placeholder="نام خانوادگی وارد کنید"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="profile.department">بخش</Label>
                            <Input
                                id="profile.department"
                                name="profile.department"
                                value={formData.profile_department}
                                onChange={handleChange}
                                placeholder="بخش وارد کنید (اختیاری)"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="profile.position">سمت</Label>
                            <Input
                                id="profile.position"
                                name="profile.position"
                                value={formData.profile_position}
                                onChange={handleChange}
                                placeholder="سمت وارد کنید (اختیاری)"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="profile.birth_date">تاریخ تولد</Label>
                        <Input
                            id="profile.birth_date"
                            name="profile.birth_date"
                            type="date"
                            value={formData.profile_birth_date}
                            onChange={handleChange}
                            placeholder="تاریخ تولد وارد کنید (اختیاری)"
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="profile.national_id">کد ملی</Label>
                            <Input
                                id="profile.national_id"
                                name="profile.national_id"
                                value={formData.profile_national_id}
                                onChange={handleChange}
                                placeholder="کد ملی وارد کنید (اختیاری)"
                                maxLength={10}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="profile.address">آدرس</Label>
                            <Input
                                id="profile.address"
                                name="profile.address"
                                value={formData.profile_address}
                                onChange={handleChange}
                                placeholder="آدرس وارد کنید (اختیاری)"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="profile.notes">یادداشت‌های داخلی</Label>
                        <Textarea
                            id="profile.notes"
                            name="profile.notes"
                            value={formData.profile_notes}
                            onChange={handleChange}
                            placeholder="یادداشت‌های داخلی وارد کنید (اختیاری)"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="profile.bio">بیوگرافی</Label>
                        <Textarea
                            id="profile.bio"
                            name="profile.bio"
                            value={formData.profile_bio}
                            onChange={handleChange}
                            placeholder="بیوگرافی وارد کنید (اختیاری)"
                        />
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Switch
                                id="is_active"
                                name="is_active"
                                checked={formData.is_active}
                                onCheckedChange={(checked) => handleSwitchChange("is_active", checked)}
                            />
                            <Label htmlFor="is_active">فعال</Label>
                        </div>
                        <div className="flex items-center gap-2">
                            <Switch
                                id="is_superuser"
                                name="is_superuser"
                                checked={formData.is_superuser}
                                onCheckedChange={(checked) => handleSwitchChange("is_superuser", checked)}
                            />
                            <Label htmlFor="is_superuser">سوپر ادمین</Label>
                        </div>
                    </div>
                        </CardContent>
                        <CardFooter className="flex justify-end gap-x-2">
                            <Button type="submit" disabled={loading}>
                                {loading && <Loader2 className="animate-spin" />}
                                <Save />
                                ذخیره
                            </Button>
                            <Button variant="outline" type="button" onClick={() => router.back()}>
                                <X />
                                انصراف
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
            
            <div className="w-full lg:w-96 lg:flex-shrink-0">
                <Card className="lg:sticky lg:top-6">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm">عملیات</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="space-y-2">
                            <SidebarActions 
                                loading={loading}
                                onSubmit={() => {
                                    const form = document.getElementById('create-admin-form') as HTMLFormElement;
                                    if (form) {
                                        form.requestSubmit();
                                    }
                                }}
                                onCancel={() => router.push('/admin')}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>


        </div>
    );
}

function SidebarActions({ loading, onSubmit, onCancel }: {
    loading: boolean;
    onSubmit: () => void;
    onCancel: () => void;
}) {
    return (
        <>
            <Button 
                type="button" 
                disabled={loading}
                className="w-full"
                onClick={onSubmit}
            >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                <Save className="h-4 w-4" />
                ایجاد ادمین
            </Button>
            <Button 
                type="button" 
                variant="outline"
                className="w-full"
                onClick={onCancel}
                disabled={loading}
            >
                <X className="h-4 w-4" />
                انصراف
            </Button>
        </>
    );
} 