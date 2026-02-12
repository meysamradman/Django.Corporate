import { useCallback, useState } from 'react';
import { mediaApi } from '@/api/media/media';
import type { Media, MediaFilter } from '@/types/shared/media';

export function useMediaPageData() {
  const [mediaItems, setMediaItems] = useState<Media[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMedia = useCallback(async (currentFilters: MediaFilter) => {
    setIsLoading(true);
    setError(null);

    const apiFilters: MediaFilter = {
      search: currentFilters.search || undefined,
      file_type: currentFilters.file_type === 'all' ? undefined : currentFilters.file_type,
      page: currentFilters.page,
      size: currentFilters.size,
      date_from: currentFilters.date_from || undefined,
      date_to: currentFilters.date_to || undefined,
    };

    try {
      const response = await mediaApi.getMediaList(apiFilters);

      if (response.metaData.status === 'success') {
        const mediaData = Array.isArray(response.data) ? response.data : [];
        setMediaItems(mediaData);
        setTotalCount(response.pagination?.count || mediaData.length || 0);
      } else {
        setError(response.metaData.message || 'خطا در دریافت رسانه‌ها');
      }
    } catch {
      setError('خطا در دریافت رسانه‌ها');
      setMediaItems([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    mediaItems,
    setMediaItems,
    totalCount,
    isLoading,
    error,
    fetchMedia,
  };
}
