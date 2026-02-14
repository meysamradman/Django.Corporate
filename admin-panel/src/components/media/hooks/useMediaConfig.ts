import { getUploadSettings } from '@/components/media/services/config';

/**
 * Hook for media configuration.
 * Returns static data from environment.ts for maximum performance.
 */
export const useMediaConfig = () => {
    const config = getUploadSettings();

    return {
        data: config,
        isLoading: false,
        isError: false,
        error: null
    };
};
