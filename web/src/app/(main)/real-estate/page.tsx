"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { realEstateApi } from "@/api/real-estate/route";
import { Button } from "@/components/elements/Button";

const PAGE_SIZE = 9;

export default function RealEstatePage() {
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["public-properties", page],
    queryFn: () => realEstateApi.getProperties({ page, size: PAGE_SIZE, is_active: true, is_public: true }),
  });

  const properties = data?.data ?? [];
  const totalPages = data?.pagination?.total_pages ?? 1;

  return (
    <section className="container mr-auto ml-auto py-10 space-y-6">
      <h1 className="text-2xl font-bold">املاک</h1>

      {isLoading && <p className="text-font-s">در حال بارگذاری...</p>}
      {isError && <p className="text-red-1">خطا در دریافت لیست املاک</p>}

      {!isLoading && !isError && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {properties.map((property) => (
              <article key={property.id} className="rounded-lg border bg-bg p-4 space-y-3">
                <h2 className="text-lg font-semibold line-clamp-2">{property.title}</h2>
                <p className="text-sm text-font-s line-clamp-2">{property.short_description}</p>
                <div className="text-sm text-font-s">{property.city_name || ""} {property.province_name || ""}</div>
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
