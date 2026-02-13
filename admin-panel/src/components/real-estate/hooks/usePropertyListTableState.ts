import { useEffect, useState } from 'react';
import type { OnChangeFn, SortingState } from '@tanstack/react-table';
import type { TablePaginationState } from '@/types/shared/pagination';
import type { PropertyFilters } from '@/types/real_estate/realEstateListParams';
import type { PropertyType } from '@/types/real_estate/type/propertyType';
import type { PropertyState } from '@/types/real_estate/state/realEstateState';
import type { CategoryItem } from '@/types/shared/table';
import { initSortingFromURL } from '@/components/tables/utils/tableSorting';
import { useTableFilters } from '@/components/tables/utils/useTableFilters';
import { useURLStateSync, parseBooleanParam, parseStringParam, parseDateRange } from '@/core/hooks/useURLStateSync';
import { usePropertyFilterOptions, getPropertyFilterConfig } from '@/components/real-estate/properties/list/RealEstateTableFilters';
import { realEstateApi } from '@/api/real-estate';

const convertPropertyTypesToHierarchical = (types: PropertyType[]): CategoryItem[] => {
  const rootTypes = types.filter(type => !type.parent_id);

  const buildTree = (type: PropertyType): CategoryItem => {
    const children = types.filter(t => t.parent_id === type.id);

    return {
      id: type.id,
      label: type.title,
      value: type.id.toString(),
      parent_id: type.parent_id,
      children: children.map(buildTree)
    };
  };

  return rootTypes.map(buildTree);
};

interface UsePropertyListTableStateParams {
  navigate: (to: string, options?: { replace?: boolean }) => void;
}

export function usePropertyListTableState({ navigate }: UsePropertyListTableStateParams) {
  const { booleanFilterOptions } = usePropertyFilterOptions();

  const [_propertyTypes, setPropertyTypes] = useState<PropertyType[]>([]);
  const [propertyTypeOptions, setPropertyTypeOptions] = useState<CategoryItem[]>([]);

  const [_states, setStates] = useState<PropertyState[]>([]);
  const [stateOptions, setStateOptions] = useState<{ label: string; value: string }[]>([]);

  const [cityOptions, setCityOptions] = useState<{ label: string; value: string }[]>([]);
  const [statusOptions, setStatusOptions] = useState<{ label: string; value: string }[]>([]);

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

  const [clientFilters, setClientFilters] = useState<PropertyFilters>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const filters: PropertyFilters = {};

      const isPublished = urlParams.get('is_published');
      if (isPublished !== null) filters.is_published = isPublished === 'true';

      const isFeatured = urlParams.get('is_featured');
      if (isFeatured !== null) filters.is_featured = isFeatured === 'true';

      const isActive = urlParams.get('is_active');
      if (isActive !== null) filters.is_active = isActive === 'true';

      const propertyType = urlParams.get('property_type');
      if (propertyType) filters.property_type = parseInt(propertyType);

      const state = urlParams.get('state');
      if (state) filters.state = parseInt(state);

      const city = urlParams.get('city');
      if (city) filters.city = parseInt(city);

      const status = urlParams.get('status');
      if (status) filters.status = status;

      const dateFrom = urlParams.get('date_from');
      if (dateFrom) filters.date_from = dateFrom;

      const dateTo = urlParams.get('date_to');
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
      const filters: PropertyFilters = {};

      filters.is_published = parseBooleanParam(urlParams, 'is_published');
      filters.is_featured = parseBooleanParam(urlParams, 'is_featured');
      filters.is_active = parseBooleanParam(urlParams, 'is_active');

      const propertyType = urlParams.get('property_type');
      if (propertyType) filters.property_type = parseInt(propertyType);

      const state = urlParams.get('state');
      if (state) filters.state = parseInt(state);

      const city = urlParams.get('city');
      if (city) filters.city = parseInt(city);

      filters.status = parseStringParam(urlParams, 'status');

      Object.assign(filters, parseDateRange(urlParams));

      return filters;
    }
  );

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [typesResponse, statesResponse, citiesResponse] = await Promise.all([
          realEstateApi.getTypes({ page: 1, size: 1000, is_active: true }),
          realEstateApi.getStates({ page: 1, size: 1000, is_active: true }),
          realEstateApi.getCitiesWithProperties(),
        ]);

        setPropertyTypes(typesResponse.data);
        setPropertyTypeOptions(convertPropertyTypesToHierarchical(typesResponse.data));

        setStates(statesResponse.data);
        setStateOptions(statesResponse.data.map((s: PropertyState) => ({ label: s.title, value: s.id.toString() })));

        setCityOptions(citiesResponse.map(city => ({
          label: `${city.name} (${(city as any).property_count || 0} ملک)`,
          value: city.id.toString()
        })));

        const fieldOptions = await realEstateApi.getFieldOptions();
        if (fieldOptions.status) {
          setStatusOptions(fieldOptions.status.map(([value, label]) => ({ label, value })));
        }
      } catch {
      }
    };

    fetchOptions();
  }, []);

  const { handleFilterChange } = useTableFilters<PropertyFilters>(
    setClientFilters,
    setSearchValue,
    setPagination,
    {
      property_type: (value, updateUrl) => {
        const numValue = value ? (typeof value === 'string' ? parseInt(value) : value) : undefined;
        setClientFilters(prev => ({
          ...prev,
          property_type: numValue as number | undefined
        }));
        setPagination(prev => ({ ...prev, pageIndex: 0 }));

        const url = new URL(window.location.href);
        if (numValue && numValue !== 0) {
          url.searchParams.set('property_type', String(numValue));
        } else {
          url.searchParams.delete('property_type');
        }
        updateUrl(url);
      },
      status: (value, updateUrl) => {
        const statusValue = value ? (typeof value === 'string' ? value : String(value)) : undefined;
        setClientFilters(prev => ({
          ...prev,
          status: statusValue as string | undefined
        }));
        setPagination(prev => ({ ...prev, pageIndex: 0 }));

        const url = new URL(window.location.href);
        if (statusValue && statusValue !== '') {
          url.searchParams.set('status', statusValue);
        } else {
          url.searchParams.delete('status');
        }
        updateUrl(url);
      }
    }
  );

  const propertyFilterConfig = getPropertyFilterConfig(
    booleanFilterOptions,
    propertyTypeOptions,
    stateOptions,
    cityOptions,
    statusOptions
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
    propertyFilterConfig,
    handlePaginationChange,
    handleSortingChange,
  };
}
