import { api } from '@/core/config/api';
import type { Media, MediaFilter } from '@/types/shared/media';
import type { ApiResponse, Pagination } from '@/types/api/apiResponse';
import { ApiError } from '@/types/api/apiError';
import { normalizePaginationParams } from '@/components/shared/paginations/pagination';
import { BASE_MEDIA_PATH, DEFAULT_MEDIA_PAGE_SIZE, VALID_MEDIA_PAGE_SIZES } from './constants';

export async function getMediaList(filters?: MediaFilter): Promise<ApiResponse<Media[]>> {
    try {
        const safeFilters: Partial<MediaFilter> = filters ? { ...filters } : {};

        const normalizedParams = normalizePaginationParams(
            { page: safeFilters.page, size: safeFilters.size },
            DEFAULT_MEDIA_PAGE_SIZE,
            VALID_MEDIA_PAGE_SIZES
        );

        const queryParams = new URLSearchParams();
        if (safeFilters) {
            Object.entries(safeFilters).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    if (key === 'page' || key === 'size') return;
                    if (key === 'file_type' && value === 'all') return;
                    queryParams.append(key, String(value));
                }
            });

            if (safeFilters.size) {
                queryParams.append('limit', String(safeFilters.size));
            } else {
                queryParams.append('limit', String(DEFAULT_MEDIA_PAGE_SIZE));
            }

            const pageSize = safeFilters.size || DEFAULT_MEDIA_PAGE_SIZE;
            const page = safeFilters.page || 1;
            const offset = (page - 1) * pageSize;
            queryParams.append('offset', String(offset));
        }

        const endpoint = `${BASE_MEDIA_PATH}/?${queryParams.toString()}`;
        const response = await api.get<Media[]>(endpoint);

        if (!response.pagination) {
            const count = response.data?.length || 0;
            response.pagination = {
                count: count,
                next: null,
                previous: null,
                page_size: normalizedParams.size,
                current_page: normalizedParams.page,
                total_pages: Math.ceil(count / normalizedParams.size)
            };
        } else {
            const pageSize = response.pagination.page_size || normalizedParams.size;
            const totalCount = response.pagination.count || 0;

            response.pagination.current_page = normalizedParams.page;
            response.pagination.page_size = pageSize;
            response.pagination.total_pages = Math.ceil(totalCount / pageSize);
        }

        return response;
    } catch (error: unknown) {
        let message = 'Failed to fetch media list';
        let statusCode = 500;

        if (error instanceof ApiError) {
            message = error.message;
            statusCode = error.response.AppStatusCode;
        } else if (error instanceof Error) {
            message = error.message;
        }

        return {
            metaData: {
                status: 'error',
                message: message,
                AppStatusCode: statusCode,
                timestamp: new Date().toISOString()
            },
            data: [] as Media[],
            pagination: {
                count: 0,
                next: null,
                previous: null,
                page_size: filters?.size || DEFAULT_MEDIA_PAGE_SIZE,
                current_page: filters?.page || 1,
                total_pages: 1
            } as Pagination
        };
    }
}