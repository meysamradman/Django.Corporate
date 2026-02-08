import { cn } from '@/core/utils/cn';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/elements/Select";
import type { PaginationControlsProps } from '@/types/shared/pagination';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/elements/Pagination"

const generatePaginationRange = (currentPage: number, totalPages: number, siblingCount: number): (number | '...')[] => {
  if (totalPages <= 0) {
    return [];
  }

  if (totalPages === 1) {
    return [1];
  }

  const totalPageNumbers = siblingCount + 5;

  if (totalPages <= totalPageNumbers) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
  const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

  const shouldShowLeftDots = leftSiblingIndex > 2;
  const shouldShowRightDots = rightSiblingIndex < totalPages - 1;

  const firstPageIndex = 1;
  const lastPageIndex = totalPages;

  if (!shouldShowLeftDots && shouldShowRightDots) {
    const leftItemCount = 3 + 2 * siblingCount;
    const leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1);
    return [...leftRange, '...', lastPageIndex];
  }

  if (shouldShowLeftDots && !shouldShowRightDots) {
    const rightItemCount = 3 + 2 * siblingCount;
    const rightRange = Array.from({ length: rightItemCount }, (_, i) => totalPages - rightItemCount + 1 + i);
    return [firstPageIndex, '...', ...rightRange];
  }

  if (shouldShowLeftDots && shouldShowRightDots) {
    const middleRange = Array.from({ length: rightSiblingIndex - leftSiblingIndex + 1 }, (_, i) => leftSiblingIndex + i);
    return [firstPageIndex, '...', ...middleRange, '...', lastPageIndex];
  }

  return [];
};

export function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
  siblingCount = 1,
  pageSize,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 30, 50],
  showPageSize = false,
  showInfo = false,
  selectedCount = 0,
  totalCount = 0,
  infoText,
  className,
  showFirstLast: _showFirstLast = true,
  showPageNumbers = true
}: PaginationControlsProps) {
  if (totalPages <= 0) {
    return (
      <div className={cn("flex w-full flex-col items-center justify-between gap-4 overflow-auto px-0 sm:flex-row sm:gap-8", className)} dir="rtl">
        {showInfo && (
          <div className="flex-1 whitespace-nowrap text-sm text-font-s">
            {infoText || `${selectedCount} از ${totalCount} انتخاب شده`}
          </div>
        )}

        <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6 lg:gap-8">
          {showPageSize && onPageSizeChange && pageSize && (
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-font-s whitespace-nowrap">تعداد در صفحه</p>
              <Select
                value={String(pageSize)}
                onValueChange={(value) => onPageSizeChange(parseInt(value, 10))}
              >
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue placeholder={pageSize} />
                </SelectTrigger>
                <SelectContent side="top">
                  {pageSizeOptions.map((size) => (
                    <SelectItem key={size} value={`${size}`}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>
    );
  }

  const validCurrentPage = Math.max(1, Math.min(currentPage, totalPages));
  const paginationRange = generatePaginationRange(validCurrentPage, totalPages, siblingCount);

  return (
    <div className={cn("flex w-full items-center justify-between gap-4 px-0", className)} dir="rtl">
      {showPageSize && onPageSizeChange && pageSize && (
        <div className="flex items-center gap-2">
          <p className="text-sm text-font-s whitespace-nowrap hidden sm:block">تعداد در صفحه</p>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => onPageSizeChange(parseInt(value, 10))}
          >
            <SelectTrigger className="h-8 w-[70px] border rounded-md">
              <SelectValue placeholder={pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={`${size}`}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex items-center gap-4 sm:gap-6">
        {showInfo && (
          <div className="text-sm text-font-s whitespace-nowrap">
            {infoText || `${((validCurrentPage - 1) * (pageSize || 10)) + 1} - ${Math.min(validCurrentPage * (pageSize || 10), totalCount)} از ${totalCount}`}
          </div>
        )}

        <Pagination className="w-auto mx-0 justify-end">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (validCurrentPage > 1) onPageChange(validCurrentPage - 1);
                }}
                aria-disabled={validCurrentPage === 1}
                className={validCurrentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>

            {showPageNumbers && paginationRange.map((pageNumber, index) => {
              if (pageNumber === '...') {
                return (
                  <PaginationItem key={`ellipsis-${index}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                );
              }

              const isActive = pageNumber === validCurrentPage;
              return (
                <PaginationItem key={pageNumber}>
                  <PaginationLink
                    href="#"
                    isActive={isActive}
                    onClick={(e) => {
                      e.preventDefault();
                      onPageChange(pageNumber as number);
                    }}
                    className="cursor-pointer"
                  >
                    {pageNumber}
                  </PaginationLink>
                </PaginationItem>
              );
            })}

            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (validCurrentPage < totalPages) onPageChange(validCurrentPage + 1);
                }}
                aria-disabled={validCurrentPage === totalPages}
                className={validCurrentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}
