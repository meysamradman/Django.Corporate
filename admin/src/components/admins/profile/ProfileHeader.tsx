"use client";

import Image from "next/image";
import { Card, CardContent } from "@/components/elements/Card";
import { Button } from "@/components/elements/Button";
import { CheckCircle2, XCircle, Smartphone, Camera, Clock, Shield } from "lucide-react";
import { AdminWithProfile } from "@/types/auth/admin";
import { MediaImage } from "@/components/media/base/MediaImage";
import { MediaLibraryModal } from "@/components/media/modals/MediaLibraryModal";
import { Media } from "@/types/shared/media";
import { useState, useEffect } from "react";
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/core/auth/AuthContext';
import { toast } from '@/components/elements/Sonner';
import { adminApi } from '@/api/admins/route';
import { Role } from '@/types/auth/permission';

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
    const [adminRoles, setAdminRoles] = useState<Role[]>([]);
    const queryClient = useQueryClient();
    const { refreshUser } = useAuth();

    // Load admin roles
    useEffect(() => {
        if (admin?.id) {
            loadAdminRoles();
        }
    }, [admin?.id]);

    const loadAdminRoles = async () => {
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
        } catch (error) {
            console.error("Error loading admin roles:", error);
        }
    };

    // Use formData.profileImage first (updated immediately), then fallback to admin profile
    const currentProfileImage = formData.profileImage || admin?.profile?.profile_picture;
    
    // Debug logs
    console.log("🔍 ProfileHeader Debug:", {
        "formData.profileImage": formData.profileImage,
        "admin?.profile?.profile_picture": admin?.profile?.profile_picture,
        "currentProfileImage": currentProfileImage,
        "formData.profileImage?.id": formData.profileImage?.id,
        "admin?.profile?.profile_picture?.id": admin?.profile?.profile_picture?.id,
    });

    const handleProfileImageSelect = async (selectedMedia: Media | Media[]) => {
        console.log("📸 handleProfileImageSelect called:", selectedMedia);
        
        if (onProfileImageChange) {
            const selectedImage = Array.isArray(selectedMedia) ? selectedMedia[0] || null : selectedMedia;
            console.log("🎯 Selected image:", selectedImage);
            
            onProfileImageChange(selectedImage);
            
            // خودکار ذخیره عکس پروفایل
            try {
                const profilePictureId = Array.isArray(selectedMedia) ? selectedMedia[0]?.id || null : selectedMedia?.id || null;
                console.log("💾 Saving profile picture with ID:", profilePictureId);
                
                // Import adminApi dynamically
                const { adminApi } = await import('@/api/admins/route');
                
                await adminApi.updateProfile({
                    profile_picture: profilePictureId,
                } as any);
                
                console.log("✅ Profile picture saved successfully");
                
                // Invalidate admin profile cache to refresh the page
                await queryClient.invalidateQueries({ queryKey: ['admin-profile'] });
                await queryClient.invalidateQueries({ queryKey: ['current-admin-profile'] });
                await queryClient.refetchQueries({ queryKey: ['admin-profile'] });
                
                // Invalidate the specific admin query by ID (from the edit page)
                const adminIdMatch = window.location.pathname.match(/\/admins\/(\d+)\//);
                if (adminIdMatch) {
                    const adminId = adminIdMatch[1];
                    await queryClient.invalidateQueries({ queryKey: ['admin', adminId] });
                    await queryClient.refetchQueries({ queryKey: ['admin', adminId] });
                    console.log(`🔄 Query cache invalidated for admin ${adminId}`);
                }
                
                console.log("🔄 Query cache invalidated");
                
                // Refresh AuthContext to update user data everywhere
                await refreshUser();
                
                console.log("🔄 AuthContext refreshed");
                
                // Show success message
                toast.success("عکس پروفایل با موفقیت به‌روزرسانی شد");
            } catch (error) {
                console.error("❌ Error saving profile picture:", error);
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
                    priority
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
                                    sizes="128px"
                                />
                            </div>
                        ) : (
                            <div className="w-32 h-32 rounded-xl bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center text-static-w border-4 border-card">
                                <span>
                                    {(formData.firstName?.[0] || admin.full_name?.[0] || "U")}{(formData.lastName?.[0] || admin.full_name?.split(" ")?.[1]?.[0] || "")}
                                </span>
                            </div>
                        )}
                        
                        {/* دکمه تغییر عکس پروفایل */}
                        <Button
                            variant="outline"
                            size="sm"
                            className="absolute -bottom-1 -right-1 h-7 w-7 p-0 rounded-full bg-card border-2 border-border hover:bg-bg transition-colors"
                            onClick={() => setShowMediaSelector(true)}
                        >
                            <Camera className="h-3 w-3" />
                        </Button>
                    </div>
                    <div className="flex-1 pt-16 pb-2">
                        <h2>
                            {formData.firstName && formData.lastName
                                ? `${formData.firstName} ${formData.lastName}`
                                : admin.full_name || "نام کاربری"
                            }
                        </h2>
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-font-s mt-3">
                            <div className="flex items-center gap-2">
                                <div className={`flex items-center justify-center w-9 h-9 rounded-full p-2 ${
                                    admin.is_active ? "bg-green" : "bg-yellow"
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
