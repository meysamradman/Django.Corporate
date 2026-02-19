import Image from "next/image";
import { CalendarDays } from "lucide-react";

import { Badge } from "@/components/elements/badge";
import { formatDate } from "@/core/utils/format";
import { portfolioMedia } from "@/core/utils/media";
import type { Portfolio } from "@/types/portfolio/portfolio";

type PortfolioDetailHeaderProps = {
  portfolio: Portfolio;
};

type PortfolioWithDetailMedia = Portfolio & {
  main_image_url?: string | null;
  media?: Array<{
    media?: {
      file_url?: string | null;
      media_type?: string;
    } | null;
    is_main_image?: boolean;
  }>;
};

function getCoverImage(portfolio: PortfolioWithDetailMedia): string {
  const mainImage = portfolio.main_image?.file_url || portfolio.main_image_url;
  if (mainImage) {
    return portfolioMedia.getItemImage(mainImage);
  }

  const mediaItems = Array.isArray(portfolio.media) ? portfolio.media : [];
  const preferredImage =
    mediaItems.find((item) => item?.is_main_image && item?.media?.file_url)?.media?.file_url ||
    mediaItems.find((item) => item?.media?.media_type === "image" && item?.media?.file_url)?.media?.file_url ||
    null;

  return portfolioMedia.getItemImage(preferredImage);
}

export default function PortfolioDetailHeader({ portfolio }: PortfolioDetailHeaderProps) {
  const portfolioData = portfolio as PortfolioWithDetailMedia;
  const coverImage = getCoverImage(portfolioData);

  return (
    <section className="space-y-6">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {portfolio.categories?.map((category) => (
            <Badge key={category.public_id} variant="secondary">
              {category.name}
            </Badge>
          ))}

          {portfolio.is_featured && <Badge>ویژه</Badge>}
        </div>

        <h1 className="text-2xl font-black text-font-p md:text-4xl">{portfolio.title}</h1>

        <p className="max-w-3xl text-sm leading-7 text-font-s md:text-base">{portfolio.short_description}</p>

        <div className="flex items-center gap-2 text-sm text-font-t">
          <CalendarDays className="size-4" />
          <span>{formatDate(portfolio.created_at)}</span>
        </div>
      </div>

      <div className="relative aspect-video w-full overflow-hidden rounded-2xl border bg-card">
        <Image
          src={coverImage}
          alt={portfolio.title}
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
      </div>
    </section>
  );
}
