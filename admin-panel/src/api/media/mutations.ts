import { api } from '@/core/config/api';
import { showError } from '@/core/toast';
import type { Media } from '@/types/shared/media';
import type { ApiResponse } from '@/types/api/apiResponse';
import { ApiError } from '@/types/api/apiError';
import { BASE_MEDIA_PATH } from './constants';

export async function deleteMedia(mediaId: number | string): Promise<ApiResponse<{ deleted: boolean }>> {
    try {
        const endpoint = `${BASE_MEDIA_PATH}/${mediaId}`;
        return await api.delete<{ deleted: boolean }>(endpoint);
    } catch (error: unknown) {
        showError(error);

        let message = 'Failed to delete media';
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
            data: { deleted: false }
        };
    }
}

export async function updateMedia(
    mediaId: number | string,
    updateData: Partial<Media>
): Promise<ApiResponse<Media>> {
    console.log('[MediaAPI][Update] Starting update request', {
        mediaId,
        updateData,
        timestamp: new Date().toISOString()
    });

    try {
        const endpoint = `${BASE_MEDIA_PATH}/${mediaId}`;
        console.log('[MediaAPI][Update] Calling API endpoint:', endpoint);

        const response = await api.put<Media>(endpoint, updateData);

        console.log('[MediaAPI][Update] API response received', {
            status: response.metaData.status,
            message: response.metaData.message,
            hasData: !!response.data,
            data: response.data
        });

        return response;
    } catch (error: unknown) {
        console.error('[MediaAPI][Update] Error occurred', {
            mediaId,
            updateData,
            error,
            errorType: error?.constructor?.name,
            timestamp: new Date().toISOString()
        });

        showError(error);

        let message = 'Failed to update media';
        let statusCode = 500;

        if (error instanceof ApiError) {
            message = error.message;
            statusCode = error.response.AppStatusCode;
            console.error('[MediaAPI][Update] ApiError details', {
                message,
                statusCode,
                response: error.response
            });
        } else if (error instanceof Error) {
            message = error.message;
            console.error('[MediaAPI][Update] Error details', {
                message,
                stack: error.stack
            });
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

export async function updateCoverImage(
    mediaId: number | string,
    coverImageId: number | null
): Promise<ApiResponse<Media>> {
    try {
        const endpoint = `${BASE_MEDIA_PATH}/${mediaId}`;
        const updateData = {
            cover_image: coverImageId
        };
        const response = await api.patch<Media>(endpoint, updateData);
        if (response.metaData.status === 'success' && response.data) {
            if (coverImageId === null) {
                response.data.cover_image = null;
                response.data.cover_image_url = undefined;
            }
        }

        return response;
    } catch (error: unknown) {
        showError(error);

        let message = 'Failed to update cover image';
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

export async function bulkDeleteMedia(mediaItems: Media[]): Promise<ApiResponse<{ deleted_count: number }>> {
    try {
        const endpoint = `${BASE_MEDIA_PATH}/bulk-delete`;
        const mediaData = mediaItems.map(item => ({
            id: item.id,
            type: item.media_type || 'image'
        }));

        return await api.post<{ deleted_count: number }>(endpoint, { media_data: mediaData });
    } catch (error: unknown) {
        showError(error);

        let message = 'Failed to delete media items';
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
            data: { deleted_count: 0 }
        };
    }
}