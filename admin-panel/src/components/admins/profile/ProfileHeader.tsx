import { Card, CardContent } from "@/components/elements/Card";
import { CheckCircle2, XCircle, Smartphone, Clock, Shield } from "lucide-react";
import type { AdminWithProfile } from "@/types/auth/admin";
import { ImageSelector } from "@/components/media/selectors/ImageSelector";
import type { Media } from "@/types/shared/media";
import { useState, useEffect, useCallback } from "react";
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/core/auth/AuthContext';
import { showSuccess, showError } from '@/core/toast';
import { adminApi } from '@/api/admins/admins';
import type { Role } from '@/types/auth/permission';

interface ProfileHeaderProps {
    admin: AdminWithProfile;
    formData: {
        firstName: string;
        lastName: string;
        mobile: string;
        profileImage?: Media | null;
    };
    onProfileImageChange?: (media: Media | null) => void;
    adminId?: string;
}

export function ProfileHeader({ admin, formData, onProfileImageChange, adminId }: ProfileHeaderProps) {
    const [adminRoles, setAdminRoles] = useState<Role[]>([]);
    const queryClient = useQueryClient();
    const { refreshUser } = useAuth();

    const loadAdminRoles = useCallback(async () => {
        try {
            const adminRolesResponse = await adminApi.getAdminRoles(admin.id);
            const adminRolesData = Array.isArray(adminRolesResponse)
                ? adminRolesResponse.map((assignment: any) => {
                    if (assignment.role && typeof assignment.role === 'object') {
                        return assignment.role;
                    }
                    return assignment;
                })
                : [];
            setAdminRoles(adminRolesData);
        } catch {
        }
    }, [admin.id]);

    useEffect(() => {
        if (admin?.id) {
            loadAdminRoles();
        }
    }, [admin?.id, loadAdminRoles]);

    const currentProfileImage: Media | null = formData.profileImage || admin?.profile?.profile_picture || null;

    const handleProfileImageSelect = async (selectedMedia: Media | null) => {
        const profilePictureId = selectedMedia?.id || null;
        const isMeRoute = adminId === "me";
        const targetAdminId = adminId && !isNaN(Number(adminId)) ? Number(adminId) : admin?.id;

        if (!targetAdminId) {
            showError("شناسه ادمین یافت نشد");
            return;
        }

        try {
            let updatedAdmin;
            if (isMeRoute) {
                const updatePayload: any = {
                    profile_picture: profilePictureId,
                };
                if (!profilePictureId) {
                    updatePayload.remove_profile_picture = "true";
                }
                updatedAdmin = await adminApi.updateProfile(updatePayload);
            } else {
                const currentProfile = admin?.profile;
                const updateData: any = {
                    profile: {
                        first_name: currentProfile?.first_name || null,
                        last_name: currentProfile?.last_name || null,
                        phone: currentProfile?.phone || null,
                        address: currentProfile?.address || null,
                        province: currentProfile?.province?.id || null,
                        city: currentProfile?.city?.id || null,
                        bio: currentProfile?.bio || null,
                        national_id: currentProfile?.national_id || null,
                        profile_picture: profilePictureId,
                        birth_date: currentProfile?.birth_date || null,
                    }
                };
                if (!profilePictureId) {
                    updateData.remove_profile_picture = "true";
                }
                updatedAdmin = await adminApi.updateUserByType(targetAdminId, updateData, 'admin');
            }

            if (!updatedAdmin) {
                showError("خطا در دریافت پاسخ از سرور");
                return;
            }

            const queryKeyForInvalidate = isMeRoute ? 'me' : (adminId || String(admin?.id));

            // Update callback whether image is set or removed
            if (onProfileImageChange) {
                const updatedImage: Media | null = updatedAdmin.profile?.profile_picture ?? null;
                onProfileImageChange(updatedImage);
            }

            await queryClient.setQueryData(['admin', queryKeyForInvalidate], updatedAdmin);
            await queryClient.invalidateQueries({ queryKey: ['admin', queryKeyForInvalidate] });
            await queryClient.invalidateQueries({ queryKey: ['admin-profile'] });
            await queryClient.invalidateQueries({ queryKey: ['current-admin-profile'] });

            if (isMeRoute) {
                await refreshUser();
            }

            if (profilePictureId) {
                showSuccess("عکس پروفایل با موفقیت به‌روزرسانی شد");
            } else {
                showSuccess("عکس پروفایل با موفقیت حذف شد");
            }
        } catch (error) {
            showError(error, { customMessage: "خطا در ذخیره عکس پروفایل" });
        }
    };

    return (
        <Card className="overflow-hidden p-0">
            <div className="relative h-40 md:h-56">
                <img
                    src="/images/profile-banner.png"
                    alt="Cover image"
                    className="absolute inset-0 w-full h-full object-cover"
                />
            </div>
            <CardContent className="relative px-6 pt-0 pb-6">
                <div className="flex items-end gap-6 -mt-16">
                    <ImageSelector
                        selectedMedia={currentProfileImage}
                        onMediaSelect={handleProfileImageSelect}
                        size="md"
                        placeholderText={(formData.firstName?.[0] || admin.full_name?.[0] || "U") + (formData.lastName?.[0] || admin.full_name?.split(" ")?.[1]?.[0] || "")}
                        context="media_library"
                        alt="تصویر پروفایل"
                    />
                    <div className="flex-1 pt-16 pb-2">
                        <h2>
                            {formData.firstName && formData.lastName
                                ? `${formData.firstName} ${formData.lastName}`
                                : admin.full_name || "نام کاربری"
                            }
                        </h2>
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-font-s mt-3">
                            <div className="flex items-center gap-2">
                                <div className={`flex items-center justify-center w-9 h-9 rounded-full p-2 ${admin.is_active ? "bg-green" : "bg-yellow"
                                    }`}>
                                    {admin.is_active ? (
                                        <CheckCircle2 className="w-5 h-5 text-green-1" />
                                    ) : (
                                        <XCircle className="w-5 h-5 text-yellow-1" />
                                    )}
                                </div>
                                <span className={admin.is_active ? "text-green-1" : "text-yellow-1"}>
                                    {admin.is_active ? "فعال" : "غیرفعال"}
                                </span>
                            </div>
                            {admin.created_at && (
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center justify-center w-9 h-9 rounded-full bg-blue p-2">
                                        <Clock className="w-5 h-5 text-blue-1" />
                                    </div>
                                    <span>
                                        ایجاد شده در{" "}
                                        {new Date(admin.created_at).toLocaleDateString("fa-IR")}
                                    </span>
                                </div>
                            )}
                            {(formData.mobile || admin.mobile) && (
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center justify-center w-9 h-9 rounded-full bg-purple p-2">
                                        <Smartphone className="w-5 h-5 text-purple-1" />
                                    </div>
                                    <span>{formData.mobile || admin.mobile}</span>
                                </div>
                            )}
                            {adminRoles && adminRoles.length > 0 && (
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center justify-center w-9 h-9 rounded-full bg-orange p-2">
                                        <Shield className="w-5 h-5 text-orange-1" />
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {adminRoles.slice(0, 2).map((role: any) => (
                                            <span key={role.id || role.public_id} className="inline-flex items-center rounded-md bg-orange px-2 py-0.5 text-xs font-medium text-orange-2 ring-1 ring-inset ring-orange-1/20">
                                                {role.display_name || role.name}
                                            </span>
                                        ))}
                                        {adminRoles.length > 2 && (
                                            <span className="inline-flex items-center rounded-md bg-orange px-2 py-0.5 text-xs font-medium text-orange-2 ring-1 ring-inset ring-orange-1/20">
                                                +{adminRoles.length - 2}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
