
import type { Property } from "@/types/real_estate/realEstate";
import { MediaImage } from "@/components/media/base/MediaImage";
import { mediaService } from "@/components/media/services";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Card, CardContent } from "@/components/elements/Card";
import { Item, ItemContent, ItemTitle, ItemMedia } from "@/components/elements/Item";
import {
  Image as ImageIcon,
  Search,
  Globe
} from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";

interface SEOInfoTabProps {
  property: Property;
}

export function RealEstateSEO({ property }: SEOInfoTabProps) {
  const ogImageUrl = property.og_image?.file_url
    ? mediaService.getMediaUrlFromObject({ file_url: property.og_image.file_url } as any)
    : "";

  const hasSEO = property.meta_title || property.meta_description || property.og_title || property.og_description || property.og_image;

  const metaTitle = property.meta_title || property.title || "بدون عنوان سئو";
  const metaDescription = property.meta_description || property.short_description || "بدون توضیحات سئو";
  const ogTitle = property.og_title || metaTitle;
  const ogDescription = property.og_description || metaDescription;
  const canonicalUrl = property.canonical_url || "";

  return (
    <CardWithIcon
      icon={Search}
      title="تنظیمات سئو و رسانه‌های اجتماعی"
      iconBgColor="bg-teal-0"
      iconColor="text-teal-1"
      cardBorderColor="border-b-teal-1"
      className="overflow-hidden"
      contentClassName={!hasSEO ? "p-0" : ""}
    >
      {!hasSEO ? (
        <EmptyState
          title="تنظیمات سئو یافت نشد"
          description="توضیحات متا و پیش‌نمایش شبکه‌های اجتماعی برای این ملک ثبت نشده است"
          icon={Globe}
          size="sm"
          fullBleed={true}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-stretch px-5 py-5">
          {/* Google Preview Section */}
          <div className="flex flex-col h-full gap-5">
            <Item size="sm" className="px-1 py-0 pointer-events-none border-0 bg-transparent">
              <ItemMedia className="size-2 rounded-full bg-teal-1 shadow-[0_0_8px_var(--teal-1)]" />
              <ItemContent>
                <ItemTitle className="text-xs font-black text-font-p tracking-wide">پیش‌نمایش گوگل</ItemTitle>
              </ItemContent>
            </Item>

            <Card className="flex-1 bg-bg border-br/40 shadow-xs group transition-smooth hover:border-teal-1/30 overflow-hidden">
              <CardContent className="p-6 space-y-3">
                <div className="flex items-center gap-3 text-sm text-font-s opacity-80 truncate">
                  <div className="size-7 bg-wt rounded-full shadow-xs border border-br/30 flex items-center justify-center shrink-0">
                    <Search className="size-4 text-teal-1" />
                  </div>
                  <span className="dir-ltr text-left flex-1 truncate font-medium">{canonicalUrl}</span>
                </div>
                <h3 className="text-xl font-medium text-[#1a0dab] group-hover:underline cursor-pointer decoration-2 underline-offset-4 line-clamp-1 leading-normal">
                  {metaTitle}
                </h3>
                <p className="text-base text-[#4d5156] line-clamp-2 leading-relaxed">
                  <span className="font-bold text-font-s opacity-60 ml-2">{new Date().toLocaleDateString('fa-IR')} — </span>
                  {metaDescription}
                </p>
              </CardContent>
            </Card>

          </div>

          {/* Social Preview Section */}
          <div className="flex flex-col h-full gap-5">
            <Item size="sm" className="px-1 py-0 pointer-events-none border-0 bg-transparent">
              <ItemMedia className="size-2 rounded-full bg-blue-1 shadow-[0_0_8px_var(--blue-1)]" />
              <ItemContent>
                <ItemTitle className="text-xs font-black text-font-p tracking-wide">پیش‌نمایش شبکه‌های اجتماعی</ItemTitle>
              </ItemContent>
            </Item>

            <Card className="flex-1 bg-wt border-br/60 shadow-xs group transition-smooth hover:border-blue-1/20 overflow-hidden min-h-[140px]">
              <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] lg:grid-cols-[220px_1fr] h-full items-stretch">
                {ogImageUrl ? (
                  <div className="relative aspect-video sm:aspect-auto overflow-hidden border-b sm:border-b-0 sm:border-l border-br/40 h-full">
                    <MediaImage
                      media={{ file_url: ogImageUrl } as any}
                      alt="Social Preview"
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                      fill
                    />
                  </div>
                ) : (
                  <div className="aspect-video sm:aspect-auto bg-bg/40 flex items-center justify-center border-b sm:border-b-0 sm:border-l border-br/40 h-full">
                    <ImageIcon className="size-9 text-font-s opacity-20" />
                  </div>
                )}

                <div className="p-6 flex flex-col justify-center min-w-0 bg-linear-to-bl from-wt to-bg/5">
                  <h3 className="text-lg font-black text-font-p line-clamp-1 mb-2 leading-snug">
                    {ogTitle}
                  </h3>
                  <p className="text-sm text-font-s line-clamp-2 leading-relaxed opacity-90">
                    {ogDescription}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </CardWithIcon>
  );
}

