"use client";

import Image from "next/image";
import { Card, CardContent } from "@/components/elements/Card";
import { Button } from "@/components/elements/Button";
import { CheckCircle2, XCircle, Smartphone, CalendarDays, Camera } from "lucide-react";
import { AdminWithProfile } from "@/types/auth/admin";
import { MediaImage } from "@/components/media/base/MediaImage";
import { MediaLibraryModal } from "@/components/media/modals/MediaLibraryModal";
import { Media } from "@/types/shared/media";
import { useState } from "react";

interface ProfileHeaderProps {
    admin: AdminWithProfile;
    formData: {
        firstName: string;
        lastName: string;
        mobile: string;
        profileImage?: Media | null;
    };
    onProfileImageChange?: (media: Media | null) => void;
}

export function ProfileHeader({ admin, formData, onProfileImageChange }: ProfileHeaderProps) {
    const [showMediaSelector, setShowMediaSelector] = useState(false);
    const [activeTab, setActiveTab] = useState<"select" | "upload">("select");

    const handleProfileImageSelect = async (selectedMedia: Media | Media[]) => {
        if (onProfileImageChange) {
            if (Array.isArray(selectedMedia)) {
                onProfileImageChange(selectedMedia[0] || null);
            } else {
                onProfileImageChange(selectedMedia);
            }
            
            // خودکار ذخیره عکس پروفایل
            try {
                const profilePictureId = Array.isArray(selectedMedia) ? selectedMedia[0]?.id || null : selectedMedia?.id || null;
                
                // Import adminApi dynamically
                const { adminApi } = await import('@/api/admins/route');
                await adminApi.updateProfile({
                    profile_picture: profilePictureId,
                } as any);
                
                // Show success message
                const { toast } = await import('@/components/elements/Sonner');
                toast.success("عکس پروفایل با موفقیت به‌روزرسانی شد");
            } catch (error) {
                const { toast } = await import('@/components/elements/Sonner');
                toast.error("خطا در ذخیره عکس پروفایل");
            }
        }
        setShowMediaSelector(false);
    };

    const handleTabChange = (tab: "select" | "upload") => {
        setActiveTab(tab);
    };

    const handleUploadComplete = () => {
        // بعد از آپلود، تب انتخاب را فعال کن
        setActiveTab("select");
    };

    return (
        <Card className="overflow-hidden p-0">
            <div className="relative h-40 md:h-56">
                <Image
                    src="/images/profile-banner.png"
                    alt="Cover image"
                    fill
                    className="object-cover"
                />
            </div>
            <CardContent className="relative px-6 pt-0 pb-6">
                <div className="flex items-end gap-6 -mt-16">
                    <div className="relative shrink-0 group">
                        {formData.profileImage ? (
                            <div className="w-32 h-32 rounded-xl overflow-hidden border-4 border-card relative">
                                <MediaImage
                                    media={formData.profileImage}
                                    alt="Profile picture"
                                    className="object-cover"
                                    fill
                                    sizes="128px"
                                />
                            </div>
                        ) : (
                            <div className="w-32 h-32 rounded-xl bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center text-white text-4xl font-bold border-4 border-card">
                                {(formData.firstName?.[0] || admin.full_name?.[0] || "U")}{(formData.lastName?.[0] || admin.full_name?.split(" ")?.[1]?.[0] || "")}
                            </div>
                        )}
                        
                        {/* دکمه تغییر عکس پروفایل */}
                        <Button
                            variant="outline"
                            size="sm"
                            className="absolute -bottom-1 -right-1 h-7 w-7 p-0 rounded-full bg-background border-2 border-border hover:bg-muted transition-colors"
                            onClick={() => setShowMediaSelector(true)}
                        >
                            <Camera className="h-3 w-3" />
                        </Button>
                    </div>
                    <div className="flex-1 pt-16 pb-2">
                        <h2 className="text-2xl font-bold">
                            {formData.firstName && formData.lastName
                                ? `${formData.firstName} ${formData.lastName}`
                                : admin.full_name || "نام کاربری"
                            }
                        </h2>
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground mt-3">
                            <div className="flex items-center gap-2">
                                {admin.is_active ? (
                                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                                ) : (
                                    <XCircle className="w-5 h-5 text-red-500" />
                                )}
                                <span>{admin.is_active ? "فعال" : "غیرفعال"}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Smartphone className="w-5 h-5" />
                                <span>{formData.mobile || admin.mobile || "موبایل وارد نشده"}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CalendarDays className="w-5 h-5" />
                                <span>عضویت از {admin.created_at ? new Date(admin.created_at).toLocaleDateString('fa-IR') : "نامشخص"}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>

            {/* MediaLibraryModal برای تغییر عکس پروفایل */}
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
            />
        </Card>
    );
}
