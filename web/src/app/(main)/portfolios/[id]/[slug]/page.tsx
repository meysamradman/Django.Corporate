import { notFound, permanentRedirect } from "next/navigation";

import { portfolioApi } from "@/api/portfolios/route";
import PortfolioDetailHeader from "@/components/portfolios/detail/PortfolioDetailHeader";
import PortfolioDetailContent from "@/components/portfolios/detail/PortfolioDetailContent";
import PortfolioDetailMeta from "@/components/portfolios/detail/PortfolioDetailMeta";

type PageProps = {
  params: Promise<{ id: string; slug: string }>;
};

const getCanonicalPortfolioPath = (id: string | number, slug: string) => `/portfolios/${id}/${encodeURIComponent(slug)}`;

const getCanonicalPortfolioId = (portfolio: { id?: number; public_id: string }): string | number => {
  if (typeof portfolio.id === "number" && Number.isFinite(portfolio.id)) {
    return portfolio.id;
  }

  return portfolio.public_id;
};

export default async function PortfolioDetailPage({ params }: PageProps) {
  const { id } = await params;

  const portfolio = await portfolioApi.getPortfolioByNumericId(id).catch(() => null);

  if (!portfolio) {
    notFound();
  }

  const canonicalId = getCanonicalPortfolioId(portfolio);

  if (String(canonicalId) !== id) {
    permanentRedirect(getCanonicalPortfolioPath(canonicalId, portfolio.slug));
  }

  return (
    <main className="container mx-auto px-4 py-10 md:py-12">
      <div className="space-y-8">
        <PortfolioDetailHeader portfolio={portfolio} />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <PortfolioDetailContent portfolio={portfolio} />
          <PortfolioDetailMeta portfolio={portfolio} />
        </div>
      </div>
    </main>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;

  const portfolio = await portfolioApi.getPortfolioByNumericId(id).catch(() => null);

  if (!portfolio) {
    return {
      title: "نمونه‌کار",
      description: "جزئیات نمونه‌کار",
    };
  }

  return {
    title: portfolio.meta_title || portfolio.title,
    description: portfolio.meta_description || portfolio.short_description,
    openGraph: {
      title: portfolio.og_title || portfolio.title,
      description: portfolio.og_description || portfolio.short_description,
    },
  };
}
