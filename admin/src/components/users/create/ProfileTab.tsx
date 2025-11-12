"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/elements/Card";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Input } from "@/components/elements/Input";
import { FormField } from "@/components/forms/FormField";
import { Textarea } from "@/components/elements/Textarea";
import { MediaImage } from "@/components/media/base/MediaImage";
import { MediaLibraryModal } from "@/components/media/modals/MediaLibraryModal";
import { Button } from "@/components/elements/Button";
import { Media } from "@/types/shared/media";
import { User, Camera, UserCircle, MapPin, FileText } from "lucide-react";
import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { UserFormValues } from "@/core/validations/userSchema";
import { PersianDatePicker } from "@/components/elements/PersianDatePicker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/elements/Select";
import { locationApi } from "@/api/location/route";
import { useEffect } from "react";
import { ProvinceCompact, CityCompact } from "@/types/shared/location";

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

interface ProfileTabProps {
  form: UseFormReturn<UserFormValues>;
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
  const { register, formState: { errors }, setValue, watch } = form;
  const [showMediaSelector, setShowMediaSelector] = useState(false);
  const [activeTab, setActiveTab] = useState<"select" | "upload">("select");
  const [provinces, setProvinces] = useState<ProvinceCompact[]>([]);
  const [cities, setCities] = useState<CityCompact[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  // Watch the birth date field and location fields
  const birthDateValue = watch("profile_birth_date");
  const provinceIdValue = watch("profile_province_id");
  const cityIdValue = watch("profile_city_id");
  
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
    if (provinceIdValue) {
      const fetchCities = async () => {
        setLoadingCities(true);
        try {
          const cities = await locationApi.getCitiesCompactByProvince(provinceIdValue);
          setCities(cities);
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
  }, [provinceIdValue]);

  const handleProfileImageSelect = async (selectedMedia: Media | Media[]) => {
    if (Array.isArray(selectedMedia)) {
      setSelectedMedia(selectedMedia[0] || null);
    } else {
      setSelectedMedia(selectedMedia);
    }
    setShowMediaSelector(false);
    
    // Auto-save profile picture if in edit mode
    if (editMode && selectedMedia) {
      try {
        const profilePictureId = Array.isArray(selectedMedia) ? selectedMedia[0]?.id || null : selectedMedia?.id || null;
        
        // Import adminApi dynamically
        const { adminApi } = await import('@/api/admins/route');
        
        // Get user ID from form data or context
        const userId = form.getValues('id') || form.getValues('user_id');
        if (userId) {
          await adminApi.updateUserByType(userId, {
            profile: {
              profile_picture: profilePictureId,
            }
          }, 'user');
          
          // Show success message
          const { toast } = await import('@/components/elements/Sonner');
          toast.success("عکس پروفایل با موفقیت به‌روزرسانی شد");
        }
      } catch (error) {
        console.error("Error saving profile picture:", error);
        const { toast } = await import('@/components/elements/Sonner');
        toast.error("خطا در ذخیره عکس پروفایل");
      }
    }
  };

  const handleTabChange = (tab: "select" | "upload") => {
    setActiveTab(tab);
  };

  const handleUploadComplete = () => {
    setActiveTab("select");
  };

  // Handle birth date change
  const handleBirthDateChange = (dateString: string) => {
    setValue("profile_birth_date", dateString);
  };
  
  // Handle province change
  const handleProvinceChange = (provinceId: string) => {
    const id = parseInt(provinceId, 10);
    if (!isNaN(id)) {
      setValue("profile_province_id", id);
    } else {
      setValue("profile_province_id", null);
    }
    setValue("profile_city_id", null); // Reset city when province changes
  };
  
  // Handle city change
  const handleCityChange = (cityId: string) => {
    const id = parseInt(cityId, 10);
    if (!isNaN(id)) {
      setValue("profile_city_id", id);
    } else {
      setValue("profile_city_id", null);
    }
  };

  return (
    <div>
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 space-y-6">
          <CardWithIcon
            icon={UserCircle}
            title="اطلاعات شخصی"
            iconBgColor="bg-blue"
            iconColor="stroke-blue-2"
            borderColor="border-b-blue-1"
            className="hover:shadow-lg transition-all duration-300"
          >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  label="نام"
                  htmlFor="profile_first_name"
                  error={errors.profile_first_name?.message}
                >
                  <Input
                    id="profile_first_name"
                    placeholder="نام"
                    disabled={!editMode}
                    {...register("profile_first_name")}
                  />
                </FormField>

                <FormField
                  label="نام خانوادگی"
                  htmlFor="profile_last_name"
                  error={errors.profile_last_name?.message}
                >
                  <Input
                    id="profile_last_name"
                    placeholder="نام خانوادگی"
                    disabled={!editMode}
                    {...register("profile_last_name")}
                  />
                </FormField>

                <FormField
                  label="تاریخ تولد"
                  htmlFor="profile_birth_date"
                >
                  <PersianDatePicker
                    value={birthDateValue || ""}
                    onChange={handleBirthDateChange}
                    placeholder="تاریخ تولد را انتخاب کنید"
                    disabled={!editMode}
                  />
                </FormField>

                <FormField
                  label="کد ملی"
                  htmlFor="profile_national_id"
                  error={errors.profile_national_id?.message}
                >
                  <Input
                    id="profile_national_id"
                    type="text"
                    inputMode="numeric"
                    placeholder="کد ملی 10 رقمی"
                    maxLength={10}
                    disabled={!editMode}
                    {...register("profile_national_id")}
                    onKeyDown={preventNonNumeric}
                    onPaste={preventNonNumericPaste}
                  />
                </FormField>
                
                <FormField
                  label="تلفن"
                  htmlFor="profile_phone"
                  error={errors.profile_phone?.message}
                >
                  <Input
                    id="profile_phone"
                    type="text"
                    inputMode="tel"
                    placeholder="تلفن ثابت"
                    disabled={!editMode}
                    {...register("profile_phone")}
                    onKeyDown={preventNonNumeric}
                    onPaste={preventNonNumericPaste}
                  />
                </FormField>
              </div>
          </CardWithIcon>
          
          <CardWithIcon
            icon={MapPin}
            title="موقعیت جغرافیایی"
            iconBgColor="bg-green"
            iconColor="stroke-green-2"
            borderColor="border-b-green-1"
            className="hover:shadow-lg transition-all duration-300"
          >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  label="استان"
                  htmlFor="profile_province_id"
                >
                  <Select
                    value={provinceIdValue ? provinceIdValue.toString() : ""}
                    onValueChange={handleProvinceChange}
                    disabled={!editMode || loadingProvinces}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={loadingProvinces ? "در حال بارگذاری..." : "استان خود را انتخاب کنید"} />
                    </SelectTrigger>
                    <SelectContent>
                      {provinces.map((province) => (
                        <SelectItem key={province.id} value={province.id.toString()}>
                          {province.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>

                <FormField
                  label="شهر"
                  htmlFor="profile_city_id"
                >
                  <Select
                    value={cityIdValue ? cityIdValue.toString() : ""}
                    onValueChange={handleCityChange}
                    disabled={!editMode || loadingCities || !provinceIdValue}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={
                        !provinceIdValue 
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
                        <SelectItem key={city.id} value={city.id.toString()}>
                          {city.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
                
                <FormField
                  label="آدرس"
                  htmlFor="profile_address"
                  error={errors.profile_address?.message}
                  className="md:col-span-2"
                >
                  <Textarea
                    id="profile_address"
                    placeholder="آدرس کامل محل سکونت یا محل کار"
                    rows={3}
                    disabled={!editMode}
                    {...register("profile_address")}
                  />
                </FormField>
              </div>
          </CardWithIcon>

          <CardWithIcon
            icon={FileText}
            title="بیوگرافی"
            iconBgColor="bg-purple"
            iconColor="stroke-purple-2"
            borderColor="border-b-purple-1"
            className="hover:shadow-lg transition-all duration-300"
          >
              <FormField
                label="بیوگرافی"
                htmlFor="profile_bio"
                error={errors.profile_bio?.message}
              >
                <Textarea
                  id="profile_bio"
                  placeholder="توضیحات کوتاه درباره کاربر"
                  rows={4}
                  disabled={!editMode}
                  {...register("profile_bio")}
                />
              </FormField>
          </CardWithIcon>

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
                    <div className="w-64 h-64 rounded-xl bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center text-static-w text-4xl font-bold border-4 border-card">
                      <User className="w-32 h-32" strokeWidth={1.5} />
                    </div>
                  )}
                  
                  {/* دکمه تغییر عکس پروفایل */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute -bottom-1 -right-1 h-7 w-7 p-0 rounded-full bg-card border-2 hover:bg-bg transition-colors"
                    onClick={() => setShowMediaSelector(true)}
                  >
                    <Camera className="h-3 w-3" />
                  </Button>
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