import type { UseFormReturn } from "react-hook-form";
import { useState } from "react";
import { Input } from "@/components/elements/Input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/elements/Select";
import { Textarea } from "@/components/elements/Textarea";
import { Label } from "@/components/elements/Label";
import { Switch } from "@/components/elements/Switch";
import { Button } from "@/components/elements/Button";
import { useQuery } from "@tanstack/react-query";
import { realEstateApi } from "@/api/real-estate/properties";
import { Loader } from "@/components/elements/Loader";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { FormField } from "@/components/forms/FormField";
import { PersianDatePicker } from "@/components/elements/PersianDatePicker";
import { MediaLibraryModal } from "@/components/media/modals/MediaLibraryModal";
import { mediaService } from "@/components/media/services";
import type { Media } from "@/types/shared/media";
import {
  Globe,
  CheckCircle2,
  BadgeCheck,
  UploadCloud,
  X
} from "lucide-react";

interface ConsultantFieldsProps {
  form: UseFormReturn<any>;
  isEdit?: boolean;
}

export default function ConsultantFields({ form }: ConsultantFieldsProps) {
  const { register, formState: { errors }, watch, setValue } = form;
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);

  const { data: agenciesResponse, isLoading: agenciesLoading } = useQuery({
    queryKey: ['agencies-all'],
    queryFn: () => realEstateApi.getAgencies({ page: 1, size: 1000 }),
    staleTime: 5 * 60 * 1000,
  });

  const agencies = agenciesResponse?.data || [];

  const ogImageValue = watch("og_image");
  const ogImageUrl = ogImageValue ? mediaService.getMediaUrlFromObject(ogImageValue) : "";

  const handleOgImageSelect = (media: Media | Media[] | null) => {
    const selected = Array.isArray(media) ? media[0] || null : media;
    setValue("og_image", selected);
    setValue("og_image_id", selected?.id || null);
    setIsMediaModalOpen(false);
  };

  const handleRemoveOgImage = () => {
    setValue("og_image", null);
    setValue("og_image_id", null);
  };

  return (
    <div className="space-y-8">
      {/* 1. اطلاعات حرفه‌ای مشاور */}
      <CardWithIcon
        icon={BadgeCheck}
        title="اطلاعات حرفه‌ای مشاور"
        iconBgColor="bg-blue-1"
        iconColor="text-white"
        borderColor="border-b-blue-1"
        className="bg-blue-0/10 shadow-sm border-blue-1/20"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            label="شماره پروانه کسب"
            htmlFor="license_number"
            error={errors.license_number?.message as string}
            required
          >
            <Input
              id="license_number"
              placeholder="مثال: ۱۲۳۴۵"
              {...register("license_number")}
            />
          </FormField>

          <FormField
            label="تاریخ انقضای پروانه"
            htmlFor="license_expire_date"
            error={errors.license_expire_date?.message as string}
          >
            <PersianDatePicker
              value={watch("license_expire_date") || ""}
              onChange={(date) => setValue("license_expire_date", date)}
              placeholder="تاریخ انقضا را انتخاب کنید"
            />
          </FormField>

          <FormField
            label="آژانس املاک همکار"
            htmlFor="agency_id"
            error={errors.agency_id?.message as string}
          >
            {agenciesLoading ? (
              <div className="flex items-center justify-center h-9 border border-br rounded-md bg-card">
                <Loader className="size-5" />
              </div>
            ) : (
              <Select
                value={watch("agency_id")?.toString() || "none"}
                onValueChange={(value) => {
                  setValue("agency_id", value === "none" ? undefined : parseInt(value));
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="انتخاب آژانس (اختیاری)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">بدون آژانس (فعالیت مستقل)</SelectItem>
                  {agencies.map((agency) => (
                    <SelectItem key={agency.id} value={agency.id.toString()}>
                      {agency.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </FormField>

          <FormField
            label="تخصص اصلی (دسته بندی)"
            htmlFor="specialization"
            error={errors.specialization?.message as string}
          >
            <Input
              id="specialization"
              placeholder="مثال: مسکونی، اداری، مشارکت در ساخت"
              {...register("specialization")}
            />
          </FormField>

          <div className="md:col-span-2">
            <FormField
              label="بیوگرافی و سوابق فعالیت"
              htmlFor="bio"
              error={errors.bio?.message as string}
            >
              <Textarea
                id="bio"
                placeholder="توضیحات کوتاهی درباره تجربه و سوابق کاری مشاور..."
                rows={4}
                {...register("bio")}
              />
            </FormField>
          </div>

          <div className="md:col-span-2 mt-2">
            <div className="flex items-center justify-between p-5 border-2 border-dashed border-blue-1/30 rounded-2xl bg-white/50 backdrop-blur-sm shadow-inner transition-all hover:bg-white hover:border-blue-1/50 group">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-blue-1/10 text-blue-1 group-hover:bg-blue-1 group-hover:text-white transition-colors">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <Label className="text-base font-bold text-font-p block">احراز هویت و تایید در سیستم</Label>
                  <p className="text-xs text-font-s mt-1">با تایید این بخش، نشان "مشاور تایید شده" در پروفایل نمایش داده می‌شود</p>
                </div>
              </div>
              <Switch
                checked={watch("is_verified") || false}
                onCheckedChange={(checked) => setValue("is_verified", checked)}
              />
            </div>
          </div>
        </div>
      </CardWithIcon>

      {/* 2. تنظیمات سئو و نمایش پروفایل */}
      <CardWithIcon
        icon={Globe}
        title="تنظیمات سئو و نمایش پروفایل"
        iconBgColor="bg-amber-1"
        iconColor="text-white"
        borderColor="border-b-amber-1"
        className="bg-amber-0/10 shadow-sm border-amber-1/20"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2 lg:col-span-1 space-y-6">
            <FormField
              label="عنوان سئو (Meta Title)"
              htmlFor="meta_title"
              error={errors.meta_title?.message as string}
            >
              <Input
                id="meta_title"
                placeholder="عنوان صفحه در گوگل (مثلاً: مشاور املاک - نام مشاور)"
                maxLength={70}
                {...register("meta_title")}
              />
            </FormField>

            <FormField
              label="کلمات کلیدی (Keywords)"
              htmlFor="meta_keywords"
              error={errors.meta_keywords?.message as string}
            >
              <Input
                id="meta_keywords"
                placeholder="کلمات کلیدی با کاما (,) جدا شوند"
                maxLength={200}
                {...register("meta_keywords")}
              />
            </FormField>

            <FormField
              label="توضیحات متا (Meta Description)"
              htmlFor="meta_description"
              error={errors.meta_description?.message as string}
            >
              <Textarea
                id="meta_description"
                placeholder="توضیحات کوتاه برای نمایش در نتایج جستجوی گوگل..."
                rows={3}
                {...register("meta_description")}
              />
            </FormField>
          </div>

          <div className="md:col-span-2 lg:col-span-1">
            <div className="space-y-4">
              <Label className="text-sm font-medium">تصویر اشتراک‌گذاری (OG Image)</Label>
              {ogImageValue && ogImageUrl ? (
                <div className="relative w-full aspect-video rounded-xl overflow-hidden group border-2 border-amber-1/20 shadow-sm">
                  <img
                    src={ogImageUrl}
                    alt="OG Image"
                    className="object-cover w-full h-full"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsMediaModalOpen(true)}
                      className="mx-1"
                    >
                      تغییر تصویر
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={handleRemoveOgImage}
                      className="mx-1"
                    >
                      <X className="w-4 h-4" />
                      حذف
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => setIsMediaModalOpen(true)}
                  className="relative flex flex-col items-center justify-center w-full aspect-video p-6 border-2 border-dashed border-amber-1/30 rounded-xl cursor-pointer hover:bg-amber-1/5 hover:border-amber-1/50 transition-all group"
                >
                  <div className="p-4 rounded-full bg-amber-1/10 text-amber-1 group-hover:scale-110 transition-transform">
                    <UploadCloud className="w-8 h-8" />
                  </div>
                  <p className="mt-3 font-medium text-amber-1">انتخاب تصویر OG</p>
                  <p className="text-xs text-font-s mt-1 text-center">
                    تصویر مناسب برای اشتراک در شبکه‌های اجتماعی
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="md:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-amber-1/10">
              <FormField
                label="عنوان اشتراک گذاری (OG Title)"
                htmlFor="og_title"
                error={errors.og_title?.message as string}
              >
                <Input
                  id="og_title"
                  placeholder="عنوان در زمان اشتراک در تلگرام، واتس‌اپ و..."
                  {...register("og_title")}
                />
              </FormField>

              <FormField
                label="توضیحات اشتراک گذاری (OG Description)"
                htmlFor="og_description"
                error={errors.og_description?.message as string}
              >
                <Textarea
                  id="og_description"
                  placeholder="توضیحات کوتاه برای اشتراک گذاری در شبکه‌های اجتماعی..."
                  rows={3}
                  {...register("og_description")}
                />
              </FormField>
            </div>
          </div>
        </div>
      </CardWithIcon>

      <MediaLibraryModal
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        onSelect={handleOgImageSelect}
        selectMultiple={false}
        initialFileType="image"
        context="media_library"
      />
    </div>
  );
}
