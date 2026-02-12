import { useState, useEffect } from 'react';
import { useTableFilters } from '@/components/tables/utils/useTableFilters';
import { useURLStateSync, parseBooleanParam, parseStringParam, parseDateRange } from '@/hooks/useURLStateSync';
import { usePortfolioFilterOptions, getPortfolioFilterConfig } from '@/components/portfolios/projects/list/PortfolioTableFilters';
import { initSortingFromURL } from '@/components/tables/utils/tableSorting';
import { portfolioApi } from '@/api/portfolios/portfolios';
import type { PortfolioFilters } from '@/types/portfolio/portfolioListParams';
import type { PortfolioCategory } from '@/types/portfolio/category/portfolioCategory';
import type { OnChangeFn, SortingState } from '@tanstack/react-table';
import type { TablePaginationState } from '@/types/shared/pagination';

const convertCategoriesToHierarchical = (categories: PortfolioCategory[]): any[] => {
  const rootCategories = categories.filter(cat => !cat.parent_id);

  const buildTree = (category: PortfolioCategory): any => {
    const children = categories.filter(cat => cat.parent_id === category.id);

    return {
      id: category.id,
      label: category.name,
      value: category.id.toString(),
      parent_id: category.parent_id,
      children: children.map(buildTree)
    };
  };

  return rootCategories.map(buildTree);
};

interface UsePortfolioListTableStateParams {
  navigate: (to: string, options?: { replace?: boolean }) => void;
}

export function usePortfolioListTableState({ navigate }: UsePortfolioListTableStateParams) {
  const { statusFilterOptions, booleanFilterOptions } = usePortfolioFilterOptions();

  const [_categories, setCategories] = useState<PortfolioCategory[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<any[]>([]);

  const [pagination, setPagination] = useState<TablePaginationState>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const page = parseInt(urlParams.get('page') || '1', 10);
      const size = parseInt(urlParams.get('size') || '10', 10);
      return {
        pageIndex: Math.max(0, page - 1),
        pageSize: size,
      };
    }
    return {
      pageIndex: 0,
      pageSize: 10,
    };
  });
  const [sorting, setSorting] = useState<SortingState>(() => initSortingFromURL());
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [searchValue, setSearchValue] = useState(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('search') || '';
    }
    return '';
  });
  const [clientFilters, setClientFilters] = useState<PortfolioFilters>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const filters: PortfolioFilters = {};
      if (urlParams.get('status')) filters.status = urlParams.get('status') as string;
      if (urlParams.get('is_featured')) filters.is_featured = urlParams.get('is_featured') === 'true';
      if (urlParams.get('is_public')) filters.is_public = urlParams.get('is_public') === 'true';
      if (urlParams.get('is_active')) filters.is_active = urlParams.get('is_active') === 'true';
      if (urlParams.get('category')) {
        filters.category = urlParams.get('category') as string;
      }
      const dateFrom = urlParams.get('date_from');
      const dateTo = urlParams.get('date_to');
      if (dateFrom || dateTo) {
        (filters as any).date_range = { from: dateFrom || undefined, to: dateTo || undefined };
        filters.date_from = dateFrom || undefined;
        filters.date_to = dateTo || undefined;
      }
      return filters;
    }
    return {};
  });

  useURLStateSync(
    setPagination,
    setSearchValue,
    setSorting,
    setClientFilters,
    (urlParams) => {
      const filters: PortfolioFilters = {};

      filters.is_featured = parseBooleanParam(urlParams, 'is_featured');
      filters.is_public = parseBooleanParam(urlParams, 'is_public');
      filters.is_active = parseBooleanParam(urlParams, 'is_active');

      filters.status = parseStringParam(urlParams, 'status');
      filters.category = parseStringParam(urlParams, 'category');

      Object.assign(filters, parseDateRange(urlParams));

      return filters;
    }
  );

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await portfolioApi.getCategories({
          page: 1,
          size: 1000,
          is_active: true,
          is_public: true
        });

        setCategories(response.data);
        setCategoryOptions(convertCategoriesToHierarchical(response.data));
      } catch {
      }
    };

    fetchCategories();
  }, []);

  const { handleFilterChange } = useTableFilters<PortfolioFilters>(
    setClientFilters,
    setSearchValue,
    setPagination,
    {
      categories: (value, updateUrl) => {
        setClientFilters(prev => ({
          ...prev,
          category: value as string | undefined
        }));
        setPagination(prev => ({ ...prev, pageIndex: 0 }));

        const url = new URL(window.location.href);
        if (value && value !== 'all' && value !== '') {
          url.searchParams.set('category', String(value));
        } else {
          url.searchParams.delete('category');
        }
        updateUrl(url);
      }
    }
  );

  const portfolioFilterConfig = getPortfolioFilterConfig(
    statusFilterOptions,
    booleanFilterOptions,
    categoryOptions
  );

  const handlePaginationChange: OnChangeFn<TablePaginationState> = (updaterOrValue) => {
    const newPagination = typeof updaterOrValue === 'function'
      ? updaterOrValue(pagination)
      : updaterOrValue;

    setPagination(newPagination);

    const url = new URL(window.location.href);
    url.searchParams.set('page', String(newPagination.pageIndex + 1));
    url.searchParams.set('size', String(newPagination.pageSize));
    navigate(url.search, { replace: true });
  };

  const handleSortingChange: OnChangeFn<SortingState> = (updaterOrValue) => {
    const newSorting = typeof updaterOrValue === 'function'
      ? updaterOrValue(sorting)
      : updaterOrValue;

    setSorting(newSorting);

    const url = new URL(window.location.href);
    if (newSorting.length > 0) {
      url.searchParams.set('order_by', newSorting[0].id);
      url.searchParams.set('order_desc', String(newSorting[0].desc));
    } else {
      url.searchParams.delete('order_by');
      url.searchParams.delete('order_desc');
    }
    navigate(url.search, { replace: true });
  };

  return {
    pagination,
    sorting,
    rowSelection,
    setRowSelection,
    searchValue,
    clientFilters,
    handleFilterChange,
    portfolioFilterConfig,
    handlePaginationChange,
    handleSortingChange,
  };
}
