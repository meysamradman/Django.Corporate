"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/core/config/fetch";
import type { Portfolio } from "@/types/portfolio/portfolio";

export default function PortfolioViewPage() {
  const params = useParams();
  const portfolioId = params?.id as string;

  const { data: portfolio, isLoading, isError } = useQuery({
    queryKey: ["public-portfolio", portfolioId],
    queryFn: async () => {
      const response = await fetchApi.get<Portfolio>(`/public/portfolio/${Number(portfolioId)}/`);
      return response.data;
    },
    enabled: !!portfolioId,
  });

  if (!portfolioId) {
    return <section className="container mr-auto ml-auto py-10">شناسه نامعتبر است.</section>;
  }

  if (isLoading) {
    return <section className="container mr-auto ml-auto py-10">در حال بارگذاری...</section>;
  }

  if (isError || !portfolio) {
    return <section className="container mr-auto ml-auto py-10 text-red-1">خطا در دریافت اطلاعات نمونه‌کار</section>;
  }

  return (
    <article className="container mr-auto ml-auto py-10 space-y-4">
      <h1 className="text-2xl font-bold">{portfolio.title}</h1>
      <p className="text-sm text-font-s">{portfolio.short_description}</p>
      <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: portfolio.description || "" }} />
    </article>
  );
}
