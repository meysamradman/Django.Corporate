import { Card, CardContent } from "@/components/elements/Card";
import { CheckCircle2, XCircle, Smartphone, Clock } from "lucide-react";
import type { UserWithProfile } from "@/types/auth/user";
import { ImageSelector } from "@/components/media/selectors/ImageSelector";
import type { Media } from "@/types/shared/media";
import { useQueryClient } from '@tanstack/react-query';
import { showError, showSuccess } from '@/core/toast';

interface ProfileHeaderProps {
    user: UserWithProfile;
    formData: {
        firstName: string;
        lastName: string;
        mobile: string;
        profileImage?: Media | null;
    };
    onProfileImageChange?: (media: Media | null) => void;
}

export function ProfileHeader({ user, formData, onProfileImageChange }: ProfileHeaderProps) {
    const queryClient = useQueryClient();

    const currentProfileImage = formData.profileImage || user?.profile?.profile_picture || null;

    const handleProfileImageSelect = async (selectedMedia: Media | null) => {
        const profilePictureId = selectedMedia?.id || null;
        
        try {
            const { adminApi } = await import('@/api/admins/admins');
            
            const updateData: any = {
                profile: {
                    profile_picture: profilePictureId,
                }
            };
            if (!profilePictureId) {
                updateData.remove_profile_picture = "true";
            }
            
            const updatedUser = await adminApi.updateUserByType(user.id, updateData, 'user');
            
            // Update callback whether image is set or removed
            if (onProfileImageChange) {
                onProfileImageChange(updatedUser?.profile?.profile_picture || null);
            }
            
            await queryClient.invalidateQueries({ queryKey: ['user-profile'] });
            await queryClient.invalidateQueries({ queryKey: ['current-user-profile'] });
            
            const userIdMatch = window.location.pathname.match(/\/users\/(\d+)\//);
            if (userIdMatch) {
                const userId = userIdMatch[1];
                await queryClient.invalidateQueries({ queryKey: ['user', userId] });
            }
            
            if (profilePictureId) {
                showSuccess("عکس پروفایل با موفقیت به‌روزرسانی شد");
            } else {
                showSuccess("عکس پروفایل با موفقیت حذف شد");
            }
        } catch (error) {
            showError("خطا در ذخیره عکس پروفایل");
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
                        placeholderText={(formData.firstName?.[0] || user.full_name?.[0] || "U") + (formData.lastName?.[0] || user.full_name?.split(" ")?.[1]?.[0] || "")}
                        context="media_library"
                        alt="تصویر پروفایل"
                    />
                    <div className="flex-1 pt-16 pb-2">
                        <h2>
                            {formData.firstName && formData.lastName
                                ? `${formData.firstName} ${formData.lastName}`
                                : user.full_name || "نام کاربری"
                            }
                        </h2>
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-font-s mt-3">
                            <div className="flex items-center gap-2">
                                <div className={`flex items-center justify-center w-9 h-9 rounded-full p-2 ${
                                    user.is_active ? "bg-green" : "bg-yellow"
                                }`}>
                                    {user.is_active ? (
                                        <CheckCircle2 className="w-5 h-5 text-green-1" />
                                    ) : (
                                        <XCircle className="w-5 h-5 text-yellow-1" />
                                    )}
                                </div>
                                <span className={user.is_active ? "text-green-1" : "text-yellow-1"}>
                                    {user.is_active ? "فعال" : "غیرفعال"}
                                </span>
                            </div>
                            {user.created_at && (
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center justify-center w-9 h-9 rounded-full bg-blue p-2">
                                        <Clock className="w-5 h-5 text-blue-1" />
                                    </div>
                                    <span>
                                        ایجاد شده در{" "}
                                        {new Date(user.created_at).toLocaleDateString("fa-IR")}
                                    </span>
                                </div>
                            )}
                            {(formData.mobile || user.mobile) && (
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center justify-center w-9 h-9 rounded-full bg-purple p-2">
                                        <Smartphone className="w-5 h-5 text-purple-1" />
                                    </div>
                                    <span>{formData.mobile || user.mobile}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}