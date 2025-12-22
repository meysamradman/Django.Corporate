import { Card, CardContent } from "@/components/elements/Card";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Input } from "@/components/elements/Input";
import { FormField } from "@/components/forms/FormField";
import { Textarea } from "@/components/elements/Textarea";
import { ImageSelector } from "@/components/media/selectors/ImageSelector";
import type { Media } from "@/types/shared/media";
import { UserCircle, MapPin, FileText } from "lucide-react";
import { useState, useEffect } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { UserFormValues } from "@/components/users/validations/userSchema";
import { PersianDatePicker } from "@/components/elements/PersianDatePicker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/elements/Select";
import { locationApi } from "@/api/shared/location/location";
import type { ProvinceCompact, CityCompact } from "@/types/shared/location";
import { filterNumericOnly } from "@/core/filters/numeric";

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
  const [provinces, setProvinces] = useState<ProvinceCompact[]>([]);
  const [cities, setCities] = useState<CityCompact[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  const birthDateValue = watch("profile_birth_date");
  const provinceIdValue = watch("profile_province_id");
  const cityIdValue = watch("profile_city_id");
  
  useEffect(() => {
    const fetchProvinces = async () => {
      setLoadingProvinces(true);
      try {
        const provinces = await locationApi.getProvincesCompact();
        setProvinces(provinces);
      } catch (error) {
      } finally {
        setLoadingProvinces(false);
      }
    };

    fetchProvinces();
  }, []);

  useEffect(() => {
    if (provinceIdValue) {
      const fetchCities = async () => {
        setLoadingCities(true);
        try {
          const cities = await locationApi.getCitiesCompactByProvince(provinceIdValue);
          setCities(cities);
        } catch (error) {
        } finally {
          setLoadingCities(false);
        }
      };

      fetchCities();
    } else {
      setCities([]);
    }
  }, [provinceIdValue]);

  const handleProfileImageSelect = (selectedMedia: Media | null) => {
    setSelectedMedia(selectedMedia);
  };

  const handleBirthDateChange = (dateString: string) => {
    setValue("profile_birth_date", dateString);
  };
  
  const handleProvinceChange = (provinceId: string) => {
    const id = parseInt(provinceId, 10);
    if (!isNaN(id)) {
      setValue("profile_province_id", id);
    } else {
      setValue("profile_province_id", null);
    }
    setValue("profile_city_id", null);
  };
  
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
                    {...register("profile_national_id", {
                      onChange: (e) => {
                        const filteredValue = filterNumericOnly(e.target.value);
                        e.target.value = filteredValue;
                        form.setValue("profile_national_id", filteredValue);
                      }
                    })}
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
                    {...register("profile_phone", {
                      onChange: (e) => {
                        const filteredValue = filterNumericOnly(e.target.value);
                        e.target.value = filteredValue;
                        form.setValue("profile_phone", filteredValue);
                      }
                    })}
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

        <div className="lg:w-80 flex-shrink-0">
          <Card className="sticky top-6">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center space-y-4">
                <ImageSelector
                  selectedMedia={selectedMedia}
                  onMediaSelect={handleProfileImageSelect}
                  disabled={!editMode}
                  size="lg"
                  context="media_library"
                  alt="تصویر پروفایل"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}