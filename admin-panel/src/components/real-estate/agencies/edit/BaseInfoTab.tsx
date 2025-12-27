import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Input } from "@/components/elements/Input";
import { Textarea } from "@/components/elements/Textarea";
import { FormField } from "@/components/forms/FormField";
import { Button } from "@/components/elements/Button";
import type { UseFormReturn } from "react-hook-form";
import type { AgencyFormValues } from "@/pages/admins/agencies/create/page";
import { Building2, MapPin, Image as ImageIcon, UploadCloud, X } from "lucide-react";
import { filterNumericOnly } from "@/core/filters/numeric";
import { Item, ItemContent, ItemTitle, ItemDescription, ItemActions } from "@/components/elements/Item";
import { Switch } from "@/components/elements/Switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/elements/Select";
import type { ProvinceCompact, CityCompact } from "@/types/shared/location";
import { locationApi } from "@/api/shared/location/location";
import { mediaService } from "@/components/media/services";
import { useState, useEffect } from "react";

interface BaseInfoTabProps {
  form: UseFormReturn<AgencyFormValues>;
  editMode: boolean;
  agencyData?: any;
  fieldErrors?: Record<string, string>;
  handleInputChange?: (field: string, value: any) => void;
  selectedProfilePicture?: any;
  onProfilePictureSelect?: () => void;
  onProfilePictureRemove?: () => void;
}

