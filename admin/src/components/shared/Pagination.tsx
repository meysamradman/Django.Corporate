"use client";

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
    <div className={cn("flex w-full items-center justify-between gap-4 px-0", className)} dir="rtl">
      {/* Left section - Page Size Selector */}
      {showPageSize && onPageSizeChange && pageSize && (
        <div className="flex items-center gap-2">
          <p className="text-sm text-gray-600 whitespace-nowrap">تعداد در صفحه</p>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => onPageSizeChange(parseInt(value, 10))}
          >
            <SelectTrigger className="h-8 w-[70px] border border-gray-200 rounded-md">
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

      {/* Right section - Info + Pagination Navigation */}
      <div className="flex items-center gap-4">
        {/* Info */}
        {showInfo && (
          <div className="text-sm text-gray-600">
            {infoText || `${((validCurrentPage - 1) * (pageSize || 10)) + 1} - ${Math.min(validCurrentPage * (pageSize || 10), totalCount)} از ${totalCount}`}
          </div>
        )}

        {/* Pagination Navigation */}
        <div className="flex items-center gap-1">
          {/* Previous Page Button */}
          <button
            onClick={() => onPageChange(validCurrentPage - 1)}
            disabled={validCurrentPage === 1}
            className="text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            aria-label="صفحه قبل"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          {/* Page Numbers */}
          {showPageNumbers && paginationRange.map((pageNumber, index) => {
            if (pageNumber === '...') {
              return (
                <span key={`ellipsis-${index}`} className="px-2 text-gray-400">
                  ...
                </span>
              );
            }

            const isActive = pageNumber === validCurrentPage;
            return (
              <button
                key={pageNumber}
                onClick={() => onPageChange(pageNumber as number)}
                className={`px-2 py-1 text-sm rounded-md cursor-pointer ${
                  isActive 
                    ? "bg-gray-100 text-gray-900" 
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {pageNumber}
              </button>
            );
          })}

          {/* Next Page Button */}
          <button
            onClick={() => onPageChange(validCurrentPage + 1)}
            disabled={validCurrentPage === totalPages}
            className="text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            aria-label="صفحه بعد"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}