"use client";

import { TabsContent } from "@/components/elements/Tabs";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Portfolio } from "@/types/portfolio/portfolio";
import { MediaImage } from "@/components/media/base/MediaImage";
import { mediaService } from "@/components/media/services";
import { Badge } from "@/components/elements/Badge";
import { 
  ExternalLink, 
  Search, 
  FileText, 
  Image as ImageIcon,
  Globe,
  Bot,
  Eye
} from "lucide-react";

interface SEOInfoTabProps {
  portfolio: Portfolio;
}

export function SEOInfoTab({ portfolio }: SEOInfoTabProps) {
  const ogImageUrl = portfolio.og_image?.file_url
    ? mediaService.getMediaUrlFromObject({ file_url: portfolio.og_image.file_url } as any)
    : "";

  const metaTitle = portfolio.meta_title || portfolio.title || "";
  const metaDescription = portfolio.meta_description || portfolio.short_description || "";
  const ogTitle = portfolio.og_title || metaTitle;
  const ogDescription = portfolio.og_description || metaDescription;

  return (
    <TabsContent value="seo" className="mt-0">
      <div className="space-y-6">
        {/* Meta Tags Section */}
        <CardWithIcon
          icon={Search}
          title="برچسب‌های Meta"
          iconBgColor="bg-green"
          iconColor="stroke-green-2"
          borderColor="border-b-green-1"
          contentClassName="space-y-6 pt-6"
        >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Meta Title */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-font-s">
                  <FileText className="w-4 h-4" />
                  عنوان متا (Meta Title)
                </label>
                <div className="p-4 bg-bg/50 rounded-lg border border-br hover:bg-bg/70 transition-colors min-h-[60px] flex items-start">
                  {metaTitle ? (
                    <div className="font-medium text-font-p line-clamp-2">
                      {metaTitle}
                    </div>
                  ) : (
                    <span className="text-font-s">
                      وارد نشده است
                    </span>
                  )}
                </div>
              </div>

              {/* Meta Description */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-font-s">
                  <FileText className="w-4 h-4" />
                  توضیحات متا (Meta Description)
                </label>
                <div className="p-4 bg-bg/50 rounded-lg border border-br hover:bg-bg/70 transition-colors min-h-[60px] flex items-start">
                  {metaDescription ? (
                    <div className="text-font-p line-clamp-3">
                      {metaDescription}
                    </div>
                  ) : (
                    <span className="text-font-s">
                      وارد نشده است
                    </span>
                  )}
                </div>
              </div>

              {/* Canonical URL */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-font-s">
                  <ExternalLink className="w-4 h-4" />
                  آدرس Canonical
                </label>
                <div className="p-4 bg-bg/50 rounded-lg border border-br hover:bg-bg/70 transition-colors min-h-[60px] flex items-start">
                  {portfolio.canonical_url ? (
                    <div className="font-mono text-sm text-font-p break-all">
                      {portfolio.canonical_url}
                    </div>
                  ) : (
                    <span className="text-font-s">
                      وارد نشده است
                    </span>
                  )}
                </div>
              </div>

              {/* Robots Meta */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-font-s">
                  <Bot className="w-4 h-4" />
                  Robots Meta
                </label>
                <div className="p-4 bg-bg/50 rounded-lg border border-br hover:bg-bg/70 transition-colors min-h-[60px] flex items-center">
                  {portfolio.robots_meta ? (
                    <Badge variant="blue" className="font-mono">
                      {portfolio.robots_meta}
                    </Badge>
                  ) : (
                    <span className="text-font-s">
                      وارد نشده است
                    </span>
                  )}
                </div>
              </div>
            </div>
        </CardWithIcon>

        {/* Open Graph Preview Section */}
        <CardWithIcon
          icon={Globe}
          title="پیش‌نمایش Open Graph"
          iconBgColor="bg-blue"
          iconColor="stroke-blue-2"
          borderColor="border-b-blue-1"
          contentClassName="pt-6"
        >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              {/* OG Title & Description - Left Side */}
              <div className="lg:col-span-2 space-y-6">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-font-s">
                    <FileText className="w-4 h-4" />
                    عنوان Open Graph
                  </label>
                  <div className="p-4 bg-bg/50 rounded-lg border border-br hover:bg-bg/70 transition-colors min-h-[60px] flex items-start">
                    {ogTitle ? (
                      <div className="font-medium text-font-p line-clamp-2">
                        {ogTitle}
                      </div>
                    ) : (
                      <span className="text-font-s">
                        وارد نشده است
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-font-s">
                    <FileText className="w-4 h-4" />
                    توضیحات Open Graph
                  </label>
                  <div className="p-4 bg-bg/50 rounded-lg border border-br hover:bg-bg/70 transition-colors min-h-[60px] flex items-start">
                    {ogDescription ? (
                      <div className="text-font-p line-clamp-3">
                        {ogDescription}
                      </div>
                    ) : (
                      <span className="text-font-s">
                        وارد نشده است
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* OG Image Preview - Right Side */}
              <div className="lg:col-span-1 space-y-3">
                <label className="flex items-center gap-2 text-font-s">
                  <ImageIcon className="w-4 h-4" />
                  تصویر Open Graph (OG Image)
                </label>
                {ogImageUrl ? (
                  <div className="relative aspect-video rounded-lg overflow-hidden border border-br shadow-md group hover:shadow-lg transition-all duration-300 bg-bg/20">
                    <MediaImage
                      media={{ file_url: ogImageUrl } as any}
                      alt="OG Image Preview"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      fill
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-static-b/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute bottom-2 left-2 right-2">
                        <div className="flex items-center gap-1.5 text-static-w">
                          <Eye className="w-3.5 h-3.5" />
                          <span className="text-xs">پیش‌نمایش در شبکه‌های اجتماعی</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="relative aspect-video rounded-lg border-2 border-dashed border-br bg-bg/30 flex items-center justify-center group hover:bg-bg/50 transition-colors">
                    <div className="text-center space-y-2">
                      <div className="inline-flex p-3 bg-bg rounded-full">
                        <ImageIcon className="w-6 h-6 text-font-s" />
                      </div>
                      <div className="text-sm text-font-s">
                        تصویری آپلود نشده است
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
        </CardWithIcon>
      </div>
    </TabsContent>
  );
}

