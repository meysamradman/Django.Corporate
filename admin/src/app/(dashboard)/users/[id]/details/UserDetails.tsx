"use client";

import { UserWithProfile } from "@/types/auth/user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/elements/Card";
import { Badge } from "@/components/elements/Badge";
import { Separator } from "@/components/elements/Separator";
import { User, Smartphone, Mail, Calendar, MapPin, IdCard, Phone, Image as ImageIcon } from "lucide-react";
import { MediaImage } from "@/components/media/base/MediaImage";
import Image from "next/image";

interface UserDetailsProps {
    userData: UserWithProfile;
}

export function UserDetails({ userData }: UserDetailsProps) {
    return (
        <div className="space-y-6">
            {/* User Header Card */}
            <Card className="overflow-hidden">
                <div className="relative h-40 md:h-56">
                    <Image
                        src="/images/profile-banner.png"
                        alt="Cover image"
                        fill
                        className="object-cover"
                    />
                </div>
                <CardHeader className="relative px-6 pt-0 pb-6">
                    <div className="flex flex-col md:flex-row items-start md:items-end gap-6 -mt-16">
                        <div className="relative shrink-0">
                            {userData.profile?.profile_picture ? (
                                <div className="w-32 h-32 rounded-xl overflow-hidden border-4 border-card relative">
                                    <MediaImage
                                        media={userData.profile.profile_picture}
                                        alt="Profile picture"
                                        className="object-cover"
                                        fill
                                        sizes="128px"
                                    />
                                </div>
                            ) : (
                                <div className="w-32 h-32 rounded-xl bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center text-white text-4xl font-bold border-4 border-card">
                                    {(userData.profile?.first_name?.[0] || userData.full_name?.[0] || "U")}{(userData.profile?.last_name?.[0] || userData.full_name?.split(" ")?.[1]?.[0] || "")}
                                </div>
                            )}
                        </div>
                        <div className="flex-1 pt-16 pb-2">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-2xl font-bold">
                                        {userData.profile?.first_name && userData.profile?.last_name
                                            ? `${userData.profile.first_name} ${userData.profile.last_name}`
                                            : userData.full_name || "نام کاربری"
                                        }
                                    </h2>
                                    <div className="flex flex-wrap items-center gap-2 mt-2">
                                        <Badge variant={userData.is_active ? "default" : "red"}>
                                            {userData.is_active ? "فعال" : "غیرفعال"}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground mt-3">
                                <div className="flex items-center gap-2">
                                    <Smartphone className="w-5 h-5" />
                                    <span>{userData.mobile || "موبایل وارد نشده"}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-5 h-5" />
                                    <span>عضویت از {userData.created_at ? new Date(userData.created_at).toLocaleDateString('fa-IR') : "نامشخص"}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* User Information Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Personal Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="w-5 h-5" />
                            اطلاعات شخصی
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-muted-foreground">نام</p>
                                <p className="font-medium">{userData.profile?.first_name || "وارد نشده"}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">نام خانوادگی</p>
                                <p className="font-medium">{userData.profile?.last_name || "وارد نشده"}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">تاریخ تولد</p>
                                <p className="font-medium">
                                    {userData.profile?.birth_date 
                                        ? new Date(userData.profile.birth_date).toLocaleDateString('fa-IR') 
                                        : "وارد نشده"}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">کد ملی</p>
                                <p className="font-medium">{userData.profile?.national_id || "وارد نشده"}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Contact Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Phone className="w-5 h-5" />
                            اطلاعات تماس
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-muted-foreground">موبایل</p>
                                <p className="font-medium">{userData.mobile || "وارد نشده"}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">ایمیل</p>
                                <p className="font-medium">{userData.email || "وارد نشده"}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">تلفن</p>
                                <p className="font-medium">{userData.profile?.phone || "وارد نشده"}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Location Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MapPin className="w-5 h-5" />
                            اطلاعات موقعیت
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-muted-foreground">استان</p>
                                <p className="font-medium">{userData.profile?.province?.name || "وارد نشده"}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">شهر</p>
                                <p className="font-medium">{userData.profile?.city?.name || "وارد نشده"}</p>
                            </div>
                            <div className="md:col-span-2">
                                <p className="text-sm text-muted-foreground">آدرس</p>
                                <p className="font-medium">{userData.profile?.address || "وارد نشده"}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Additional Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <IdCard className="w-5 h-5" />
                            اطلاعات تکمیلی
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="text-sm text-muted-foreground">بیوگرافی</p>
                            <p className="font-medium">{userData.profile?.bio || "وارد نشده"}</p>
                        </div>
                        <Separator />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-muted-foreground">آخرین بروزرسانی</p>
                                <p className="font-medium">{userData.updated_at ? new Date(userData.updated_at).toLocaleDateString('fa-IR') : "نامشخص"}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">وضعیت</p>
                                <p className="font-medium">
                                    <Badge variant={userData.is_active ? "default" : "red"}>
                                        {userData.is_active ? "فعال" : "غیرفعال"}
                                    </Badge>
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}