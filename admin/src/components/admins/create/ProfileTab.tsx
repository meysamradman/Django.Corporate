"use client";

import { Card, CardContent } from "@/components/elements/Card";
import { Input } from "@/components/elements/Input";
import { Label } from "@/components/elements/Label";
import { Textarea } from "@/components/elements/Textarea";
import { MediaImage } from "@/components/media/base/MediaImage";
import { MediaLibraryModal } from "@/components/media/modals/MediaLibraryModal";
import { Button } from "@/components/elements/Button";
import { Media } from "@/types/shared/media";
import { User, Camera } from "lucide-react";
import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { AdminFormValues } from "@/core/validations/adminSchema";

interface ProfileTabProps {
  form: UseFormReturn<AdminFormValues>;
  selectedMedia: Media | null;
  setSelectedMedia: (media: Media | null) => void;
  editMode: boolean;
}

export default function ProfileTab({
  form,
  selectedMedia,
  setSelectedMedia,
  editMode,
}: ProfileTabProps) {
  const { register, formState: { errors } } = form;
  const [showMediaSelector, setShowMediaSelector] = useState(false);
  const [activeTab, setActiveTab] = useState<"select" | "upload">("select");

  const handleProfileImageSelect = async (selectedMedia: Media | Media[]) => {
    if (Array.isArray(selectedMedia)) {
      setSelectedMedia(selectedMedia[0] || null);
    } else {
      setSelectedMedia(selectedMedia);
    }
    setShowMediaSelector(false);
  };

  const handleTabChange = (tab: "select" | "upload") => {
    setActiveTab(tab);
  };

  const handleUploadComplete = () => {
    setActiveTab("select");
  };

  return (
    <div className="mt-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* محتوای اصلی سمت چپ */}
        <div className="flex-1 space-y-6">
          {/* اطلاعات شخصی */}
          <Card>
            <CardContent className="pt-6">
              <div>
                <h3 className="text-lg font-medium mb-4">اطلاعات شخصی</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="profile_first_name">نام (اختیاری)</Label>
                    <Input
                      id="profile_first_name"
                      placeholder="نام"
                      disabled={!editMode}
                      className={errors.profile_first_name ? "border-destructive" : ""}
                      {...register("profile_first_name")}
                    />
                    {errors.profile_first_name && (
                      <p className="text-xs text-destructive">{errors.profile_first_name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="profile_last_name">نام خانوادگی (اختیاری)</Label>
                    <Input
                      id="profile_last_name"
                      placeholder="نام خانوادگی"
                      disabled={!editMode}
                      className={errors.profile_last_name ? "border-destructive" : ""}
                      {...register("profile_last_name")}
                    />
                    {errors.profile_last_name && (
                      <p className="text-xs text-destructive">{errors.profile_last_name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="profile_birth_date">تاریخ تولد (اختیاری)</Label>
                    <Input
                      id="profile_birth_date"
                      type="date"
                      disabled={!editMode}
                      {...register("profile_birth_date")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="profile_national_id">کد ملی (اختیاری)</Label>
                    <Input
                      id="profile_national_id"
                      placeholder="کد ملی 10 رقمی"
                      maxLength={10}
                      disabled={!editMode}
                      className={errors.profile_national_id ? "border-destructive" : ""}
                      {...register("profile_national_id")}
                    />
                    {errors.profile_national_id && (
                      <p className="text-xs text-destructive">{errors.profile_national_id.message}</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* آدرس */}
          <Card>
            <CardContent className="pt-6">
              <div>
                <h3 className="text-lg font-medium mb-4">آدرس</h3>
                <div className="space-y-2">
                  <Label htmlFor="profile_address">آدرس کامل (اختیاری)</Label>
                  <Textarea
                    id="profile_address"
                    placeholder="آدرس کامل محل سکونت یا محل کار"
                    rows={3}
                    disabled={!editMode}
                    className={errors.profile_address ? "border-destructive" : ""}
                    {...register("profile_address")}
                  />
                  {errors.profile_address && (
                    <p className="text-xs text-destructive">{errors.profile_address.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* بیوگرافی */}
          <Card>
            <CardContent className="pt-6">
              <div>
                <h3 className="text-lg font-medium mb-4">بیوگرافی</h3>
                <div className="space-y-2">
                  <Label htmlFor="profile_bio">بیوگرافی (اختیاری)</Label>
                  <Textarea
                    id="profile_bio"
                    placeholder="توضیحات کوتاه درباره ادمین"
                    rows={4}
                    disabled={!editMode}
                    className={errors.profile_bio ? "border-destructive" : ""}
                    {...register("profile_bio")}
                  />
                  {errors.profile_bio && (
                    <p className="text-xs text-destructive">{errors.profile_bio.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* سایدبار سمت راست - عکس پروفایل */}
        <div className="lg:w-80 flex-shrink-0">
          <Card className="sticky top-6">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center space-y-4">
                <div className="relative shrink-0 group">
                  {selectedMedia ? (
                    <div className="w-64 h-64 rounded-xl overflow-hidden border-4 border-card relative">
                      <MediaImage
                        media={selectedMedia}
                        alt="تصویر پروفایل"
                        className="object-cover"
                        fill
                        sizes="256px"
                      />
                    </div>
                  ) : (
                    <div className="w-64 h-64 rounded-xl bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center text-white text-4xl font-bold border-4 border-card">
                      <User className="w-32 h-32" strokeWidth={1.5} />
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
                
                <div className="text-center space-y-1 text-sm text-muted-foreground">
                  <p>حداکثر 5 مگابایت</p>
                  <p>JPG، PNG یا WEBP</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

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
    </div>
  );
}
