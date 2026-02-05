
import type { Property } from "@/types/real_estate/realEstate";
import { MediaImage } from "@/components/media/base/MediaImage";
import { mediaService } from "@/components/media/services";
import { Badge } from "@/components/elements/Badge";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import {
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Bot,
  Search
} from "lucide-react";

interface SEOInfoTabProps {
  property: Property;
}

export function RealEstateSEO({ property }: SEOInfoTabProps) {
  const ogImageUrl = property.og_image?.file_url
    ? mediaService.getMediaUrlFromObject({ file_url: property.og_image.file_url } as any)
    : "";

  const metaTitle = property.meta_title || property.title || "";
  const metaDescription = property.meta_description || property.short_description || "";
  const ogTitle = property.og_title || metaTitle;
  const ogDescription = property.og_description || metaDescription;

  const seoFields = [
    {
      icon: FileText,
      label: "Meta Title",
      value: metaTitle,
      type: "text" as const,
    },
    {
      icon: FileText,
      label: "Meta Description",
      value: metaDescription,
      type: "text" as const,
    },
    {
      icon: ExternalLink,
      label: "Canonical URL",
      value: property.canonical_url,
      type: "url" as const,
    },
    {
      icon: Bot,
      label: "Robots",
      value: property.robots_meta,
      type: "badge" as const,
    },
  ];

  return (
    <CardWithIcon
      icon={Search}
      title="تنظیمات سئو"
      iconBgColor="bg-teal-1/10"
      iconColor="text-teal-1"
      cardBorderColor="border-b-teal-1"
      className=""
      contentClassName=""
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="flex flex-col gap-2">
          <h4 className="text-sm font-bold text-font-s mb-4 border-b border-br/50 pb-2 inline-block">Meta Tags</h4>
          {seoFields.map((field, idx) => (
            <div
              key={idx}
              className="group flex items-start gap-3 p-3 rounded-lg bg-bg/30 border border-br/40 hover:bg-bg/50 hover:border-br transition-all"
            >
              <field.icon className="w-4 h-4 text-font-s mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0 flex flex-col gap-1">
                <div className="text-[10px] font-bold text-font-s tracking-wider">
                  {field.label}
                </div>
                <div className="text-xs text-font-p">
                  {field.value ? (
                    field.type === "badge" ? (
                      <Badge variant="blue" className="text-[10px] font-mono px-2 py-0.5">
                        {field.value}
                      </Badge>
                    ) : field.type === "url" ? (
                      <code className="font-mono text-[10px] break-all opacity-80">
                        {field.value}
                      </code>
                    ) : (
                      <span className="line-clamp-2">{field.value}</span>
                    )
                  ) : (
                    <span className="text-font-s opacity-50 text-[10px]">—</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <h4 className="text-sm font-bold text-font-s mb-4 border-b border-br/50 pb-2 inline-block">Open Graph</h4>
          <div className="p-4 rounded-lg bg-bg/30 border border-br/40 flex flex-col gap-3">
            <div className="flex gap-3">
              {ogImageUrl ? (
                <div className="relative w-24 h-24 shrink-0 rounded-md overflow-hidden border border-br/60 shadow-sm group">
                  <MediaImage
                    media={{ file_url: ogImageUrl } as any}
                    alt="OG Preview"
                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                    fill
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-static-b/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-1 left-1 right-1">
                      <Badge variant="blue" className="text-[8px] px-1.5 py-0.5 bg-static-b/80 text-static-w border-none w-full justify-center">
                        OG
                      </Badge>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative w-24 h-24 shrink-0 rounded-md border-2 border-dashed border-br/40 bg-bg/20 flex items-center justify-center">
                  <ImageIcon className="w-6 h-6 text-font-s opacity-30" />
                </div>
              )}

              <div className="flex-1 min-w-0 flex flex-col gap-2">
                <div className="flex items-start gap-2">
                  <FileText className="w-4 h-4 text-font-s mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[9px] font-bold text-font-s tracking-wider mb-0.5">
                      Title
                    </div>
                    <div className="text-xs text-font-p line-clamp-2 font-medium">
                      {ogTitle || <span className="text-font-s opacity-50 text-[10px]">—</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <FileText className="w-4 h-4 text-font-s mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[9px] font-bold text-font-s tracking-wider mb-0.5">
                      Description
                    </div>
                    <div className="text-xs text-font-p line-clamp-2 opacity-80">
                      {ogDescription || <span className="text-font-s opacity-50 text-[10px]">—</span>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </CardWithIcon>
  );
}

