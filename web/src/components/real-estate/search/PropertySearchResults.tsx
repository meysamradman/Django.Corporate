import Link from "next/link";

import { Button } from "@/components/elements/Button";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/elements/Pagination";

import type { Property } from "@/types/real-estate/property";
import type { PropertySearchFilters } from "@/types/real-estate/searchFilters";
import { filtersToHref } from "@/components/real-estate/search/filters";

type PropertySearchResultsProps = {
  properties: Property[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  filters: PropertySearchFilters;
  isLoading?: boolean;
  onPageChange?: (page: number) => void;
};

const toPriceLabel = (property: Property): string => {
  const rawPrice = property.price ?? property.sale_price ?? property.pre_sale_price ?? null;
  if (!rawPrice || rawPrice <= 0) return "قیمت توافقی";
  return `${rawPrice.toLocaleString("fa-IR")} تومان`;
};

const getPropertyImageUrl = (property: Property): string | null => {
  const mainImage = property.main_image?.url || property.main_image?.file_url || null;
  if (mainImage) return mainImage;

  const mediaImage =
    property.media?.find((item) => !!item?.media?.file_url)?.media?.file_url || null;
  return mediaImage;
};

const getPropertyCanonicalPath = (property: Property): string => `/properties/id/${property.id}/${encodeURIComponent(property.slug)}`;

const buildPageHref = (filters: PropertySearchFilters, page: number): string => {
  return filtersToHref(filters, { page });
};

const buildPageItems = (currentPage: number, totalPages: number): (number | "ellipsis")[] => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set<number>([1, totalPages, currentPage, currentPage - 1, currentPage + 1]);
  const validPages = Array.from(pages)
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b);

  const result: (number | "ellipsis")[] = [];
  for (let index = 0; index < validPages.length; index += 1) {
    const page = validPages[index];
    const previous = validPages[index - 1];
    if (previous && page - previous > 1) result.push("ellipsis");
    result.push(page);
  }

  return result;
};

export default function PropertySearchResults({
  properties,
  totalCount,
  totalPages,
  currentPage,
  filters,
  isLoading = false,
  onPageChange,
}: PropertySearchResultsProps) {
  const pageItems = buildPageItems(currentPage, totalPages);
  const handlePageClick = (page: number) => (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (!onPageChange) return;
    event.preventDefault();
    onPageChange(page);
  };

  return (
    <section className="space-y-4 md:space-y-6">
      <div className="rounded-lg border bg-card p-4 md:p-5 flex items-center justify-between gap-3">
        <h1 className="text-xl md:text-2xl font-bold">جستجوی املاک</h1>
        <span className="text-sm text-font-s">
          {isLoading ? "در حال بروزرسانی..." : `${totalCount.toLocaleString("fa-IR")} مورد`}
        </span>
      </div>

      {properties.length === 0 ? (
        <div className="rounded-lg border bg-card p-6 text-center text-font-s">
          موردی مطابق فیلترهای شما پیدا نشد.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {properties.map((property) => {
            const propertyPath = getPropertyCanonicalPath(property);
            const imageUrl = getPropertyImageUrl(property);

            return (
              <article key={property.id} className="rounded-lg border bg-card overflow-hidden flex flex-col">
                <Link href={propertyPath} className="block">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={property.title || "ملک"}
                      className="w-full h-44 object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-44 bg-bg flex items-center justify-center text-font-s text-sm">
                      تصویر موجود نیست
                    </div>
                  )}
                </Link>

                <div className="p-4 space-y-3 flex-1 flex flex-col">
                  <div className="space-y-1">
                    <h2 className="font-semibold line-clamp-2 leading-7">{property.title || "ملک"}</h2>
                    <p className="text-sm text-font-s line-clamp-2">{property.short_description || "-"}</p>
                  </div>

                  <div className="text-sm text-font-s">
                    {(property.city_name || "") + " " + (property.province_name || "")}
                  </div>

                  <div className="mt-auto flex items-center justify-between gap-2 pt-1">
                    <span className="font-semibold text-primary">{toPriceLabel(property)}</span>
                    <Button asChild variant="outline" size="sm">
                      <Link href={propertyPath}>مشاهده</Link>
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href={buildPageHref(filters, Math.max(1, currentPage - 1))}
                onClick={handlePageClick(Math.max(1, currentPage - 1))}
                aria-disabled={currentPage <= 1}
                className={currentPage <= 1 || isLoading ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>

            {pageItems.map((item, index) => {
              if (item === "ellipsis") {
                return (
                  <PaginationItem key={`ellipsis-${index}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                );
              }

              return (
                <PaginationItem key={item}>
                  <PaginationLink
                    href={buildPageHref(filters, item)}
                    isActive={item === currentPage}
                    onClick={handlePageClick(item)}
                    className={isLoading ? "pointer-events-none" : ""}
                  >
                    {item.toLocaleString("fa-IR")}
                  </PaginationLink>
                </PaginationItem>
              );
            })}

            <PaginationItem>
              <PaginationNext
                href={buildPageHref(filters, Math.min(totalPages, currentPage + 1))}
                onClick={handlePageClick(Math.min(totalPages, currentPage + 1))}
                aria-disabled={currentPage >= totalPages}
                className={currentPage >= totalPages || isLoading ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </section>
  );
}
