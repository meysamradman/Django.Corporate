import { Card, CardContent } from "@/components/elements/Card";
import { Button } from "@/components/elements/Button";
import { CheckCircle2, XCircle, Smartphone, Camera, Clock } from "lucide-react";
import type { UserWithProfile } from "@/types/auth/user";
import { MediaImage } from "@/components/media/base/MediaImage";
import { MediaLibraryModal } from "@/components/media/modals/MediaLibraryModal";
import type { Media } from "@/types/shared/media";
import { useState } from "react";
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
    const [showMediaSelector, setShowMediaSelector] = useState(false);
    const [activeTab, setActiveTab] = useState<"select" | "upload">("select");
    const queryClient = useQueryClient();

    const currentProfileImage = formData.profileImage || user?.profile?.profile_picture;

    const handleProfileImageSelect = async (selectedMedia: Media | Media[]) => {
        const selectedImage = Array.isArray(selectedMedia) ? selectedMedia[0] || null : selectedMedia;
        const profilePictureId = selectedImage?.id || null;
        
        try {
            const { adminApi } = await import('@/api/admins/admins');
            
            const updatedUser = await adminApi.updateUserByType(user.id, {
                profile: {
                    profile_picture: profilePictureId,
                }
            }, 'user');
            
            if (updatedUser?.profile?.profile_picture && onProfileImageChange) {
                onProfileImageChange(updatedUser.profile.profile_picture);
            }
            
            await queryClient.invalidateQueries({ queryKey: ['user-profile'] });
            await queryClient.invalidateQueries({ queryKey: ['current-user-profile'] });
            
            const userIdMatch = window.location.pathname.match(/\/users\/(\d+)\//);
            if (userIdMatch) {
                const userId = userIdMatch[1];
                await queryClient.invalidateQueries({ queryKey: ['user', userId] });
            }
            
            showSuccess("عکس پروفایل با موفقیت به‌روزرسانی شد");
        } catch (error) {
            showError("خطا در ذخیره عکس پروفایل");
        } finally {
            setShowMediaSelector(false);
        }
    };

    const handleTabChange = (tab: "select" | "upload") => {
        setActiveTab(tab);
    };

    const handleUploadComplete = () => {
        setActiveTab("select");
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
                    <div className="relative shrink-0 group">
                        {currentProfileImage ? (
                            <div className="w-32 h-32 rounded-xl overflow-hidden border-4 border-card relative">
                                <MediaImage
                                    media={currentProfileImage}
                                    alt="Profile picture"
                                    className="object-cover"
                                    fill
                                />
                            </div>
                        ) : (
                            <div className="w-32 h-32 rounded-xl bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center text-static-w text-4xl font-bold border-4 border-card">
                                {(formData.firstName?.[0] || user.full_name?.[0] || "U")}{(formData.lastName?.[0] || user.full_name?.split(" ")?.[1]?.[0] || "")}
                            </div>
                        )}
                        
                        <Button
                            variant="outline"
                            size="sm"
                            className="absolute -bottom-1 -right-1 h-7 w-7 p-0 rounded-full bg-card border-2 hover:bg-bg transition-colors"
                            onClick={() => setShowMediaSelector(true)}
                        >
                            <Camera className="h-3 w-3" />
                        </Button>
                    </div>
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

            <MediaLibraryModal
                isOpen={showMediaSelector}
                onClose={() => setShowMediaSelector(false)}
                onSelect={handleProfileImageSelect}
                selectMultiple={false}
                initialFileType="image"
                showTabs={true}
                activeTab={activeTab}
                onTabChange={handleTabChange}
                onUploadComplete={handleUploadComplete}
                context="media_library"
            />
        </Card>
    );
}