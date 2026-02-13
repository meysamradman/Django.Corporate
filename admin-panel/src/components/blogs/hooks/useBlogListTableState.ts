import { useState, useEffect } from 'react';
import { useTableFilters } from '@/components/tables/utils/useTableFilters';
import { useURLStateSync, parseBooleanParam, parseStringParam, parseDateRange } from '@/core/hooks/useURLStateSync';
import { useBlogFilterOptions, getBlogFilterConfig } from '@/components/blogs/posts/list/BlogTableFilters';
import { initSortingFromURL } from '@/components/tables/utils/tableSorting';
import { blogApi } from '@/api/blogs/blogs';
import type { BlogFilters } from '@/types/blog/blogListParams';
import type { BlogCategory } from '@/types/blog/category/blogCategory';
import type { OnChangeFn, SortingState } from '@tanstack/react-table';
import type { TablePaginationState } from '@/types/shared/pagination';

const convertCategoriesToHierarchical = (categories: BlogCategory[]): any[] => {
  const rootCategories = categories.filter(cat => !cat.parent_id);

  const buildTree = (category: BlogCategory): any => {
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

interface UseBlogListTableStateParams {
  navigate: (to: string, options?: { replace?: boolean }) => void;
}

export function useBlogListTableState({ navigate }: UseBlogListTableStateParams) {
  const { statusFilterOptions, booleanFilterOptions } = useBlogFilterOptions();

  const [_categories, setCategories] = useState<BlogCategory[]>([]);
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
  const [clientFilters, setClientFilters] = useState<BlogFilters>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const filters: BlogFilters = {};
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
        filters.date_range = { from: dateFrom || undefined, to: dateTo || undefined };
      }
      if (dateFrom) filters.date_from = dateFrom;
      if (dateTo) filters.date_to = dateTo;
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
      const filters: BlogFilters = {};

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
        const response = await blogApi.getCategories({
          page: 1,
          size: 1000,
          is_active: true,
          is_public: true
        });

        setCategories(response.data);
        setCategoryOptions(convertCategoriesToHierarchical(response.data));
      } catch (error) {
      }
    };

    fetchCategories();
  }, []);

  const { handleFilterChange } = useTableFilters<BlogFilters>(
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

  const blogFilterConfig = getBlogFilterConfig(
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
    blogFilterConfig,
    handlePaginationChange,
    handleSortingChange,
  };
}
