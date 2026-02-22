import type { ApiResponse } from '@/types/api/apiResponse';
import type { ApiPagination, PaginatedResponse } from '@/types/shared/pagination';

const DEFAULT_PAGE_SIZE = 10;

type PageSizeParams = {
  page?: number;
  size?: number;
};

export const buildQueryString = (params?: Record<string, unknown>): string => {
  if (!params) return '';

  const queryParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => queryParams.append(key, String(item)));
      return;
    }

    queryParams.append(key, String(value));
  });

  return queryParams.toString();
};

export const withQuery = (baseUrl: string, params?: Record<string, unknown>): string => {
  const query = buildQueryString(params);
  if (!query) return baseUrl;
  return `${baseUrl}?${query}`;
};

export const toLimitOffsetQuery = <T extends PageSizeParams & Record<string, unknown>>(
  params?: T,
  extras?: Record<string, unknown>
): Record<string, unknown> => {
  const limit = params?.size;
  const offset = params?.page && params?.size ? (params.page - 1) * params.size : undefined;

  return {
    ...(params || {}),
    ...(extras || {}),
    limit,
    offset,
    page: undefined,
    size: undefined,
  };
};

export const extractData = <T>(response: ApiResponse<T>): T => response.data;

export const toPaginatedResponse = <T>(
  response: ApiResponse<T[]>,
  fallbackPageSize: number = DEFAULT_PAGE_SIZE
): PaginatedResponse<T> => {
  const data = Array.isArray(response.data) ? response.data : [];
  const pagination = response.pagination;

  const normalizedPagination: ApiPagination = {
    count: pagination?.count || data.length,
    next: pagination?.next || null,
    previous: pagination?.previous || null,
    page_size: pagination?.page_size || fallbackPageSize,
    current_page: pagination?.current_page || 1,
    total_pages: pagination?.total_pages || Math.max(1, Math.ceil((pagination?.count || data.length) / (pagination?.page_size || fallbackPageSize))),
  };

  return {
    data,
    pagination: normalizedPagination,
  };
};
