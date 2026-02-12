import { useDebounce } from '@/core/hooks/useDebounce';
import type { Dispatch, SetStateAction } from 'react';
import { updateMediaPageSearchParams, type MediaFiltersWithRange } from '@/components/media/page/mediaPageFilterUrl';

interface UseMediaPageFiltersParams {
  setFilters: Dispatch<SetStateAction<MediaFiltersWithRange>>;
}

export function useMediaPageFilters({ setFilters }: UseMediaPageFiltersParams) {
  const debouncedSearch = useDebounce((searchTerm: string) => {
    setFilters((prev) => ({ ...prev, search: searchTerm, page: 1 }));

    updateMediaPageSearchParams((searchParams) => {
      if (searchTerm) {
        searchParams.set('search', searchTerm);
      } else {
        searchParams.delete('search');
      }
      searchParams.set('page', '1');
    });
  }, 500);

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));

    updateMediaPageSearchParams((searchParams) => {
      searchParams.set('page', newPage.toString());
    });
  };

  const handleLimitChange = (newLimit: number) => {
    setFilters((prev) => ({ ...prev, size: newLimit, page: 1 }));

    updateMediaPageSearchParams((searchParams) => {
      searchParams.set('limit', newLimit.toString());
      searchParams.set('page', '1');
    });
  };

  const handleFileTypeChange = (fileType: string) => {
    setFilters((prev) => ({ ...prev, file_type: fileType === 'all' ? 'all' : fileType, page: 1 }));

    updateMediaPageSearchParams((searchParams) => {
      searchParams.set('file_type', fileType);
      searchParams.set('page', '1');
    });
  };

  const handleDateRangeChange = (range: { from?: string; to?: string }) => {
    setFilters((prev) => ({
      ...prev,
      date_from: range.from || '',
      date_to: range.to || '',
      date_range: range,
      page: 1,
    }));

    updateMediaPageSearchParams((searchParams) => {
      searchParams.delete('date_range');

      if (range.from) {
        searchParams.set('date_from', range.from);
      } else {
        searchParams.delete('date_from');
      }

      if (range.to) {
        searchParams.set('date_to', range.to);
      } else {
        searchParams.delete('date_to');
      }

      searchParams.set('page', '1');
    });
  };

  return {
    debouncedSearch,
    handlePageChange,
    handleLimitChange,
    handleFileTypeChange,
    handleDateRangeChange,
  };
}
