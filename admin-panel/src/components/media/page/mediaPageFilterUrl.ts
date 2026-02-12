import type { MediaFilter } from '@/types/shared/media';

export interface MediaFiltersWithRange extends MediaFilter {
  date_range?: { from?: string; to?: string };
}

export const parseMediaFiltersFromSearch = (
  search: string,
  defaultFilters: MediaFilter
): MediaFiltersWithRange => {
  const urlParams = new URLSearchParams(search);
  const urlFilters: Partial<MediaFiltersWithRange> = {};

  if (urlParams.get('search')) urlFilters.search = urlParams.get('search')!;
  if (urlParams.get('file_type')) urlFilters.file_type = urlParams.get('file_type')!;

  const dateFrom = urlParams.get('date_from');
  const dateTo = urlParams.get('date_to');
  if (dateFrom || dateTo) {
    urlFilters.date_from = dateFrom || '';
    urlFilters.date_to = dateTo || '';
    urlFilters.date_range = { from: dateFrom || undefined, to: dateTo || undefined };
  }

  if (urlParams.get('page')) {
    urlFilters.page = parseInt(urlParams.get('page')!, 10);
  }

  if (urlParams.get('limit')) {
    urlFilters.size = parseInt(urlParams.get('limit')!, 10);
  }

  if (Object.keys(urlFilters).length > 0) {
    return { ...defaultFilters, ...urlFilters };
  }

  return defaultFilters as MediaFiltersWithRange;
};

export const updateMediaPageSearchParams = (
  updater: (params: URLSearchParams) => void
) => {
  const url = new URL(window.location.href);
  updater(url.searchParams);
  window.history.replaceState({}, '', url.toString());
};
