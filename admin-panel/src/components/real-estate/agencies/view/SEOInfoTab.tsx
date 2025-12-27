import { TabsContent } from "@/components/elements/Tabs";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { MediaImage } from "@/components/media/base/MediaImage";
import { mediaService } from "@/components/media/services";
import { 
  Search, 
  FileText, 
  Image as ImageIcon,
  Globe
} from "lucide-react";

interface SEOInfoTabProps {
  agency: any;
}

export function SEOInfoTab({ agency }: SEOInfoTabProps) {
  const ogImageUrl = agency.og_image?.file_url
    ? mediaService.getMediaUrlFromObject({ file_url: agency.og_image.file_url } as any)
    : "";

  const metaTitle = agency.meta_title || agency.name || "";
  const metaDescription = agency.meta_description || agency.description || "";
  const ogTitle = agency.og_title || metaTitle;
  const ogDescription = agency.og_description || metaDescription;

  return (
    <TabsContent value="seo" className="mt-0">
      <div className="space-y-6">
        <CardWithIcon
          icon={Search}
          title="برچسب‌های Meta"
          iconBgColor="bg-emerald"
          iconColor="stroke-emerald-2"
          borderColor="border-b-emerald-1"
          contentClassName="space-y-6 pt-6"
        >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-font-s">
                  <FileText className="w-4 h-4" />
                  عنوان متا (Meta Title)
                </label>
                <div className="p-4 bg-bg/50 rounded-lg border hover:bg-bg/70 transition-colors min-h-[60px] flex items-start">
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
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-font-s">
                  <FileText className="w-4 h-4" />
                  توضیحات متا (Meta Description)
                </label>
                <div className="p-4 bg-bg/50 rounded-lg border hover:bg-bg/70 transition-colors min-h-[60px] flex items-start">
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
            </div>
        </CardWithIcon>

        <CardWithIcon
          icon={Globe}
          title="Open Graph (شبکه‌های اجتماعی)"
          iconBgColor="bg-blue"
          iconColor="stroke-blue-2"
          borderColor="border-b-blue-1"
          contentClassName="space-y-6 pt-6"
        >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-font-s">
                  <FileText className="w-4 h-4" />
                  عنوان OG
                </label>
                <div className="p-4 bg-bg/50 rounded-lg border hover:bg-bg/70 transition-colors min-h-[60px] flex items-start">
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
                  توضیحات OG
                </label>
                <div className="p-4 bg-bg/50 rounded-lg border hover:bg-bg/70 transition-colors min-h-[60px] flex items-start">
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

            {ogImageUrl && (
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-font-s">
                  <ImageIcon className="w-4 h-4" />
                  تصویر OG
                </label>
                <div className="relative aspect-video max-w-md border rounded-lg overflow-hidden shadow-md">
                  <MediaImage
                    media={{ file_url: ogImageUrl } as any}
                    alt="OG Image"
                    className="object-cover"
                    fill
                  />
                </div>
              </div>
            )}
        </CardWithIcon>
      </div>
    </TabsContent>
  );
}

