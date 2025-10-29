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
                    <Label htmlFor="profile_first_name">نام</Label>
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
                    <Label htmlFor="profile_last_name">نام خانوادگی</Label>
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
                    <Label htmlFor="profile_birth_date">تاریخ تولد</Label>
                    <PersianDatePicker
                      value={birthDateValue || ""}
                      onChange={handleBirthDateChange}
                      placeholder="تاریخ تولد را انتخاب کنید"
                      disabled={!editMode}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="profile_national_id">کد ملی</Label>
                    <Input
                      id="profile_national_id"
                      type="text"
                      inputMode="numeric"
                      placeholder="کد ملی 10 رقمی"
                      maxLength={10}
                      disabled={!editMode}
                      className={errors.profile_national_id ? "border-destructive" : ""}
                      {...register("profile_national_id")}
                      onKeyDown={preventNonNumeric}
                      onPaste={preventNonNumericPaste}
                    />
                    {errors.profile_national_id && (
                      <p className="text-xs text-destructive">{errors.profile_national_id.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="profile_phone">تلفن</Label>
                    <Input
                      id="profile_phone"
                      type="text"
                      inputMode="tel"
                      placeholder="تلفن ثابت"
                      disabled={!editMode}
                      className={errors.profile_phone ? "border-destructive" : ""}
                      {...register("profile_phone")}
                      onKeyDown={preventNonNumeric}
                      onPaste={preventNonNumericPaste}
                    />
                    {errors.profile_phone && (
                      <p className="text-xs text-destructive">{errors.profile_phone.message}</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* استان و شهر */}
          <Card>
            <CardContent className="pt-6">
              <div>
                <h3 className="text-lg font-medium mb-4">موقعیت جغرافیایی</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="profile_province_id">استان</Label>
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
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="profile_city_id">شهر</Label>
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
                  </div>
                  
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="profile_address">آدرس</Label>
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
              </div>
            </CardContent>
          </Card>

          {/* بیوگرافی */}
          <Card>
            <CardContent className="pt-6">
              <div>
                <h3 className="text-lg font-medium mb-4">بیوگرافی</h3>
                <div className="space-y-2">
                  <Label htmlFor="profile_bio">بیوگرافی</Label>
                  <Textarea
                    id="profile_bio"
                    placeholder="توضیحات کوتاه درباره کاربر"
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