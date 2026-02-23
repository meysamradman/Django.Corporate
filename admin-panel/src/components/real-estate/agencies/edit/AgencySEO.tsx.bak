import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Input } from "@/components/elements/Input";
import { Textarea } from "@/components/elements/Textarea";
import { FormField } from "@/components/shared/FormField";
import type { UseFormReturn } from "react-hook-form";
import type { AgencyFormValues } from "@/components/real-estate/validations/agencySchema";
import { Search, Globe } from "lucide-react";

interface SEOTabProps {
  form: UseFormReturn<AgencyFormValues>;
  editMode: boolean;
  fieldErrors?: Record<string, string>;
}

export default function AgencySEO({
  form,
  editMode,
  fieldErrors = {},
}: SEOTabProps) {
  const { register, formState: { errors } } = form;

  return (
    <div className="space-y-6">
      <CardWithIcon
        icon={Search}
        title="برچسب‌های Meta"
        iconBgColor="bg-emerald"
        iconColor="stroke-emerald-2"
        cardBorderColor="border-b-emerald-1"
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
        </div>
      </CardWithIcon>

      <CardWithIcon
        icon={Globe}
        title="Open Graph"
        iconBgColor="bg-pink"
        iconColor="stroke-pink-2"
        cardBorderColor="border-b-pink-1"
        className="hover:shadow-lg transition-all duration-300"
      >
        <div className="space-y-4">
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
        icon={Search}
        title="تنظیمات پیشرفته SEO"
        iconBgColor="bg-indigo"
        iconColor="stroke-indigo-2"
        cardBorderColor="border-b-indigo-1"
        className="hover:shadow-lg transition-all duration-300"
      >
        <div className="space-y-4">
          <FormField
            label="آدرس Canonical"
            htmlFor="canonical_url"
            error={errors.canonical_url?.message || fieldErrors.canonical_url}
            description="آدرس URL اصلی صفحه (برای جلوگیری از محتوای تکراری)"
          >
            <Input
              id="canonical_url"
              type="url"
              placeholder="https://example.com/agency/..."
              disabled={!editMode}
              {...register("canonical_url")}
            />
          </FormField>

          <FormField
            label="Robots Meta"
            htmlFor="robots_meta"
            error={errors.robots_meta?.message || fieldErrors.robots_meta}
            description="دستورات robots برای موتورهای جستجو (مثال: noindex, nofollow)"
          >
            <Input
              id="robots_meta"
              type="text"
              placeholder="index, follow"
              disabled={!editMode}
              {...register("robots_meta")}
            />
          </FormField>
        </div>
      </CardWithIcon>
    </div>
  );
}

