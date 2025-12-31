import { Card, CardContent } from "@/components/elements/Card";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Input } from "@/components/elements/Input";
import { Textarea } from "@/components/elements/Textarea";
import { FormField } from "@/components/forms/FormField";
import { ImageSelector } from "@/components/media/selectors/ImageSelector";
import type { Media } from "@/types/shared/media";
import type { UseFormReturn } from "react-hook-form";
import type { AgencyFormValues } from "@/pages/admins/agencies/create/page";
import { Building2, MapPin, FileText } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/elements/Select";
import type { ProvinceCompact, CityCompact } from "@/types/shared/location";
import { locationApi } from "@/api/shared/location/location";
import { useState, useEffect } from "react";

interface ProfileTabProps {
  form: UseFormReturn<AgencyFormValues>;
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
  const [selectedProvinceId, setSelectedProvinceId] = useState<number | null>(null);

  const handleLogoSelect = (selectedMedia: Media | null) => {
    setSelectedMedia(selectedMedia);
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
      setValue("city", null);
    }
  }, [selectedProvinceId, setValue]);

  const handleProvinceChange = (provinceId: string) => {
    const provinceIdNum = Number(provinceId);
    setSelectedProvinceId(provinceIdNum);
    setValue("province", provinceIdNum);
    setValue("city", null);
  };

  const handleCityChange = (cityId: string) => {
    const cityIdNum = Number(cityId);
    setValue("city", cityIdNum);
  };

  return (
    <div>
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 space-y-6">
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
                htmlFor="province"
                error={errors.province?.message}
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
                error={errors.city?.message}
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
                error={errors.address?.message}
                className="md:col-span-2"
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
            icon={Building2}
            title="اطلاعات تکمیلی"
            iconBgColor="bg-blue"
            iconColor="stroke-blue-2"
            borderColor="border-b-blue-1"
            className="hover:shadow-lg transition-all duration-300"
          >
            <div className="space-y-4">
              <FormField
                label="وب‌سایت"
                htmlFor="website"
                error={errors.website?.message}
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
                label="توضیحات آژانس"
                htmlFor="description"
                error={errors.description?.message}
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
            </div>
          </CardWithIcon>
        </div>

        <div className="lg:w-80 flex-shrink-0">
          <Card className="sticky top-6">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center space-y-4">
                <ImageSelector
                  selectedMedia={selectedMedia}
                  onMediaSelect={handleLogoSelect}
                  disabled={!editMode}
                  size="lg"
                  context="media_library"
                  alt="لوگوی آژانس"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
