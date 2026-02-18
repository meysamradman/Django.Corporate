import * as React from "react";
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
  category_slug?: string;
  tag_slug?: string;
  onPageChange?: (page: number) => void;
};

export default function BlogPagination({ currentPage, totalPages, search, category_slug, tag_slug, onPageChange }: BlogPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const pages = getVisiblePages(currentPage, totalPages);

  const buildHref = (page: number): string => buildBlogListHref({ page, search, category_slug, tag_slug });

  const handleClick = (page: number) => (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (!onPageChange) return;
    event.preventDefault();
    onPageChange(page);
  };

  return (
    <Pagination>
      <PaginationContent>
        {currentPage > 1 && (
          <PaginationItem>
            <PaginationPrevious href={buildHref(currentPage - 1)} onClick={handleClick(currentPage - 1)}>قبلی</PaginationPrevious>
          </PaginationItem>
        )}

        {pages[0] > 1 && (
          <>
            <PaginationItem>
              <PaginationLink href={buildHref(1)} onClick={handleClick(1)}>1</PaginationLink>
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
            <PaginationLink href={buildHref(page)} isActive={page === currentPage} onClick={handleClick(page)}>
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
              <PaginationLink href={buildHref(totalPages)} onClick={handleClick(totalPages)}>{totalPages}</PaginationLink>
            </PaginationItem>
          </>
        )}

        {currentPage < totalPages && (
          <PaginationItem>
            <PaginationNext href={buildHref(currentPage + 1)} onClick={handleClick(currentPage + 1)}>بعدی</PaginationNext>
          </PaginationItem>
        )}
      </PaginationContent>
    </Pagination>
  );
}
