"use client";

import PortfolioCard from "@/components/portfolios/PortfolioCard";
import type { Portfolio } from "@/types/portfolio/portfolio";

type PortfolioListProps = {
  portfolios: Portfolio[];
};

export default function PortfolioList({ portfolios }: PortfolioListProps) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {portfolios.map((portfolio, index) => (
        <PortfolioCard key={portfolio.public_id} portfolio={portfolio} priorityImage={index === 0} />
      ))}
    </div>
  );
}
