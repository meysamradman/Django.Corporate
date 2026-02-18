"use client";

import * as React from "react";

import { Input } from "@/components/elements/Input";
import PortfolioList from "@/components/portfolios/PortfolioList";
import PortfolioPagination from "@/components/portfolios/PortfolioPagination";
import { portfolioApi } from "@/api/portfolios/route";
import { resolvePaginatedData } from "@/core/utils/pagination";
import { buildPortfolioListAjaxHref, toPortfolioListApiParams, PORTFOLIOS_PAGE_SIZE } from "@/components/portfolios/query";
import type { Portfolio } from "@/types/portfolio/portfolio";
import type { PortfolioCategory } from "@/types/portfolio/category/portfolioCategory";
import type { PortfolioTag } from "@/types/portfolio/tags/portfolioTag";
import type { ApiPagination, PaginatedResponse } from "@/types/shared/pagination";

type PortfolioListPageClientProps = {
  initialPortfolios: Portfolio[];
  initialPagination: ApiPagination;
  initialSearch?: string;
  initialCategorySlug?: string;
  initialTagSlug?: string;
  categories: PortfolioCategory[];
  tags: PortfolioTag[];
};

const cardClassName = "rounded-md border bg-card p-3 space-y-3";

const toUrl = (state: { page: number; search?: string; category_slug?: string; tag_slug?: string }): string =>
  buildPortfolioListAjaxHref({
    page: state.page,
    search: state.search,
    category_slug: state.category_slug,
    tag_slug: state.tag_slug,
  });

const replaceUrl = (url: string) => {
  if (typeof window === "undefined") return;

  const currentPath = window.location.pathname;
  const currentSearch = window.location.search;
  const currentUrl = `${currentPath}${currentSearch}`;

  let decodedNextUrl: string;
  try {
    decodedNextUrl = decodeURI(url);
  } catch {
    decodedNextUrl = url;
  }

  const normalizedCurrent = currentUrl.replace(/\/$/, "");
  const normalizedNext = decodedNextUrl.replace(/\/$/, "");

  if (normalizedCurrent === normalizedNext) return;
  window.history.replaceState(window.history.state, "", url);
};

const useDebouncedValue = <T,>(value: T, delayMs: number): T => {
  const [debounced, setDebounced] = React.useState<T>(value);

  React.useEffect(() => {
    const handle = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(handle);
  }, [value, delayMs]);

  return debounced;
};

