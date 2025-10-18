"use client";

import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '@/core/utils/cn';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/elements/Select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationEllipsis,
} from "@/components/elements/Pagination";

import { PaginationControlsProps } from '@/types/shared/pagination';

const generatePaginationRange = (currentPage: number, totalPages: number, siblingCount: number): (number | '...')[] => {
  // Handle edge cases
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
  showFirstLast = true,
  showPageNumbers = true
}: PaginationControlsProps) {
  // Handle edge cases
  if (totalPages <= 0) {
    return (
      <div className={cn("flex w-full flex-col items-center justify-between gap-4 overflow-auto px-0 sm:flex-row sm:gap-8", className)} dir="rtl">
        {/* Info Section */}
        {showInfo && (
          <div className="flex-1 whitespace-nowrap text-sm text-muted-foreground">
            {infoText || `${selectedCount} از ${totalCount} انتخاب شده`}
          </div>
        )}

        <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6 lg:gap-8">
          {/* Page Size Selector */}
          {showPageSize && onPageSizeChange && pageSize && (
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-muted-foreground whitespace-nowrap">تعداد در صفحه</p>
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

  // Make sure currentPage is within valid range
  const validCurrentPage = Math.max(1, Math.min(currentPage, totalPages));
  
  const paginationRange = generatePaginationRange(validCurrentPage, totalPages, siblingCount);

  return (
    <div className={cn("flex w-full flex-col items-center justify-between gap-4 overflow-auto px-0 sm:flex-row sm:gap-8", className)} dir="rtl">
      {/* Info Section */}
      {showInfo && (
        <div className="flex-1 whitespace-nowrap text-sm text-muted-foreground">
          {infoText || `${selectedCount} از ${totalCount} انتخاب شده`}
        </div>
      )}

      <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6 lg:gap-8">
        {/* Page Size Selector */}
        {showPageSize && onPageSizeChange && pageSize && (
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-muted-foreground whitespace-nowrap">تعداد در صفحه</p>
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

        {/* Pagination Navigation */}
        <Pagination className="mx-0 w-auto sm:mx-auto">
          <PaginationContent>
            {/* First Page Button */}
            {showFirstLast && (
              <PaginationItem>
                <PaginationLink
                  onClick={() => onPageChange(1)}
                  isActive={false}
                  className={validCurrentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  aria-label="صفحه اول"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </PaginationLink>
              </PaginationItem>
            )}

            {/* Previous Page Button */}
            <PaginationItem>
              <PaginationLink
                onClick={() => onPageChange(validCurrentPage - 1)}
                isActive={false}
                className={validCurrentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                aria-label="صفحه قبل"
              >
                <ChevronRight className="h-4 w-4" />
              </PaginationLink>
            </PaginationItem>

            {/* Page Numbers */}
            {showPageNumbers && paginationRange.map((pageNumber, index) => {
              if (pageNumber === '...') {
                return (
                  <PaginationItem key={`ellipsis-${index}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                );
              }

              return (
                <PaginationItem key={pageNumber}>
                  <PaginationLink
                    onClick={() => onPageChange(pageNumber as number)}
                    isActive={pageNumber === validCurrentPage}
                    className={pageNumber !== validCurrentPage ? "cursor-pointer" : "cursor-default"}
                  >
                    {pageNumber}
                  </PaginationLink>
                </PaginationItem>
              );
            })}

            {/* Next Page Button */}
            <PaginationItem>
              <PaginationLink
                onClick={() => onPageChange(validCurrentPage + 1)}
                isActive={false}
                className={validCurrentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                aria-label="صفحه بعد"
              >
                <ChevronLeft className="h-4 w-4" />
              </PaginationLink>
            </PaginationItem>

            {/* Last Page Button */}
            {showFirstLast && (
              <PaginationItem>
                <PaginationLink
                  onClick={() => onPageChange(totalPages)}
                  isActive={false}
                  className={validCurrentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  aria-label="صفحه آخر"
                >
                  <ChevronsRight className="h-4 w-4" />
                </PaginationLink>
              </PaginationItem>
            )}
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}