export default function BaseInfoTab({
  form,
  editMode,
  agencyData,
  fieldErrors = {},
  handleInputChange,
  selectedProfilePicture,
  onProfilePictureSelect,
  onProfilePictureRemove
}: BaseInfoTabProps) {
  const { register, formState: { errors }, setValue, watch } = form;
  const [provinces, setProvinces] = useState<ProvinceCompact[]>([]);
  const [cities, setCities] = useState<CityCompact[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [selectedProvinceId, setSelectedProvinceId] = useState<number | null>(null);

  const handleChange = (field: string, value: any) => {
    if (handleInputChange) {
      handleInputChange(field, value);
    } else {
      form.setValue(field as any, value);
    }
  };

  // بارگذاری استان‌ها
  useEffect(() => {
    const fetchProvinces = async () => {
      setLoadingProvinces(true);
      try {
        const provincesData = await locationApi.getProvincesCompact();
        setProvinces(provincesData);
        
        // اگر در حالت edit هستیم و province وجود دارد، انتخاب کن
        const currentProvince = watch("province");
        if (currentProvince) {
          setSelectedProvinceId(Number(currentProvince));
        }
      } catch {
      } finally {
        setLoadingProvinces(false);
      }
    };

    fetchProvinces();
  }, []);

  // بارگذاری شهرها بر اساس استان انتخاب شده
  useEffect(() => {
    if (selectedProvinceId) {
      const fetchCities = async () => {
        setLoadingCities(true);
        try {
          const citiesData = await locationApi.getCitiesCompactByProvince(selectedProvinceId);
          setCities(citiesData);
        } catch {
        } finally {
          setLoadingCities(false);
        }
      };

      fetchCities();
    } else {
      setCities([]);
      if (!agencyData) {
        setValue("city", null);
      }
    }
  }, [selectedProvinceId, setValue]);

  const handleProvinceChange = (provinceId: string) => {
    const provinceIdNum = Number(provinceId);
    setSelectedProvinceId(provinceIdNum);
    setValue("province", provinceIdNum);
    setValue("city", null);
    handleChange("province", provinceIdNum);
  };

  const handleCityChange = (cityId: string) => {
    const cityIdNum = Number(cityId);
    setValue("city", cityIdNum);
    handleChange("city", cityIdNum);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="flex-1 min-w-0">
        <div className="space-y-6">
          <CardWithIcon
        icon={Building2}
        title="اطلاعات احراز هویت"
        iconBgColor="bg-primary/10"
        iconColor="stroke-primary"
        borderColor="border-b-primary"
        className="hover:shadow-lg transition-all duration-300"
      >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              label="نام آژانس"
              htmlFor="name"
              error={errors.name?.message || fieldErrors.name}
              required
            >
              <Input
                id="name"
                type="text"
                placeholder="نام آژانس املاک"
                disabled={!editMode}
                {...register("name", {
                  onChange: (e) => handleInputChange && handleInputChange("name", e.target.value)
                })}
              />
            </FormField>

            <FormField
              label="نامک"
              htmlFor="slug"
              error={errors.slug?.message || fieldErrors.slug}
              description="برای نمایش در وب‌سایت"
              required
            >
              <Input
                id="slug"
                type="text"
                placeholder="agency-name"
                disabled={!editMode}
                {...register("slug", {
                  onChange: (e) => handleInputChange && handleInputChange("slug", e.target.value)
                })}
              />
            </FormField>

            <FormField
              label="شماره پروانه"
              htmlFor="license_number"
              error={errors.license_number?.message || fieldErrors.license_number}
            >
              <Input
                id="license_number"
                type="text"
                placeholder="شماره پروانه کسب"
                disabled={!editMode}
                {...register("license_number")}
              />
            </FormField>

            <FormField
              label="شماره موبایل"
              htmlFor="phone"
              error={errors.phone?.message || fieldErrors.phone}
              required
            >
              <Input
                id="phone"
                type="text"
                inputMode="tel"
                placeholder="09xxxxxxxxx"
                disabled={!editMode}
                {...register("phone", {
                  onChange: (e) => {
                    const filteredValue = filterNumericOnly(e.target.value);
                    e.target.value = filteredValue;
                    handleChange("phone", filteredValue);
                  }
                })}
              />
            </FormField>

            <FormField
              label="ایمیل"
              htmlFor="email"
              error={errors.email?.message || fieldErrors.email}
            >
              <Input
                id="email"
                type="email"
                placeholder="example@domain.com"
                disabled={!editMode}
                {...register("email")}
              />
            </FormField>

            <FormField
              label="وب‌سایت"
              htmlFor="website"
              error={errors.website?.message || fieldErrors.website}
            >
              <Input
                id="website"
                type="url"
                placeholder="https://example.com"
                disabled={!editMode}
                {...register("website")}
              />
            </FormField>

            <FormField
              label="تاریخ انقضای پروانه"
              htmlFor="license_expire_date"
              error={errors.license_expire_date?.message || fieldErrors.license_expire_date}
            >
              <Input
                id="license_expire_date"
                type="date"
                disabled={!editMode}
                {...register("license_expire_date")}
              />
            </FormField>
          </div>

          <div className="mt-6 space-y-4">
            <div className="rounded-xl border border-blue-1/40 bg-blue-0/30 hover:border-blue-1/60 transition-colors overflow-hidden">
              <Item variant="default" size="default" className="py-5">
                <ItemContent>
                  <ItemTitle className="text-blue-2">وضعیت فعال</ItemTitle>
                  <ItemDescription>
                    آژانس در لیست نمایش داده شده و امکان رزرو دارد.
                  </ItemDescription>
                </ItemContent>
                <ItemActions>
                  <Switch
                    checked={watch("is_active") ?? true}
                    disabled={!editMode}
                    onCheckedChange={(checked) => setValue("is_active", checked)}
                  />
                </ItemActions>
              </Item>
            </div>

            <div className="rounded-xl border border-green-1/40 bg-green-0/30 hover:border-green-1/60 transition-colors overflow-hidden">
              <Item variant="default" size="default" className="py-5">
                <ItemContent>
                  <ItemTitle className="text-green-2">تأیید شده</ItemTitle>
                  <ItemDescription>
                    آژانس توسط سیستم تأیید شده و نشان تأیید نمایش داده می‌شود.
                  </ItemDescription>
                </ItemContent>
                <ItemActions>
                  <Switch
                    checked={watch("is_verified") ?? false}
                    disabled={!editMode}
                    onCheckedChange={(checked) => setValue("is_verified", checked)}
                  />
                </ItemActions>
              </Item>
            </div>
          </div>
      </CardWithIcon>

      <CardWithIcon
        icon={MapPin}
        title="موقعیت مکانی"
        iconBgColor="bg-purple/10"
        iconColor="stroke-purple"
        borderColor="border-b-purple"
        className="hover:shadow-lg transition-all duration-300"
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            label="استان"
            htmlFor="province"
            error={errors.province?.message || fieldErrors.province}
          >
            <Select
              value={watch("province")?.toString() || ""}
              onValueChange={handleProvinceChange}
              disabled={!editMode || loadingProvinces}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingProvinces ? "در حال بارگذاری..." : "انتخاب استان"} />
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
            htmlFor="city"
            error={errors.city?.message || fieldErrors.city}
          >
            <Select
              value={watch("city")?.toString() || ""}
              onValueChange={handleCityChange}
              disabled={!editMode || !selectedProvinceId || loadingCities}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingCities ? "در حال بارگذاری..." : "انتخاب شهر"} />
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
            htmlFor="address"
            error={errors.address?.message || fieldErrors.address}
            className="md:col-span-2"
          >
            <Input
              id="address"
              type="text"
              placeholder="آدرس کامل آژانس"
              disabled={!editMode}
              {...register("address")}
            />
          </FormField>
        </div>
      </CardWithIcon>

      <CardWithIcon
        icon={Building2}
        title="توضیحات"
        iconBgColor="bg-blue/10"
        iconColor="stroke-blue"
        borderColor="border-b-blue"
        className="hover:shadow-lg transition-all duration-300"
      >
          <FormField
          label="توضیحات آژانس"
          htmlFor="description"
          error={errors.description?.message || fieldErrors.description}
          description="توضیحات کامل درباره آژانس و خدمات آن"
        >
          <Textarea
            id="description"
            placeholder="توضیحات کامل درباره آژانس..."
            disabled={!editMode}
            rows={6}
            {...register("description")}
          />
        </FormField>
      </CardWithIcon>
          </div>
        </div>

        <div className="w-full lg:w-[420px] lg:flex-shrink-0">
          <CardWithIcon
            icon={ImageIcon}
            title="عکس پروفایل"
            iconBgColor="bg-blue"
            iconColor="stroke-blue-2"
            borderColor="border-b-blue-1"
            className="lg:sticky lg:top-20 hover:shadow-lg transition-all duration-300"
          >
            {selectedProfilePicture ? (
              <div className="relative w-full aspect-video rounded-lg overflow-hidden group border">
                <img
                  src={mediaService.getMediaUrlFromObject(selectedProfilePicture)}
                  alt={selectedProfilePicture.alt_text || "عکس پروفایل"}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-static-b/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onProfilePictureSelect}
                    className="mx-1"
                    type="button"
                  >
                    تغییر تصویر
                  </Button>

                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={onProfilePictureRemove}
                    className="mx-1"
                    type="button"
                  >
                    <X className="w-4 h-4" />
                    حذف
                  </Button>
                </div>
              </div>
            ) : (
              <div
                onClick={onProfilePictureSelect}
                className="relative flex flex-col items-center justify-center w-full p-8 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary transition-colors"
              >
                <UploadCloud className="w-12 h-12 text-font-s" />
                <p className="mt-4 text-lg font-semibold">انتخاب عکس پروفایل</p>
                <p className="mt-1 text-sm text-font-s text-center">
                  برای انتخاب از کتابخانه کلیک کنید
                </p>
              </div>
            )}
          </CardWithIcon>
        </div>
      </div>

      <div className="w-full lg:w-[420px] lg:flex-shrink-0">
        <CardWithIcon
          icon={ImageIcon}
          title="عکس پروفایل"
          iconBgColor="bg-blue"
          iconColor="stroke-blue-2"
          borderColor="border-b-blue-1"
          className="lg:sticky lg:top-20 hover:shadow-lg transition-all duration-300"
        >
          {selectedProfilePicture ? (
            <div className="relative w-full aspect-video rounded-lg overflow-hidden group border">
              <img
                src={mediaService.getMediaUrlFromObject(selectedProfilePicture)}
                alt={selectedProfilePicture.alt_text || "عکس پروفایل"}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-static-b/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onProfilePictureSelect}
                  className="mx-1"
                  type="button"
                >
                  تغییر تصویر
                </Button>

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={onProfilePictureRemove}
                  className="mx-1"
                  type="button"
                >
                  <X className="w-4 h-4" />
                  حذف
                </Button>
              </div>
            </div>
          ) : (
            <div
              onClick={onProfilePictureSelect}
              className="relative flex flex-col items-center justify-center w-full p-8 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary transition-colors"
            >
              <UploadCloud className="w-12 h-12 text-font-s" />
              <p className="mt-4 text-lg font-semibold">انتخاب عکس پروفایل</p>
              <p className="mt-1 text-sm text-font-s text-center">
                برای انتخاب از کتابخانه کلیک کنید
              </p>
            </div>
          )}
        </CardWithIcon>
      </div>
    </div>
  );
}

