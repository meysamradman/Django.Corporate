import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/core/utils/cn';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/elements/Select";
import type { PaginationControlsProps } from '@/types/shared/pagination';

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
          <p className="text-sm text-font-s whitespace-nowrap">تعداد در صفحه</p>
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

      <div className="flex items-center gap-4">
        {showInfo && (
          <div className="text-sm text-font-s">
            {infoText || `${((validCurrentPage - 1) * (pageSize || 10)) + 1} - ${Math.min(validCurrentPage * (pageSize || 10), totalCount)} از ${totalCount}`}
          </div>
        )}

        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(validCurrentPage - 1)}
            disabled={validCurrentPage === 1}
            className="text-font-s hover:text-font-p disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            aria-label="صفحه قبل"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          {showPageNumbers && paginationRange.map((pageNumber, index) => {
            if (pageNumber === '...') {
              return (
                <span key={`ellipsis-${index}`} className="px-2 text-font-s">
                  ...
                </span>
              );
            }

            const isActive = pageNumber === validCurrentPage;
            return (
              <button
                key={pageNumber}
                onClick={() => onPageChange(pageNumber as number)}
                className={`px-2 py-1 text-sm rounded-md cursor-pointer ${isActive
                  ? "bg-bg text-font-p"
                  : "text-font-s hover:text-font-p"
                  }`}
              >
                {pageNumber}
              </button>
            );
          })}

          <button
            onClick={() => onPageChange(validCurrentPage + 1)}
            disabled={validCurrentPage === totalPages}
            className="text-font-s hover:text-font-p disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            aria-label="صفحه بعد"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
