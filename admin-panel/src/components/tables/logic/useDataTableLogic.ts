import { useState, useEffect, useCallback, useMemo, useRef, type SetStateAction } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type {
  PaginationState,
  SortingState,
  VisibilityState,
  RowSelectionState,
} from '@tanstack/react-table';
import { showSuccess, showError, showInfo } from '@/core/toast';
import { getAction, getCrud } from '@/core/messages/ui';
import { getError } from '@/core/messages/errors';
import { useDebounceValue } from '@/core/hooks/useDebounce';

import type { ApiResponse } from '@/types/api/apiResponse';
import type {
  UseDataTableLogicOptions,
  UseDataTableLogicResult,
} from '@/types/shared/table';
import type { BaseApiFilterParams, BaseClientFilterParams } from '@/types/shared/tableFilters';

export function useDataTableLogic<
  TData,
  TApiFilters extends BaseApiFilterParams,
  TClientFilters extends BaseClientFilterParams,
>({
  fetchDataFn,
  deleteItemFn,
  deleteMultipleItemsFn,
  initialData,
  totalItems: initialTotalItems,
  initialFilters,
  idField = 'id' as keyof TData,
  defaultPageSize = 10,
  pageSizeOptions = [10, 20, 30, 50],
  updateUrlOnFilterChange = true,
  searchDebounceMs = 300,
  mapClientFiltersToApiFilters,
}: UseDataTableLogicOptions<TData, TApiFilters, TClientFilters>): UseDataTableLogicResult<TData, TClientFilters> {
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;

  const [data, setData] = useState<TData[]>(initialData);
  const [totalItems, setTotalItems] = useState<number>(initialTotalItems);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const [searchValue, setSearchValue] = useState<string>(initialFilters.search || '');
  const debouncedSearchValue = useDebounceValue(searchValue, searchDebounceMs);
  
  const [clientFilters, setClientFilters] = useState<TClientFilters>(() => {
      const { page, limit, ordering, search, ...rest } = initialFilters;
      return rest as TClientFilters;
  });
  
  const initialPageSize = useMemo(() => {
    const requestedSize = initialFilters.limit || defaultPageSize;
    if (pageSizeOptions.includes(requestedSize)) {
      return requestedSize;
    }
    return pageSizeOptions.reduce((prev, curr) =>
      Math.abs(curr - requestedSize) < Math.abs(prev - requestedSize) ? curr : prev
    );
  }, [initialFilters.limit, defaultPageSize, pageSizeOptions]);
  
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: Math.max(0, (initialFilters.page || 1) - 1),
    pageSize: initialPageSize,
  });
  
  const [sorting, setSorting] = useState<SortingState>(() => {
    if (!initialFilters.ordering) return [];
    
    const order = initialFilters.ordering;
    const isDesc = order.startsWith('-');
    const field = isDesc ? order.substring(1) : order;
    
    return [{ id: field, desc: isDesc }];
  });
  
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [fetchTrigger, setFetchTrigger] = useState(0);
  const isMounted = useRef(false);
  
  const pageCount = useMemo(() => {
    return pagination.pageSize > 0 ? Math.ceil(totalItems / pagination.pageSize) : 0;
  }, [totalItems, pagination.pageSize]);
  
  const getCurrentClientFilters = useCallback((): BaseClientFilterParams & TClientFilters => {
    const baseFilters = { ...clientFilters } as Partial<BaseClientFilterParams & TClientFilters>;
    
    baseFilters.page = pagination.pageIndex + 1;
    baseFilters.limit = pagination.pageSize;
    baseFilters.search = debouncedSearchValue || undefined;
    baseFilters.ordering = sorting.length > 0 ? `${sorting[0].desc ? '-' : ''}${sorting[0].id}` : undefined;
    
    Object.keys(baseFilters).forEach(key => {
        const k = key as keyof typeof baseFilters;
        if (baseFilters[k] === undefined || baseFilters[k] === null || baseFilters[k] === '') {
          delete baseFilters[k];
        }
      });

    return baseFilters as BaseClientFilterParams & TClientFilters;
  }, [pagination, sorting, clientFilters, debouncedSearchValue]);
  
  const updateUrl = useCallback(() => {
    if (!updateUrlOnFilterChange) return;
    
    const clientFiltersForUrl = getCurrentClientFilters();
    const queryParams = new URLSearchParams();
    
    Object.entries(clientFiltersForUrl).forEach(([key, value]) => {
        if (key === 'page' && value === 1) return;
        if (key === 'limit' && value === defaultPageSize) return;
        if (key === 'search' && !value) return;
        if (key === 'ordering' && !value) return;

        if (value !== undefined && value !== null && value !== '') {
             if (Array.isArray(value)) {
                 value.forEach(v => queryParams.append(key, String(v)))
             } else {
                queryParams.set(key, String(value));
             }
        }
    });
    
    const url = `${pathname}?${queryParams.toString()}`;
    navigate(url, { replace: true });
  }, [pathname, navigate, updateUrlOnFilterChange, defaultPageSize, getCurrentClientFilters]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const apiFilters = mapClientFiltersToApiFilters(
        pagination,
        sorting,
        clientFilters,
        debouncedSearchValue || undefined
    );

    try {
      const response = await fetchDataFn(apiFilters);

      if (response && typeof response === 'object' && 'pagination' in response && 'data' in response) {
        const { data: responseData, pagination: responsePagination } = response as ApiResponse<TData>;

        if (Array.isArray(responseData)) {
          setData(responseData);

          if (responsePagination && typeof responsePagination.count === 'number') {
            setTotalItems(responsePagination.count);
            
            if (responsePagination.page_size && responsePagination.page_size !== pagination.pageSize) {
                setPagination(prev => ({ ...prev, pageSize: responsePagination.page_size }));
            }
          } else {
             setTotalItems(responseData.length);
          }
        } else {
          setData([]);
          setTotalItems(0);
        }
      } 
      else if (response && Array.isArray((response as { items: unknown }).items) && typeof (response as { total: unknown }).total === 'number') {
        const responseWithItems = response as { items: TData[]; total: number };
        setData(responseWithItems.items);
        setTotalItems(responseWithItems.total);
      } 
      else {
        setData([]);
        setTotalItems(0);
      }
    } catch (error) {
      showError(error instanceof Error ? error : new Error("خطای نامشخص"), {
          customMessage: getAction('dataLoadError'),
      });
      setData([]);
      setTotalItems(0);
    } finally {
      setIsLoading(false);
    }
  }, [fetchDataFn, mapClientFiltersToApiFilters, pagination, sorting, clientFilters, debouncedSearchValue]);
   
  useEffect(() => {
    if (!isMounted.current && initialData.length > 0) {
        isMounted.current = true;
        updateUrl();
        return;
    }
    if (!isMounted.current) {
        isMounted.current = true;
        if (initialData.length === 0) {
            fetchData();
            updateUrl();
        }
        return;
    }
  }, [initialData.length, updateUrl, fetchData]);

  useEffect(() => {
    if (isMounted.current) {
        fetchData();
        updateUrl();
    }
  }, [
    pagination,
    sorting,
    clientFilters,
    debouncedSearchValue,
    fetchTrigger,
  ]);
  
  const triggerRefetch = useCallback(async () => {
    setFetchTrigger(prev => prev + 1);
  }, []);

  const handleFilterChange = useCallback((filterId: keyof TClientFilters | 'search', value: unknown) => {
    
    if (filterId === 'search') {
        setSearchValue(typeof value === 'string' ? value : '');
    } else {
        setClientFilters(prev => ({
            ...prev,
            [filterId]: value === 'all' || value === '' ? undefined : value
        }));
    }
     setPagination(prev => ({ ...prev, pageIndex: 0 }));
  }, []);

  const handleSetSorting = useCallback((updater: SetStateAction<SortingState>) => {
    setSorting(updater);
    setPagination(prev => ({ ...prev, pageIndex: 0 }));
  }, []);

  const handlePaginationChange = useCallback((updater: SetStateAction<PaginationState>) => {
    setPagination(current => {
        const newState = typeof updater === 'function' ? updater(current) : updater;
        if (!pageSizeOptions.includes(newState.pageSize)) {
                         const validPageSize = pageSizeOptions.reduce((prev, curr) =>
                Math.abs(curr - newState.pageSize) < Math.abs(prev - newState.pageSize) ? curr : prev
            );
            return { ...newState, pageSize: validPageSize };
        }
        return newState;
    });
  }, [pageSizeOptions]);

  const handleDeleteItem = useCallback(async (id: number | string) => {
    if (!deleteItemFn) {
              showError(getError('serverError'));
      return;
    }
    try {
      await deleteItemFn(id);
      showSuccess(getCrud('deleted', { item: 'آیتم' }));
      triggerRefetch();
      setRowSelection({});
    } catch (error) {
        showError(error);
    }
  }, [deleteItemFn, triggerRefetch, setRowSelection]);
   
  const handleDeleteSelected = useCallback(async (idsToUse?: (string | number)[]) => {
    if (!deleteMultipleItemsFn) {
              showError(getError('serverError'));
      return;
    }
    const selectedIds = idsToUse ?? Object.keys(rowSelection).filter(key => rowSelection[key]).map(key => {
        const rowIndex = parseInt(key, 10);
        if (!isNaN(rowIndex) && data[rowIndex]) {
            return data[rowIndex][idField];
        }
                return null;
    }).filter(id => id !== null) as (string | number)[];

    if (!selectedIds || selectedIds.length === 0) {
      showInfo(getAction('noSelection'));
      return;
    }

    try {
      await deleteMultipleItemsFn(selectedIds);
      showSuccess(getCrud('deleted', { item: 'آیتم' }));
      triggerRefetch();
      setRowSelection({});
    } catch (error) {
        showError(error);
    }
  }, [deleteMultipleItemsFn, triggerRefetch, setRowSelection, rowSelection, data, idField]);
  
  return {
    data,
    totalItems,
    pageCount,
    isLoading,
    pagination,
    setPagination: handlePaginationChange,
    sorting,
    setSorting: handleSetSorting,
    clientFilters,
    handleFilterChange,
    rowSelection,
    setRowSelection,
    columnVisibility,
    setColumnVisibility,
    refetchData: triggerRefetch,
    handleDeleteItem,
    handleDeleteSelected,
    hasSelectedItems: Object.keys(rowSelection).length > 0,
    searchValue,
  };
} 