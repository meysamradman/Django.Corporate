import { api } from '@/core/config/api';
import type { Media, MediaFilter } from '@/types/shared/media';
import type { ApiResponse } from '@/types/api/apiResponse';
import { ApiError } from '@/types/api/apiError';
import { BASE_MEDIA_PATH } from './constants';
import { getMediaList } from './list';

export async function getMediaDetails(mediaId: number | string): Promise<ApiResponse<Media>> {
    try {
        const mediaIdNumber = typeof mediaId === 'string' ? parseInt(mediaId, 10) : mediaId;

        if (isNaN(mediaIdNumber)) {
            throw new Error(`Invalid media ID: ${mediaId}`);
        }

        const endpoint = `${BASE_MEDIA_PATH}/${mediaIdNumber}`;

        try {
            const response = await api.get<Media>(endpoint);

            if (response && typeof response === 'object' && !('metaData' in response)) {
                return {
                    metaData: {
                        status: 'success',
                        message: 'Details fetched',
                        AppStatusCode: 200,
                        timestamp: new Date().toISOString()
                    },
                    data: response as Media
                };
            }

            return response;
        } catch (metadataError) {
            const listFilter: MediaFilter = {
                page: 1,
                size: 100,
            };

            const listResponse = await getMediaList(listFilter);

            if (listResponse.metaData.status === 'success' && Array.isArray(listResponse.data)) {
                const mediaItem = listResponse.data.find((item: Media) => item.id === mediaIdNumber);

                if (mediaItem) {
                    return {
                        metaData: {
                            status: 'success',
                            message: 'Media details fetched from list',
                            AppStatusCode: 200,
                            timestamp: new Date().toISOString()
                        },
                        data: mediaItem
                    };
                }
            }

            throw metadataError;
        }
    } catch (error: unknown) {
        let message = `Failed to fetch details for media ID ${mediaId}`;
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
            data: null as unknown as Media
        };
    }
}