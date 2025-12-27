import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Input } from "@/components/elements/Input";
import { Textarea } from "@/components/elements/Textarea";
import { FormField } from "@/components/forms/FormField";
import type { UseFormReturn } from "react-hook-form";
import type { AgencyFormValues } from "@/pages/admins/agencies/create/page";
import { Settings, Globe, MapPin } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/elements/Select";
import type { ProvinceCompact, CityCompact } from "@/types/shared/location";
import { locationApi } from "@/api/shared/location/location";
import { useState, useEffect } from "react";

interface SettingsTabProps {
  form: UseFormReturn<AgencyFormValues>;
  editMode: boolean;
  fieldErrors?: Record<string, string>;
  handleInputChange?: (field: string, value: any) => void;
}

export default function SettingsTab({
  form,
  editMode,
  fieldErrors = {},
  handleInputChange
}: SettingsTabProps) {
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
    <div className="space-y-6">
      <CardWithIcon
        icon={MapPin}
        title="اطلاعات مکانی"
        iconBgColor="bg-primary/10"
        iconColor="stroke-primary"
        borderColor="border-b-primary"
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
        </div>

        <div className="mt-4">
          <FormField
            label="آدرس کامل"
            htmlFor="address"
            error={errors.address?.message || fieldErrors.address}
          >
            <Textarea
              id="address"
              placeholder="آدرس کامل آژانس"
              disabled={!editMode}
              rows={3}
              {...register("address")}
            />
          </FormField>
        </div>
      </CardWithIcon>

      <CardWithIcon
        icon={Settings}
        title="اطلاعات آماری"
        iconBgColor="bg-primary/10"
        iconColor="stroke-primary"
        borderColor="border-b-primary"
        className="hover:shadow-lg transition-all duration-300"
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            label="رتبه (0-5)"
            htmlFor="rating"
            error={errors.rating?.message || fieldErrors.rating}
          >
            <Input
              id="rating"
              type="number"
              step="0.1"
              min="0"
              max="5"
              placeholder="4.5"
              disabled={!editMode}
              {...register("rating", {
                valueAsNumber: true,
                min: 0,
                max: 5
              })}
            />
          </FormField>

          <FormField
            label="تعداد نظرات"
            htmlFor="total_reviews"
            error={errors.total_reviews?.message || fieldErrors.total_reviews}
          >
            <Input
              id="total_reviews"
              type="number"
              min="0"
              placeholder="0"
              disabled={!editMode}
              {...register("total_reviews", {
                valueAsNumber: true,
                min: 0
              })}
            />
          </FormField>
        </div>
      </CardWithIcon>

      <CardWithIcon
        icon={Globe}
        title="SEO و شبکه‌های اجتماعی"
        iconBgColor="bg-primary/10"
        iconColor="stroke-primary"
        borderColor="border-b-primary"
        className="hover:shadow-lg transition-all duration-300"
      >
        <div className="space-y-4">
          <FormField
            label="عنوان متا"
            htmlFor="meta_title"
            error={errors.meta_title?.message || fieldErrors.meta_title}
            description="عنوان صفحه برای موتورهای جستجو (60 کاراکتر)"
          >
            <Input
              id="meta_title"
              type="text"
              placeholder="آژانس املاک ..."
              disabled={!editMode}
              maxLength={60}
              {...register("meta_title")}
            />
          </FormField>

          <FormField
            label="توضیحات متا"
            htmlFor="meta_description"
            error={errors.meta_description?.message || fieldErrors.meta_description}
            description="توضیحات صفحه برای موتورهای جستجو (160 کاراکتر)"
          >
            <Textarea
              id="meta_description"
              placeholder="توضیحات آژانس املاک..."
              disabled={!editMode}
              maxLength={160}
              rows={3}
              {...register("meta_description")}
            />
          </FormField>

          <FormField
            label="عنوان Open Graph"
            htmlFor="og_title"
            error={errors.og_title?.message || fieldErrors.og_title}
            description="عنوان برای اشتراک‌گذاری در شبکه‌های اجتماعی"
          >
            <Input
              id="og_title"
              type="text"
              placeholder="آژانس املاک ..."
              disabled={!editMode}
              {...register("og_title")}
            />
          </FormField>

          <FormField
            label="توضیحات Open Graph"
            htmlFor="og_description"
            error={errors.og_description?.message || fieldErrors.og_description}
            description="توضیحات برای اشتراک‌گذاری در شبکه‌های اجتماعی"
          >
            <Textarea
              id="og_description"
              placeholder="توضیحات آژانس برای اشتراک‌گذاری..."
              disabled={!editMode}
              rows={2}
              {...register("og_description")}
            />
          </FormField>
        </div>
      </CardWithIcon>

      <CardWithIcon
        icon={Settings}
        title="توضیحات تکمیلی"
        iconBgColor="bg-primary/10"
        iconColor="stroke-primary"
        borderColor="border-b-primary"
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
  );
}
