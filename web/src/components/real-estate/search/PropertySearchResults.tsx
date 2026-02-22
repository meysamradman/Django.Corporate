import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/elements/pagination";
import { PropertyCardList } from "@/components/real-estate/cards";

import type { Property } from "@/types/real-estate/property";
import type { PropertySearchFilters } from "@/types/real-estate/searchFilters";
import { filtersToHref } from "@/components/real-estate/search/filters";
import { buildPaginationItems } from "@/core/utils/paginationLinks";

type PropertySearchResultsProps = {
  properties: Property[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  filters: PropertySearchFilters;
  isLoading?: boolean;
  onPageChange?: (page: number) => void;
};

const buildPageHref = (filters: PropertySearchFilters, page: number): string => {
  return filtersToHref(filters, { page });
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
  const pageItems = buildPaginationItems(currentPage, totalPages);
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {properties.map((property) => {
            return (
              <PropertyCardList key={`property-list-${property.id}`} property={property} />
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