export default function PortfolioListPageClient({
  initialPortfolios,
  initialPagination,
  initialSearch,
  initialCategorySlug,
  initialTagSlug,
  categories,
  tags,
}: PortfolioListPageClientProps) {
  const [search, setSearch] = React.useState(initialSearch ?? "");
  const [categorySlug, setCategorySlug] = React.useState<string | undefined>(initialCategorySlug);
  const [tagSlug, setTagSlug] = React.useState<string | undefined>(initialTagSlug);
  const [page, setPage] = React.useState<number>(initialPagination.current_page || 1);

  const [portfolios, setPortfolios] = React.useState<Portfolio[]>(initialPortfolios);
  const [pagination, setPagination] = React.useState<ApiPagination>(initialPagination);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const hasFetchedRef = React.useRef(false);
  const isMountedRef = React.useRef(false);

  const debouncedSearch = useDebouncedValue(search, 350).trim();

  React.useEffect(() => {
    setSearch(initialSearch ?? "");
    setCategorySlug(initialCategorySlug);
    setTagSlug(initialTagSlug);
    setPage(initialPagination.current_page || 1);
    setPortfolios(initialPortfolios);
    setPagination(initialPagination);
    setIsLoading(false);
    setError(null);
    hasFetchedRef.current = false;
    isMountedRef.current = false;
  }, [initialSearch, initialCategorySlug, initialTagSlug, initialPagination, initialPortfolios]);

  const stateForUrl = React.useMemo(
    () => ({
      page,
      search: debouncedSearch || undefined,
      category_slug: categorySlug || undefined,
      tag_slug: tagSlug || undefined,
    }),
    [page, debouncedSearch, categorySlug, tagSlug]
  );

  React.useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      return;
    }

    const nextUrl = toUrl(stateForUrl);
    replaceUrl(nextUrl);
  }, [stateForUrl]);

  React.useEffect(() => {
    let isStale = false;

    async function load() {
      if (!hasFetchedRef.current) {
        hasFetchedRef.current = true;
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response: PaginatedResponse<Portfolio> = await portfolioApi.getPortfolioList(
          toPortfolioListApiParams({
            page,
            search: debouncedSearch || undefined,
            category_slug: categorySlug || undefined,
            tag_slug: tagSlug || undefined,
          })
        );

        if (isStale) return;

        const resolved = resolvePaginatedData(response, page);
        setPortfolios(resolved.items);
        setPagination(resolved.pagination);
      } catch {
        if (isStale) return;
        setError("خطا در دریافت لیست نمونه‌کار. لطفاً دوباره تلاش کنید.");
      } finally {
        if (isStale) return;
        setIsLoading(false);
      }
    }

    load();

    return () => {
      isStale = true;
    };
  }, [page, debouncedSearch, categorySlug, tagSlug]);

  const onSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const onPageChange = (nextPage: number) => {
    setPage(nextPage);
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <section className="lg:col-span-8 space-y-6">
        {pagination.count > 0 && (
          <div className="flex items-center justify-between text-sm text-font-s">
            <p>
              <span className="font-semibold text-font-p">{pagination.count}</span> نمونه‌کار یافت شد
            </p>
            <p>
              صفحه {pagination.current_page} از {pagination.total_pages}
            </p>
          </div>
        )}

        {error && (
          <div className="rounded-lg border bg-card px-6 py-6">
            <p className="text-font-s">{error}</p>
          </div>
        )}

        {!error && portfolios.length > 0 ? (
          <>
            <PortfolioList portfolios={portfolios} />
            <div className="mt-10">
              <PortfolioPagination
                currentPage={pagination.current_page}
                totalPages={pagination.total_pages}
                search={debouncedSearch || undefined}
                category_slug={categorySlug || undefined}
                tag_slug={tagSlug || undefined}
                onPageChange={onPageChange}
              />
            </div>
          </>
        ) : !error ? (
          <div className="rounded-lg border bg-card px-6 py-16 text-center">
            <p className="text-lg text-font-s">نمونه‌کاری برای نمایش یافت نشد.</p>
          </div>
        ) : null}

        <p className="text-xs text-font-s">{isLoading ? "در حال بروزرسانی..." : ""}</p>
      </section>

      <aside className="lg:col-span-4 space-y-3">
        <div className="rounded-lg border bg-card p-4 md:p-5 flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">فیلتر نمونه‌کار</h2>
          <span className="text-xs text-font-s">{isLoading ? "در حال بروزرسانی..." : "آماده"}</span>
        </div>

        <div className={cardClassName}>
          <h3 className="text-sm font-semibold">جستجو</h3>
          <div className="space-y-2">
            <label className="text-sm text-font-s">عبارت جستجو</label>
            <Input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="عنوان، توضیحات..."
            />
          </div>
          <p className="text-xs text-font-s">با تایپ، نتایج به‌صورت خودکار بروزرسانی می‌شود.</p>
        </div>

        <div className={cardClassName}>
          <h3 className="text-sm font-semibold">دسته‌بندی</h3>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => {
                setCategorySlug(undefined);
                setPage(1);
              }}
              className={
                "block w-full text-right rounded-md border px-3 py-2 text-sm transition-colors " +
                (categorySlug ? "bg-card text-font-s" : "bg-gray text-font-p")
              }
            >
              همه دسته‌ها
            </button>

            {categories.map((category) => {
              const isActive = categorySlug === category.slug;
              return (
                <button
                  type="button"
                  key={category.public_id}
                  onClick={() => {
                    setCategorySlug(category.slug);
                    setPage(1);
                  }}
                  className={
                    "block w-full text-right rounded-md border px-3 py-2 text-sm transition-colors " +
                    (isActive ? "bg-gray text-font-p" : "bg-card text-font-s hover:text-font-p")
                  }
                >
                  {category.name}
                </button>
              );
            })}
          </div>

          <p className="text-xs text-font-s">با انتخاب دسته‌بندی، آدرس صفحه (URL) هم تغییر می‌کند.</p>
        </div>

        <div className={cardClassName}>
          <h3 className="text-sm font-semibold">تگ‌ها</h3>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => {
                setTagSlug(undefined);
                setPage(1);
              }}
              className={
                "block w-full text-right rounded-md border px-3 py-2 text-sm transition-colors " +
                (tagSlug ? "bg-card text-font-s" : "bg-gray text-font-p")
              }
            >
              همه تگ‌ها
            </button>

            {tags.map((tag) => {
              const isActive = tagSlug === tag.slug;
              return (
                <button
                  type="button"
                  key={tag.public_id}
                  onClick={() => {
                    setTagSlug(tag.slug);
                    setPage(1);
                  }}
                  className={
                    "block w-full text-right rounded-md border px-3 py-2 text-sm transition-colors " +
                    (isActive ? "bg-gray text-font-p" : "bg-card text-font-s hover:text-font-p")
                  }
                >
                  {tag.name}
                </button>
              );
            })}
          </div>
        </div>

        <div className={cardClassName}>
          <h3 className="text-sm font-semibold">تنظیمات</h3>
          <p className="text-xs text-font-s">اندازه هر صفحه: {PORTFOLIOS_PAGE_SIZE}</p>
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setCategorySlug(undefined);
              setTagSlug(undefined);
              setPage(1);
            }}
            className="inline-flex items-center justify-center rounded-md border px-3 py-2 text-sm text-font-s hover:text-font-p"
          >
            پاک کردن فیلترها
          </button>
        </div>
      </aside>
    </div>
  );
}