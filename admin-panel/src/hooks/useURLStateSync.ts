import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import type { SortingState } from '@tanstack/react-table';
import type { TablePaginationState } from '@/types/shared/pagination';
import { initSortingFromURL } from '@/components/tables/utils/tableSorting';

/**
 * Generic URL state synchronization hook
 * Syncs pagination, search, sorting, and filters with URL parameters
 * 
 * IMPORTANT: Uses useRef to store parseFilters to avoid infinite loops
 */
export function useURLStateSync<TFilters extends Record<string, unknown>>(
    setPagination: React.Dispatch<React.SetStateAction<TablePaginationState>>,
    setSearchValue: React.Dispatch<React.SetStateAction<string>>,
    setSorting: React.Dispatch<React.SetStateAction<SortingState>>,
    setClientFilters: React.Dispatch<React.SetStateAction<TFilters>>,
    parseFilters: (urlParams: URLSearchParams) => TFilters
) {
    const location = useLocation();
    const parseFiltersRef = useRef(parseFilters);

    // Update ref on every render but don't trigger re-render
    parseFiltersRef.current = parseFilters;

    useEffect(() => {
        const urlParams = new URLSearchParams(location.search);

        // Sync Pagination
        const page = parseInt(urlParams.get('page') || '1', 10);
        const size = parseInt(urlParams.get('size') || '10', 10);
        setPagination(prev => {
            if (prev.pageIndex === Math.max(0, page - 1) && prev.pageSize === size) return prev;
            return { pageIndex: Math.max(0, page - 1), pageSize: size };
        });

        // Sync Search
        const search = urlParams.get('search') || '';
        setSearchValue(prev => prev === search ? prev : search);

        // Sync Sorting
        setSorting(initSortingFromURL());

        // Sync Filters using custom parser from ref
        const filters = parseFiltersRef.current(urlParams);

        setClientFilters(prev => {
            const prevStr = JSON.stringify(prev, Object.keys(prev).sort());
            const nextStr = JSON.stringify(filters, Object.keys(filters).sort());
            if (prevStr === nextStr) return prev;
            return filters;
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.search]);
}

/**
 * Helper function to parse boolean from URL
 */
export function parseBooleanParam(urlParams: URLSearchParams, key: string): boolean | undefined {
    const val = urlParams.get(key);
    if (val === 'true') return true;
    if (val === 'false') return false;
    return undefined;
}

/**
 * Helper function to parse string from URL
 */
export function parseStringParam(urlParams: URLSearchParams, key: string): string | undefined {
    return urlParams.get(key) || undefined;
}

/**
 * Helper function to parse date range from URL
 */
export function parseDateRange(urlParams: URLSearchParams): {
    date_from?: string;
    date_to?: string;
    date_range?: { from?: string; to?: string };
} {
    const dateFrom = urlParams.get('date_from');
    const dateTo = urlParams.get('date_to');

    const result: any = {};
    if (dateFrom) result.date_from = dateFrom;
    if (dateTo) result.date_to = dateTo;
    if (dateFrom || dateTo) {
        result.date_range = { from: dateFrom || undefined, to: dateTo || undefined };
    }

    return result;
}
