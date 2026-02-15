import { api } from '@/core/config/api';
import { ApiError } from '@/types/api/apiError';
import type { MediaUploadSettings } from '@/types/shared/media';

export async function getUploadSettings(clearCache: boolean = false): Promise<MediaUploadSettings> {
    const url = clearCache
        ? '/core/upload-settings/?clear_cache=true'
        : '/core/upload-settings/';

    const response = await api.get<MediaUploadSettings>(url);

    if (!response.data) {
        throw ApiError.fromMessage('API returned success but no upload settings data found.', 500, response);
    }

    return response.data;
}