"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { portfolioApi } from "../../../api/portfolios/route";
import { Button } from "@/components/elements/Button";

const PAGE_SIZE = 9;

export default function PortfoliosPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["public-portfolios", page],
    queryFn: () => portfolioApi.getPortfolioList({ page, size: PAGE_SIZE, is_public: true, is_active: true }),
  });

  const portfolios = data?.data ?? [];
  const totalPages = data?.pagination?.total_pages ?? 1;

  return (
    <section className="container mr-auto ml-auto py-10 space-y-6">
      <h1 className="text-2xl font-bold">نمونه‌کارها</h1>

      {isLoading && <p className="text-font-s">در حال بارگذاری...</p>}
      {isError && <p className="text-red-1">خطا در دریافت لیست نمونه‌کارها</p>}

      {!isLoading && !isError && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {portfolios.map((portfolio) => (
              <article key={portfolio.id} className="rounded-lg border bg-bg p-4 space-y-3">
                <h2 className="text-lg font-semibold line-clamp-2">{portfolio.title}</h2>
                <p className="text-sm text-font-s line-clamp-3">{portfolio.short_description}</p>
                <Link href={`/portfolios/${portfolio.id}/view`} className="inline-flex">
                  <Button variant="outline" size="sm">مشاهده</Button>
                </Link>
              </article>
            ))}
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              قبلی
            </Button>
            <span className="text-sm text-font-s">صفحه {page} از {totalPages}</span>
            <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              بعدی
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
