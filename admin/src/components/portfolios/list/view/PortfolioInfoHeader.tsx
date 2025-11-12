"use client";

import Image from "next/image";
import { Card, CardContent } from "@/components/elements/Card";
import { CheckCircle2, XCircle, Clock, Package } from "lucide-react";
import { Portfolio } from "@/types/portfolio/portfolio";
import { MediaImage } from "@/components/media/base/MediaImage";
import { mediaService } from "@/components/media/services";

interface PortfolioInfoHeaderProps {
  portfolio: Portfolio;
}

export function PortfolioInfoHeader({ portfolio }: PortfolioInfoHeaderProps) {
  const mainImageUrl = portfolio.main_image?.file_url
    ? mediaService.getMediaUrlFromObject({ file_url: portfolio.main_image.file_url } as any)
    : "";

  const getStatusBadge = () => {
    if (portfolio.status === "published") {
      return (
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-1" />
          <span className="text-green-1">منتشر شده</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2">
        <XCircle className="w-5 h-5 text-yellow-1" />
        <span className="text-yellow-1">پیش‌نویس</span>
      </div>
    );
  };

  return (
    <Card className="overflow-hidden p-0">
      <div className="relative h-40 md:h-56">
        {mainImageUrl ? (
          <MediaImage
            media={{ file_url: mainImageUrl } as any}
            alt="Portfolio cover"
            className="object-cover"
            fill
          />
        ) : (
          <Image src="/images/profile-banner.png" alt="Cover image" fill className="object-cover" />
        )}
      </div>
      <CardContent className="relative px-6 pt-0 pb-6">
        <div className="flex items-end gap-6 -mt-16">
          <div className="relative shrink-0">
            {mainImageUrl ? (
              <div className="w-32 h-32 rounded-xl overflow-hidden border-4 border-card relative">
                <MediaImage
                  media={{ file_url: mainImageUrl } as any}
                  alt="Portfolio image"
                  className="object-cover"
                  fill
                  sizes="128px"
                />
              </div>
            ) : (
              <div className="w-32 h-32 rounded-xl bg-gradient-to-br from-purple-1 to-purple-2 flex items-center justify-center text-static-w text-4xl font-bold border-4 border-card">
                {portfolio.title?.[0]?.toUpperCase() || "P"}
              </div>
            )}
          </div>
          <div className="flex-1 pt-16 pb-2">
            <h2>{portfolio.title}</h2>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-font-s mt-3">
              {getStatusBadge()}
              {portfolio.is_featured && (
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  <span>ویژه</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span>
                  ایجاد شده در{" "}
                  {portfolio.created_at
                    ? new Date(portfolio.created_at).toLocaleDateString("fa-IR")
                    : "نامشخص"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

