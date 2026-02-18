import Image from "next/image";
import Link from "next/link";
import { CalendarDays } from "lucide-react";

import { Badge } from "@/components/elements/Badge";
import { formatDate } from "@/core/utils/format";
import { portfolioMedia } from "@/core/utils/media";
import type { Portfolio } from "@/types/portfolio/portfolio";

type PortfolioCardProps = {
  portfolio: Portfolio;
};

type PortfolioWithMainImageUrl = Portfolio & {
  main_image_url?: string | null;
};

const getCanonicalPortfolioId = (portfolio: Portfolio): string | number => {
  if (typeof portfolio.id === "number" && Number.isFinite(portfolio.id)) {
    return portfolio.id;
  }

  return portfolio.public_id;
};

export default function PortfolioCard({ portfolio }: PortfolioCardProps) {
  const portfolioData = portfolio as PortfolioWithMainImageUrl;
  const canonicalId = getCanonicalPortfolioId(portfolio);

  const imageSrc = portfolioMedia.getItemImage(
    portfolioData.main_image_url || portfolioData.main_image?.file_url || null
  );

  return (
    <article className="overflow-hidden rounded-lg border bg-card shadow-sm transition-shadow hover:shadow-md">
      <div className="relative aspect-16/10 w-full">
        <Image
          src={imageSrc}
          alt={portfolio.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>

      <div className="space-y-4 p-5">
        <div className="flex flex-wrap items-center gap-2">
          {portfolio.categories?.slice(0, 2).map((category) => (
            <Badge key={category.public_id} variant="gray">
              {category.name}
            </Badge>
          ))}

          {portfolio.is_featured && <Badge>ویژه</Badge>}
        </div>

        <h2 className="line-clamp-2 text-lg font-semibold text-font-p">
          <Link href={`/portfolios/${canonicalId}/${portfolio.slug}`} className="hover:text-primary transition-colors">
            {portfolio.title}
          </Link>
        </h2>

        <p className="line-clamp-3 text-sm leading-6 text-font-s">{portfolio.short_description}</p>

        <div className="flex items-center gap-2 text-xs text-font-t">
          <CalendarDays className="size-4" />
          <span>{formatDate(portfolio.created_at)}</span>
        </div>

        <div>
          <Link
            href={`/portfolios/${canonicalId}/${portfolio.slug}`}
            className="text-sm font-black text-primary hover:underline"
          >
            مشاهده نمونه‌کار
          </Link>
        </div>
      </div>
    </article>
  );
}
