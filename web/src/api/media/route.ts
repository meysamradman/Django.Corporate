import { fetchApi } from '@/core/config/fetch';
import { Media, MediaFilter } from '@/types/shared/media';
import { ApiResponse } from '@/types/api/apiResponse';
import { withQuery } from '@/api/shared';

const DEFAULT_MEDIA_PAGE_SIZE = 12;

type MediaListOptions = {
    forceRefresh?: boolean;
};

export const mediaApi = {
    getMediaList: async (filters?: MediaFilter, options?: MediaListOptions): Promise<ApiResponse<Media[]>> => {
        const normalizedFilters: MediaFilter = {
            ...filters,
            page: filters?.page || 1,
            size: filters?.size || DEFAULT_MEDIA_PAGE_SIZE,
        };

        return fetchApi.get<Media[]>(
            withQuery('/public/media/', normalizedFilters as Record<string, unknown>),
            options?.forceRefresh ? { cache: 'no-store' } : undefined,
        );
    },

    getMediaDetails: async (mediaId: number | string): Promise<ApiResponse<Media>> => {
        return fetchApi.get<Media>(`/public/media/${mediaId}/`);
    },
};
