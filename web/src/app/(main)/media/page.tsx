"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { mediaApi } from "@/api/media/route";
import { Button } from "@/components/elements/Button";

const PAGE_SIZE = 24;

export default function MediaPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["public-media", page],
    queryFn: () => mediaApi.getMediaList({ page, size: PAGE_SIZE }),
  });

  const items = data?.data ?? [];
  const totalPages = data?.pagination?.total_pages ?? 1;

  return (
    <section className="container mr-auto ml-auto py-10 space-y-6">
      <h1 className="text-2xl font-bold">رسانه‌ها</h1>

      {isLoading && <p className="text-font-s">در حال بارگذاری...</p>}
      {isError && <p className="text-red-1">خطا در دریافت رسانه‌ها</p>}

      {!isLoading && !isError && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {items.map((media) => (
              <article key={media.id} className="rounded-lg border overflow-hidden bg-bg">
                <div className="aspect-square bg-muted">
                  {media.file_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={media.file_url} alt={media.alt_text || media.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-font-s text-xs">بدون پیش‌نمایش</div>
                  )}
                </div>
                <div className="p-2 text-xs line-clamp-1">{media.title}</div>
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
