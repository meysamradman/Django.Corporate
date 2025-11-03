"use client";

import { Card, CardContent } from "@/components/elements/Card";
import { Badge } from "@/components/elements/Badge";
import { Portfolio } from "@/types/portfolio/portfolio";
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
  Send,
  Zap,
} from "lucide-react";

interface PortfolioSidebarProps {
  portfolio: Portfolio;
}

export function PortfolioSidebar({ portfolio }: PortfolioSidebarProps) {
  const mainImageUrl = portfolio.main_image?.file_url
    ? mediaService.getMediaUrlFromObject({ file_url: portfolio.main_image.file_url } as any)
    : null;

  const allMedia = portfolio.portfolio_media || [];
  const imagesCount = allMedia.filter(
    (item: any) => (item.media_detail || item.media)?.media_type === "image"
  ).length;
  const videosCount = allMedia.filter(
    (item: any) => (item.media_detail || item.media)?.media_type === "video"
  ).length;
  const audiosCount = allMedia.filter(
    (item: any) => (item.media_detail || item.media)?.media_type === "audio"
  ).length;
  const documentsCount = allMedia.filter(
    (item: any) => (item.media_detail || item.media)?.media_type === "document"
  ).length;

  const formatDate = (dateString: string) => {
    if (!dateString) return "نامشخص";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  const isActive = portfolio.is_active ?? (portfolio.status === "published");

  return (
    <div className="w-full space-y-6 sticky top-20 transition-all duration-300 ease-in-out self-start">
      <Card className="overflow-hidden">
        <CardContent className="pt-0 pb-0">
          <div className="pb-2">
            <div className="relative w-full aspect-video rounded-xl overflow-hidden border shadow-md">
              {mainImageUrl ? (
                <MediaImage
                  media={{ file_url: mainImageUrl } as any}
                  alt={portfolio.title}
                  className="object-cover"
                  fill
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-5xl font-bold">
                  {portfolio.title?.[0]?.toUpperCase() || "P"}
                </div>
              )}
            </div>
          </div>

          <div className="pb-6 pt-2 border-b -mx-6 px-6">
            <div className="grid grid-cols-3 gap-3">
              <div className={`flex flex-col items-center justify-center py-4 px-3 rounded-lg transition-colors ${
                portfolio.status === "published" ? "bg-green-50 dark:bg-green-950/20" : "bg-yellow-50 dark:bg-yellow-950/20"
              }`}>
                <div className={`flex items-center justify-center w-9 h-9 rounded-full mb-2 ${
                  portfolio.status === "published" ? "bg-green-100 dark:bg-green-900/30" : "bg-yellow-100 dark:bg-yellow-900/30"
                }`}>
                  {portfolio.status === "published" ? (
                    <CheckCircle2 className="w-4 h-4 stroke-green-600 dark:stroke-green-400" />
                  ) : (
                    <XCircle className="w-4 h-4 stroke-yellow-600 dark:stroke-yellow-400" />
                  )}
                </div>
                <span className={`text-sm font-medium ${
                  portfolio.status === "published" ? "text-green-600 dark:text-green-400" : "text-yellow-600 dark:text-yellow-400"
                }`}>
                  {portfolio.status === "published" ? "منتشر شده" : "پیش‌نویس"}
                </span>
              </div>
              <div className={`flex flex-col items-center justify-center py-4 px-3 rounded-lg transition-colors ${
                isActive ? "bg-blue-50 dark:bg-blue-950/20" : "bg-red-50 dark:bg-red-950/20"
              }`}>
                <div className={`flex items-center justify-center w-9 h-9 rounded-full mb-2 ${
                  isActive ? "bg-blue-100 dark:bg-blue-900/30" : "bg-red-100 dark:bg-red-900/30"
                }`}>
                  <Zap className={`w-4 h-4 ${
                    isActive ? "stroke-blue-600 dark:stroke-blue-400" : "stroke-red-600 dark:stroke-red-400"
                  }`} />
                </div>
                <span className={`text-sm font-medium ${
                  isActive ? "text-blue-600 dark:text-blue-400" : "text-red-600 dark:text-red-400"
                }`}>
                  {isActive ? "فعال" : "غیرفعال"}
                </span>
              </div>
              <div className={`flex flex-col items-center justify-center py-4 px-3 rounded-lg transition-colors ${
                portfolio.is_featured ? "bg-orange-50 dark:bg-orange-950/20" : "bg-gray-50 dark:bg-gray-950/20"
              }`}>
                <div className={`flex items-center justify-center w-9 h-9 rounded-full mb-2 ${
                  portfolio.is_featured ? "bg-orange-100 dark:bg-orange-900/30" : "bg-gray-100 dark:bg-gray-900/30"
                }`}>
                  <Star className={`w-4 h-4 ${
                    portfolio.is_featured ? "stroke-orange-600 fill-orange-600 dark:stroke-orange-400 dark:fill-orange-400" : "stroke-gray-400 dark:stroke-gray-500"
                  }`} />
                </div>
                <span className={`text-sm font-medium ${
                  portfolio.is_featured ? "text-orange-600 dark:text-orange-400" : "text-gray-600 dark:text-gray-400"
                }`}>
                  {portfolio.is_featured ? "ویژه" : "عادی"}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 pb-4">
            <div className="space-y-5">
            <div>
              <h4 className="mb-4 text-foreground">اطلاعات پایه</h4>
              <div className="space-y-0 [&>div:not(:last-child)]:border-b">
                <div className="flex items-center justify-between gap-3 pb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <label>عنوان:</label>
                  </div>
                  <div className="flex-1 ms-2 text-left min-w-0 overflow-hidden">
                    <TruncatedText
                      text={portfolio.title}
                      maxLength={40}
                      className="text-foreground"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 py-3">
                  <div className="flex items-center gap-2">
                    <Hash className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <label>شناسه:</label>
                  </div>
                  <p className="text-foreground text-left">
                    #{portfolio.id}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-3 py-3">
                  <div className="flex items-center gap-2">
                    <LinkIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <label>اسلاگ:</label>
                  </div>
                  <div className="flex-1 ms-2 text-left min-w-0 overflow-hidden">
                    <TruncatedText
                      text={portfolio.slug || "-"}
                      maxLength={35}
                      className="font-mono text-foreground"
                    />
                  </div>
                </div>

                {portfolio.created_at && (
                  <div className="flex items-center justify-between gap-3 pt-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <label>تاریخ ایجاد:</label>
                    </div>
                    <p className="text-foreground text-left">
                      {formatDate(portfolio.created_at)}
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

