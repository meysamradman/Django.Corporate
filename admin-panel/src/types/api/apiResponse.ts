import type { ApiPagination } from '@/types/shared/pagination';

export type ApiStatus = 'success' | 'error';

export interface ApiResponse<TData> {
    metaData: MetaData;
    pagination?: Pagination;
    data: TData;
    errors?: Record<string, string[]>;
}

export interface MetaData {
    status: ApiStatus;
    message: string;
    AppStatusCode: number;
    timestamp: string;
}

export type Pagination = ApiPagination;

export function isPaginatedResponse<T>(response: ApiResponse<T>): response is ApiResponse<T> & {
    pagination: Pagination
} {
    return response &&
           typeof response === 'object' &&
           response.pagination !== undefined &&
           response.pagination !== null &&
           typeof response.pagination.count === 'number' &&
           typeof response.pagination.page_size === 'number' &&
           typeof response.pagination.current_page === 'number' &&
           typeof response.pagination.total_pages === 'number';
}

export function hasErrors(response: ApiResponse<unknown>): response is ApiResponse<unknown> & {
    errors: Record<string, string[]>
} {
    return 'errors' in response && response.errors !== undefined;
}


