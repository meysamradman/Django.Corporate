
import type { Property } from "@/types/real_estate/realEstate";
import { MediaImage } from "@/components/media/base/MediaImage";
import { mediaService } from "@/components/media/services";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/elements/Card";
import {
    Image as ImageIcon,
    Search,
    Globe
} from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";

interface RealEstateSEOProps {
    property: Property;
}

export function RealEstateSEO({ property }: RealEstateSEOProps) {
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
        <Card className="gap-0 overflow-hidden">
            <CardHeader className="border-b">
                <CardTitle>تنظیمات سئو و رسانه‌های اجتماعی</CardTitle>
            </CardHeader>
            <CardContent className={!hasSEO ? "p-0" : ""}>
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
                    <div className="flex flex-col h-full gap-5">
                        <Card className="flex-1 bg-bg border-br/40 shadow-xs group transition-smooth hover:border-teal-1/30 overflow-hidden relative">
                            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-100 transition-opacity">
                                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-teal-1/10 text-teal-1 text-[10px] font-black">
                                    <Search className="size-3" />
                                    گوگل
                                </div>
                            </div>
                            <CardContent className="p-6 space-y-3 pt-8">
                                <div className="flex items-center gap-3 text-sm text-font-s opacity-80 truncate">
                                    <div className="size-7 bg-wt rounded-full shadow-xs border border-br/30 flex items-center justify-center shrink-0">
                                        <img src="/assets/icons/google.svg" alt="G" className="size-4 opacity-70" onError={(e) => e.currentTarget.style.display = 'none'} />
                                        <Search className="size-4 text-teal-1 absolute" style={{ opacity: 0.1 }} />
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

                    <div className="flex flex-col h-full gap-5">
                        <Card className="flex-1 bg-wt border-br/60 shadow-xs group transition-smooth hover:border-blue-1/20 overflow-hidden min-h-[140px] relative">
                            <div className="absolute top-0 right-0 p-3 z-10 opacity-10 group-hover:opacity-100 transition-opacity">
                                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-blue-1/10 text-blue-1 text-[10px] font-black backdrop-blur-sm">
                                    <Globe className="size-3" />
                                    سوشال
                                </div>
                            </div>
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
            </CardContent>
        </Card>
    );
}
