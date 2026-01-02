import { Card, CardContent } from "@/components/elements/Card";
import type { Property } from "@/types/real_estate/realEstate";
import { MediaImage } from "@/components/media/base/MediaImage";
import { mediaService } from "@/components/media/services";
import { TruncatedText } from "@/components/elements/TruncatedText";
import {
  CheckCircle2,
  XCircle,
  Star,
  Hash,
  Link as LinkIcon,
  Clock,
  FileText,
  Zap,
} from "lucide-react";

interface PropertySidebarProps {
  property: Property;
}

export function PropertySidebar({ property }: PropertySidebarProps) {
  const mainImageUrl = property.main_image?.file_url || property.main_image?.url
    ? mediaService.getMediaUrlFromObject({ file_url: property.main_image.file_url || property.main_image.url } as any)
    : null;

  const formatDate = (dateString: string) => {
    if (!dateString) return "نامشخص";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  return (
    <div className="w-full space-y-6 sticky top-20 transition-all duration-300 ease-in-out self-start">
      <Card className="overflow-hidden">
        <CardContent className="pt-0 pb-0">
          <div className="pb-2">
            <div className="relative w-full aspect-video rounded-xl overflow-hidden border shadow-md">
              {mainImageUrl ? (
                <MediaImage
                  media={{ file_url: mainImageUrl } as any}
                  alt={property.title}
                  className="object-cover"
                  fill
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-1 to-blue-2 flex items-center justify-center text-static-w text-5xl font-bold">
                  {property.title?.[0]?.toUpperCase() || "P"}
                </div>
              )}
            </div>
          </div>

          <div className="pb-6 pt-2 border-b -mx-6 px-6">
            <div className="grid grid-cols-2 gap-3">
              <div className={`flex flex-col items-center justify-center py-4 px-3 rounded-lg transition-colors ${property.is_published ? "bg-green" : "bg-yellow"
                }`}>
                <div className={`flex items-center justify-center w-9 h-9 rounded-full mb-2 ${property.is_published ? "bg-green-0" : "bg-yellow-0"
                  }`}>
                  {property.is_published ? (
                    <CheckCircle2 className="w-4 h-4 stroke-green-2" />
                  ) : (
                    <XCircle className="w-4 h-4 stroke-yellow-2" />
                  )}
                </div>
                <span className={`text-sm font-medium ${property.is_published ? "text-green-2" : "text-yellow-2"
                  }`}>
                  {property.is_published ? "منتشر شده" : "پیش‌نویس"}
                </span>
              </div>
              <div className={`flex flex-col items-center justify-center py-4 px-3 rounded-lg transition-colors ${property.is_active ? "bg-blue" : "bg-red"
                }`}>
                <div className={`flex items-center justify-center w-9 h-9 rounded-full mb-2 ${property.is_active ? "bg-blue-0" : "bg-red-0"
                  }`}>
                  <Zap className={`w-4 h-4 ${property.is_active ? "stroke-blue-2" : "stroke-red-2"
                    }`} />
                </div>
                <span className={`text-sm font-medium ${property.is_active ? "text-blue-2" : "text-red-2"
                  }`}>
                  {property.is_active ? "فعال" : "غیرفعال"}
                </span>
              </div>
              <div className={`flex flex-col items-center justify-center py-4 px-3 rounded-lg transition-colors ${property.is_featured ? "bg-orange" : "bg-gray"
                }`}>
                <div className={`flex items-center justify-center w-9 h-9 rounded-full mb-2 ${property.is_featured ? "bg-orange-0" : "bg-gray-0"
                  }`}>
                  <Star className={`w-4 h-4 ${property.is_featured ? "stroke-orange-2 fill-orange-2" : "stroke-gray-1"
                    }`} />
                </div>
                <span className={`text-sm font-medium ${property.is_featured ? "text-orange-2" : "text-gray-1"
                  }`}>
                  {property.is_featured ? "ویژه" : "عادی"}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 pb-4">
            <div className="space-y-5">
              <div>
                <h4 className="mb-4 text-font-p">اطلاعات پایه</h4>
                <div className="space-y-0 [&>div:not(:last-child)]:border-b">
                  <div className="flex items-center justify-between gap-3 pb-3">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-font-s flex-shrink-0" />
                      <label>عنوان:</label>
                    </div>
                    <div className="flex-1 ms-2 text-left min-w-0 overflow-hidden">
                      <TruncatedText
                        text={property.title}
                        maxLength={40}
                        className="text-font-p"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 py-3">
                    <div className="flex items-center gap-2">
                      <Hash className="w-4 h-4 text-font-s flex-shrink-0" />
                      <label>شناسه:</label>
                    </div>
                    <p className="text-font-p text-left">
                      #{property.id}
                    </p>
                  </div>

                  {property.property_type && (
                    <div className="flex items-center justify-between gap-3 py-3">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-font-s flex-shrink-0" />
                        <label>نوع ملک:</label>
                      </div>
                      <div className="flex-1 ms-2 text-left min-w-0 overflow-hidden">
                        <TruncatedText
                          text={property.property_type.title || "-"}
                          maxLength={35}
                          className="text-font-p"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-3 py-3">
                    <div className="flex items-center gap-2">
                      <LinkIcon className="w-4 h-4 text-font-s flex-shrink-0" />
                      <label>نامک:</label>
                    </div>
                    <div className="flex-1 ms-2 text-left min-w-0 overflow-hidden">
                      <TruncatedText
                        text={property.slug || "-"}
                        maxLength={35}
                        className="font-mono text-font-p"
                      />
                    </div>
                  </div>

                  {property.created_at && (
                    <div className="flex items-center justify-between gap-3 pt-3">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-font-s flex-shrink-0" />
                        <label>تاریخ ایجاد:</label>
                      </div>
                      <p className="text-font-p text-left">
                        {formatDate(property.created_at)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

