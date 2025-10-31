"use client";

import { TabsContent } from "@/components/elements/Tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/elements/Card";
import { Portfolio } from "@/types/portfolio/portfolio";
import { MediaImage } from "@/components/media/base/MediaImage";
import { mediaService } from "@/components/media/services";
import { ExternalLink, FileJson } from "lucide-react";

interface SEOInfoTabProps {
  portfolio: Portfolio;
}

export function SEOInfoTab({ portfolio }: SEOInfoTabProps) {
  const ogImageUrl = portfolio.og_image?.file_url
    ? mediaService.getMediaUrlFromObject({ file_url: portfolio.og_image.file_url } as any)
    : "";

  return (
    <TabsContent value="seo" className="mt-6">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>اطلاعات SEO</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  عنوان متا (Meta Title)
                </label>
                <div className="text-base">
                  {portfolio.meta_title || (
                    <span className="text-muted-foreground italic">
                      وارد نشده است
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  توضیحات متا (Meta Description)
                </label>
                <div className="text-base">
                  {portfolio.meta_description || (
                    <span className="text-muted-foreground italic">
                      وارد نشده است
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  عنوان Open Graph (OG Title)
                </label>
                <div className="text-base">
                  {portfolio.og_title || (
                    <span className="text-muted-foreground italic">
                      وارد نشده است
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  توضیحات Open Graph (OG Description)
                </label>
                <div className="text-base">
                  {portfolio.og_description || (
                    <span className="text-muted-foreground italic">
                      وارد نشده است
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block flex items-center gap-2">
                  <ExternalLink className="w-4 h-4" />
                  آدرس Canonical
                </label>
                <div className="text-base break-all">
                  {portfolio.canonical_url || (
                    <span className="text-muted-foreground italic">
                      وارد نشده است
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Robots Meta
                </label>
                <div className="text-base">
                  {portfolio.robots_meta || (
                    <span className="text-muted-foreground italic">
                      وارد نشده است
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-6 border-t">
              <label className="text-sm font-medium text-muted-foreground mb-4 block">
                تصویر Open Graph (OG Image)
              </label>
              {ogImageUrl ? (
                <div className="relative w-full max-w-md aspect-video border rounded-lg overflow-hidden">
                  <MediaImage
                    media={{ file_url: ogImageUrl } as any}
                    alt="OG Image"
                    className="object-cover"
                    fill
                  />
                </div>
              ) : (
                <div className="text-base text-muted-foreground italic">
                  تصویری آپلود نشده است
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {(portfolio.structured_data || portfolio.hreflang_data) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileJson className="w-5 h-5" />
                داده‌های ساختاریافته
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {portfolio.structured_data && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Structured Data (Schema.org)
                  </label>
                  <pre className="text-xs bg-muted p-4 rounded-lg overflow-x-auto">
                    {JSON.stringify(portfolio.structured_data, null, 2)}
                  </pre>
                </div>
              )}

              {portfolio.hreflang_data && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Hreflang Data
                  </label>
                  <pre className="text-xs bg-muted p-4 rounded-lg overflow-x-auto">
                    {JSON.stringify(portfolio.hreflang_data, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </TabsContent>
  );
}

