// ========================================
// Unified Pagination Types for Frontend
// Compatible with Backend FastAPI and React Table
// ========================================

// Backend API Pagination Response
export interface ApiPagination {
  count: number;
  next: string | null;
  previous: string | null;
  page_size: number;
  current_page: number;
  total_pages: number;
}

// React Table Pagination State
export interface TablePaginationState {
  pageIndex: number;
  pageSize: number;
}

// Pagination Controls Props
export interface PaginationControlsProps {
  // Core pagination
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;
  
  // Page size options
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  showPageSize?: boolean;
  
  // Info display
  showInfo?: boolean;
  selectedCount?: number;
  totalCount?: number;
  infoText?: string;
  
  // Customization
  className?: string;
  showFirstLast?: boolean;
  showPageNumbers?: boolean;
}

// Pagination Parameters for API calls
export interface PaginationParams {
  page?: number;
  size?: number;
  limit?: number;
}

// Pagination Response Wrapper
export interface PaginatedResponse<T> {
  data: T[];
  pagination: ApiPagination;
}

// Legacy pagination (for backward compatibility)
export interface LegacyPaginationResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages?: number;
}

// Pagination utilities
export interface PaginationUtils {
  getPageCount: (total: number, pageSize: number) => number;
  getPageInfo: (page: number, pageSize: number, total: number) => {
    startIndex: number;
    endIndex: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

// Default pagination options
export const DEFAULT_PAGINATION_OPTIONS = {
  pageSizeOptions: [10, 20, 30, 50],
  defaultPageSize: 10,
  siblingCount: 1,
} as const;


