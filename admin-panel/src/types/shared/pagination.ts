export interface ApiPagination {
  count: number;
  next: string | null;
  previous: string | null;
  page_size: number;
  current_page: number;
  total_pages: number;
}

export interface TablePaginationState {
  pageIndex: number;
  pageSize: number;
}

export interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;
  
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  showPageSize?: boolean;
  
  showInfo?: boolean;
  selectedCount?: number;
  totalCount?: number;
  infoText?: string;
  
  className?: string;
  showFirstLast?: boolean;
  showPageNumbers?: boolean;
}

export interface PaginationParams {
  page?: number;
  size?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: ApiPagination;
}

export interface LegacyPaginationResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages?: number;
}

export interface PaginationUtils {
  getPageCount: (total: number, pageSize: number) => number;
  getPageInfo: (page: number, pageSize: number, total: number) => {
    startIndex: number;
    endIndex: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export const DEFAULT_PAGINATION_OPTIONS = {
  pageSizeOptions: [10, 20, 30, 50],
  defaultPageSize: 10,
  siblingCount: 1,
} as const;

