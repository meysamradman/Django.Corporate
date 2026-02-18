import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/elements/Pagination";
import { getVisiblePages } from "@/core/utils/paginationLinks";
import { buildBlogListHref } from "@/components/blogs/query";

type BlogPaginationProps = {
  currentPage: number;
  totalPages: number;
  search?: string;
};

export default function BlogPagination({ currentPage, totalPages, search }: BlogPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const pages = getVisiblePages(currentPage, totalPages);

  const buildHref = (page: number): string => buildBlogListHref({ page, search });

  return (
    <Pagination>
      <PaginationContent>
        {currentPage > 1 && (
          <PaginationItem>
            <PaginationPrevious href={buildHref(currentPage - 1)}>قبلی</PaginationPrevious>
          </PaginationItem>
        )}

        {pages[0] > 1 && (
          <>
            <PaginationItem>
              <PaginationLink href={buildHref(1)}>1</PaginationLink>
            </PaginationItem>

            {pages[0] > 2 && (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            )}
          </>
        )}

        {pages.map((page) => (
          <PaginationItem key={page}>
            <PaginationLink href={buildHref(page)} isActive={page === currentPage}>
              {page}
            </PaginationLink>
          </PaginationItem>
        ))}

        {pages[pages.length - 1] < totalPages && (
          <>
            {pages[pages.length - 1] < totalPages - 1 && (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            )}

            <PaginationItem>
              <PaginationLink href={buildHref(totalPages)}>{totalPages}</PaginationLink>
            </PaginationItem>
          </>
        )}

        {currentPage < totalPages && (
          <PaginationItem>
            <PaginationNext href={buildHref(currentPage + 1)}>بعدی</PaginationNext>
          </PaginationItem>
        )}
      </PaginationContent>
    </Pagination>
  );
}
