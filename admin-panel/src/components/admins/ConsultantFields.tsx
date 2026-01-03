import type { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/elements/Input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/elements/Select";
import { Textarea } from "@/components/elements/Textarea";
import { Label } from "@/components/elements/Label";
import { Switch } from "@/components/elements/Switch";
import { useQuery } from "@tanstack/react-query";
import { realEstateApi } from "@/api/real-estate/properties";
import { Loader } from "@/components/elements/Loader";
import { CheckCircle2 } from "lucide-react";

interface ConsultantFieldsProps {
  form: UseFormReturn<any>;
  isEdit?: boolean;
}

export default function ConsultantFields({ form }: ConsultantFieldsProps) {
  const { data: agenciesResponse, isLoading: agenciesLoading } = useQuery({
    queryKey: ['agencies-all'],
    queryFn: () => realEstateApi.getAgencies({ page: 1, size: 1000 }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const agencies = agenciesResponse?.data || [];

  return (
    <div className="space-y-6">
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4">اطلاعات مشاور املاک</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* شماره پروانه */}
          <div className="space-y-2">
            <Label htmlFor="license_number" className="text-sm font-medium">
              شماره پروانه <span className="text-red-1">*</span>
            </Label>
            <Input
              id="license_number"
              {...form.register("license_number")}
              placeholder="مثال: 12345"
              className={form.formState.errors.license_number ? "border-red-1" : ""}
            />
            {form.formState.errors.license_number && (
              <p className="text-sm text-red-1">
                {form.formState.errors.license_number.message as string}
              </p>
            )}
          </div>

          {/* تاریخ انقضای پروانه */}
          <div className="space-y-2">
            <Label htmlFor="license_expire_date" className="text-sm font-medium">
              تاریخ انقضای پروانه
            </Label>
            <Input
              id="license_expire_date"
              type="date"
              {...form.register("license_expire_date")}
              className={form.formState.errors.license_expire_date ? "border-red-1" : ""}
            />
            {form.formState.errors.license_expire_date && (
              <p className="text-sm text-red-1">
                {form.formState.errors.license_expire_date.message as string}
              </p>
            )}
          </div>

          {/* آژانس */}
          <div className="space-y-2">
            <Label htmlFor="agency_id" className="text-sm font-medium">
              آژانس املاک
            </Label>
            {agenciesLoading ? (
              <div className="flex items-center justify-center h-10 border rounded-lg">
                <Loader className="size-5" />
              </div>
            ) : (
              <Select
                value={form.watch("agency_id")?.toString() || "none"}
                onValueChange={(value) => {
                  form.setValue("agency_id", value === "none" ? undefined : parseInt(value));
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="انتخاب آژانس (اختیاری)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">بدون آژانس</SelectItem>
                  {agencies.map((agency) => (
                    <SelectItem key={agency.id} value={agency.id.toString()}>
                      {agency.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {form.formState.errors.agency_id && (
              <p className="text-sm text-red-1">
                {form.formState.errors.agency_id.message as string}
              </p>
            )}
          </div>

          {/* تخصص */}
          <div className="space-y-2">
            <Label htmlFor="specialization" className="text-sm font-medium">
              تخصص
            </Label>
            <Input
              id="specialization"
              {...form.register("specialization")}
              placeholder="مثال: مسکونی، تجاری، ویلایی"
              className={form.formState.errors.specialization ? "border-red-1" : ""}
            />
            {form.formState.errors.specialization && (
              <p className="text-sm text-red-1">
                {form.formState.errors.specialization.message as string}
              </p>
            )}
          </div>

          {/* بیوگرافی (full width) */}
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="bio" className="text-sm font-medium">
              بیوگرافی مشاور
            </Label>
            <Textarea
              id="bio"
              {...form.register("bio")}
              placeholder="توضیحات کوتاهی درباره مشاور..."
              rows={4}
              className={form.formState.errors.bio ? "border-red-1" : ""}
            />
            {form.formState.errors.bio && (
              <p className="text-sm text-red-1">
                {form.formState.errors.bio.message as string}
              </p>
            )}
          </div>

          {/* وضعیت تایید */}
          <div className="space-y-2 md:col-span-2">
            <div className="flex items-center justify-between p-4 border rounded-lg bg-blue-0/30">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-blue-2" />
                <div>
                  <Label className="text-sm font-medium">مشاور تایید شده</Label>
                  <p className="text-xs text-gray-2">این مشاور توسط سیستم تایید شده است</p>
                </div>
              </div>
              <Switch
                checked={form.watch("is_verified") || false}
                onCheckedChange={(checked) => form.setValue("is_verified", checked)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* بخش SEO */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4">تنظیمات سئو (اختیاری)</h3>
        <p className="text-sm text-gray-2 mb-4">
          این اطلاعات برای بهبود نمایش پروفایل مشاور در موتورهای جستجو و شبکه‌های اجتماعی استفاده می‌شود.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Meta Title */}
          <div className="space-y-2">
            <Label htmlFor="meta_title" className="text-sm font-medium">
              عنوان متا
            </Label>
            <Input
              id="meta_title"
              {...form.register("meta_title")}
              placeholder="عنوان برای موتورهای جستجو (حداکثر 70 کاراکتر)"
              maxLength={70}
              className={form.formState.errors.meta_title ? "border-red-1" : ""}
            />
            {form.formState.errors.meta_title && (
              <p className="text-sm text-red-1">
                {form.formState.errors.meta_title.message as string}
              </p>
            )}
          </div>

          {/* Meta Keywords */}
          <div className="space-y-2">
            <Label htmlFor="meta_keywords" className="text-sm font-medium">
              کلمات کلیدی
            </Label>
            <Input
              id="meta_keywords"
              {...form.register("meta_keywords")}
              placeholder="کلمات کلیدی (با کاما جدا کنید)"
              maxLength={200}
              className={form.formState.errors.meta_keywords ? "border-red-1" : ""}
            />
            {form.formState.errors.meta_keywords && (
              <p className="text-sm text-red-1">
                {form.formState.errors.meta_keywords.message as string}
              </p>
            )}
          </div>

          {/* Meta Description */}
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="meta_description" className="text-sm font-medium">
              توضیحات متا
            </Label>
            <Textarea
              id="meta_description"
              {...form.register("meta_description")}
              placeholder="توضیحات برای موتورهای جستجو (حداکثر 300 کاراکتر)"
              maxLength={300}
              rows={3}
              className={form.formState.errors.meta_description ? "border-red-1" : ""}
            />
            {form.formState.errors.meta_description && (
              <p className="text-sm text-red-1">
                {form.formState.errors.meta_description.message as string}
              </p>
            )}
          </div>

          {/* OG Title */}
          <div className="space-y-2">
            <Label htmlFor="og_title" className="text-sm font-medium">
              عنوان Open Graph
            </Label>
            <Input
              id="og_title"
              {...form.register("og_title")}
              placeholder="عنوان برای شبکه‌های اجتماعی (حداکثر 70 کاراکتر)"
              maxLength={70}
              className={form.formState.errors.og_title ? "border-red-1" : ""}
            />
            {form.formState.errors.og_title && (
              <p className="text-sm text-red-1">
                {form.formState.errors.og_title.message as string}
              </p>
            )}
          </div>

          {/* Twitter Card Type */}
          <div className="space-y-2">
            <Label htmlFor="twitter_card" className="text-sm font-medium">
              نوع کارت توییتر
            </Label>
            <Select
              value={form.watch("twitter_card") || "none"}
              onValueChange={(value) => {
                form.setValue("twitter_card", value === "none" ? undefined : value as "summary" | "summary_large_image");
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="انتخاب نوع کارت (اختیاری)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">بدون کارت</SelectItem>
                <SelectItem value="summary">خلاصه</SelectItem>
                <SelectItem value="summary_large_image">خلاصه با تصویر بزرگ</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.twitter_card && (
              <p className="text-sm text-red-1">
                {form.formState.errors.twitter_card.message as string}
              </p>
            )}
          </div>

          {/* OG Description */}
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="og_description" className="text-sm font-medium">
              توضیحات Open Graph
            </Label>
            <Textarea
              id="og_description"
              {...form.register("og_description")}
              placeholder="توضیحات برای شبکه‌های اجتماعی (حداکثر 300 کاراکتر)"
              maxLength={300}
              rows={3}
              className={form.formState.errors.og_description ? "border-red-1" : ""}
            />
            {form.formState.errors.og_description && (
              <p className="text-sm text-red-1">
                {form.formState.errors.og_description.message as string}
              </p>
            )}
          </div>

          {/* OG Image - TODO: باید Media Picker اضافه بشه */}
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="og_image_id" className="text-sm font-medium">
              تصویر Open Graph
            </Label>
            <Input
              id="og_image_id"
              type="number"
              {...form.register("og_image_id", { valueAsNumber: true })}
              placeholder="شناسه تصویر (در نسخه بعدی Media Picker اضافه خواهد شد)"
              className={form.formState.errors.og_image_id ? "border-red-1" : ""}
            />
            {form.formState.errors.og_image_id && (
              <p className="text-sm text-red-1">
                {form.formState.errors.og_image_id.message as string}
              </p>
            )}
            <p className="text-xs text-gray-2">در نسخه بعدی، انتخابگر تصویر اضافه خواهد شد</p>
          </div>
        </div>
      </div>
    </div>
  );
}
