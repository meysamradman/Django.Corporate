import { useQuery } from '@tanstack/react-query';
import { mediaApi } from '@/api/media/media';
import { showError } from '@/core/toast';
import type { MediaUploadSettings } from '@/types/shared/media';

/**
 * React Query hook for fetching media configuration from backend
 * No caching - fetches fresh data on each mount
 * Backend has Redis cache for performance
 */
export const useMediaConfig = () => {
    return useQuery<MediaUploadSettings, Error>({
        queryKey: ['mediaConfig'],
        queryFn: async () => {
            try {
                return await mediaApi.getUploadSettings();
            } catch (error) {
                showError(error, {
                    customMessage: 'خطا در دریافت تنظیمات مدیا. لطفاً صفحه را رفرش کنید.'
                });
                throw error;
            }
        },
        staleTime: 0, // Always fetch fresh data
        gcTime: 0, // Don't cache
        retry: 2, // Retry twice on failure
        retryDelay: 1000, // 1 second delay between retries
    });
};
