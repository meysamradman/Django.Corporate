import { fetchApi } from '@/core/config/fetch';
import { Media, MediaFilter } from '@/types/shared/media';
import { ApiResponse } from '@/types/api/apiResponse';

export const mediaApi = {
    getMediaList: async (filters?: MediaFilter): Promise<ApiResponse<Media[]>> => {
        const queryParams = new URLSearchParams();
        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    queryParams.append(key, String(value));
                }
            });
        }
        return fetchApi.get<Media[]>(`/public/media/?${queryParams.toString()}`);
    },

    getMediaDetails: async (mediaId: number | string): Promise<ApiResponse<Media>> => {
        return fetchApi.get<Media>(`/public/media/${mediaId}/`);
    }
};
