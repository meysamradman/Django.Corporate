import { api } from '@/core/config/api';
import { convertToLimitOffset } from '@/components/shared/paginations/pagination';
import type { PaginatedResponse, ApiPagination } from '@/types/shared/pagination';

export type ListParams = Record<string, unknown> & { page?: number; size?: number };

const normalizeListParams = (params?: ListParams): Record<string, unknown> => {
  if (!params) return {};

  const normalized: Record<string, unknown> = { ...params };
  if (params.page && params.size) {
    const { limit, offset } = convertToLimitOffset(params.page, params.size);
    normalized.limit = limit;
    normalized.offset = offset;
    delete normalized.page;
    delete normalized.size;
  }

  return normalized;
};

const buildQueryString = (
  params?: Record<string, unknown>,
  options?: {
    booleanKeys?: Set<string>;
    rawStringKeys?: Set<string>;
  }
): string => {
  if (!params) return '';

  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;

    if (options?.booleanKeys?.has(key)) {
      if (typeof value === 'boolean') {
        queryParams.append(key, value.toString());
      } else if (typeof value === 'string') {
        queryParams.append(key, value);
      }
      return;
    }

    if (options?.rawStringKeys?.has(key)) {
      queryParams.append(key, String(value));
      return;
    }

    queryParams.append(key, String(value));
  });

  return queryParams.toString();
};

export const buildListUrl = (
  baseUrl: string,
  params?: ListParams,
  options?: {
    booleanKeys?: Set<string>;
    rawStringKeys?: Set<string>;
  }
): string => {
  const normalized = normalizeListParams(params);
  const queryString = buildQueryString(normalized, options);
  if (!queryString) return baseUrl;
  return `${baseUrl}?${queryString}`;
};

export const toPaginatedResponse = <T>(response: any, params?: ListParams): PaginatedResponse<T> => {
  const responseData = Array.isArray(response?.data) ? response.data : [];
  const responsePagination = response?.pagination;

  const pageSize = responsePagination?.page_size || (params?.size || 10);
  const totalCount = responsePagination?.count || responseData.length;
  const totalPages = responsePagination?.total_pages || Math.ceil(totalCount / pageSize);
  let currentPage = responsePagination?.current_page || (params?.page || 1);

  if (currentPage < 1) currentPage = 1;
  if (totalPages > 0 && currentPage > totalPages) currentPage = totalPages;

  const pagination: ApiPagination = {
    count: totalCount,
    next: responsePagination?.next || null,
    previous: responsePagination?.previous || null,
    page_size: pageSize,
    current_page: currentPage,
    total_pages: totalPages,
  };

  return {
    data: responseData,
    pagination,
  };
};

export const extractData = <T>(response: any): T => {
  return response?.data?.data || response?.data;
};

export const fetchPaginated = async <T>(baseUrl: string, params?: ListParams): Promise<PaginatedResponse<T>> => {
  const url = buildListUrl(baseUrl, params);
  const response = await api.get<T[]>(url);
  return toPaginatedResponse<T>(response, params);
};
