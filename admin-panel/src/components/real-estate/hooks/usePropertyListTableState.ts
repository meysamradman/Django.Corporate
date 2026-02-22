import { useEffect, useState } from 'react';
import type { OnChangeFn, SortingState } from '@tanstack/react-table';
import type { TablePaginationState } from '@/types/shared/pagination';
import type { PropertyFilters } from '@/types/real_estate/realEstateListParams';
import type { PropertyType } from '@/types/real_estate/type/propertyType';
import type { PropertyState } from '@/types/real_estate/listing-types/realEstateListingTypes';
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

  const [provinceOptions, setProvinceOptions] = useState<{ label: string; value: string }[]>([]);
  const [cityOptions, setCityOptions] = useState<{ label: string; value: string }[]>([]);
  const [regionOptions, setRegionOptions] = useState<{ label: string; value: string }[]>([]);
  const [agentOptions, setAgentOptions] = useState<{ label: string; value: string }[]>([]);
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

      const province = urlParams.get('province');
      if (province) filters.province = parseInt(province);

      const region = urlParams.get('region');
      if (region) filters.region = parseInt(region);

      const agent = urlParams.get('agent');
      if (agent) filters.agent = agent;

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

      const province = urlParams.get('province');
      if (province) filters.province = parseInt(province);

      const region = urlParams.get('region');
      if (region) filters.region = parseInt(region);

      const agent = urlParams.get('agent');
      if (agent) filters.agent = agent;

      filters.status = parseStringParam(urlParams, 'status');

      Object.assign(filters, parseDateRange(urlParams));

      return filters;
    }
  );

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [typesResponse, statesResponse, provincesResponse, citiesResponse, agentsResponse] = await Promise.all([
          realEstateApi.getTypes({ page: 1, size: 1000, is_active: true }),
          realEstateApi.getListingTypes({ page: 1, size: 1000, is_active: true }),
          realEstateApi.getProvinces(),
          realEstateApi.getCitiesWithProperties(),
          realEstateApi.getAgents({ page: 1, size: 1000, is_active: true }),
        ]);

        setPropertyTypes(typesResponse.data);
        setPropertyTypeOptions(convertPropertyTypesToHierarchical(typesResponse.data));

        setStates(statesResponse.data);
        setStateOptions(statesResponse.data.map((s: PropertyState) => ({ label: s.title, value: s.id.toString() })));

        setProvinceOptions(provincesResponse.map((province) => ({
          label: province.name,
          value: province.id.toString(),
        })));

        setCityOptions(citiesResponse.map(city => ({
          label: `${city.name} (${(city as any).property_count || 0} ملک)`,
          value: city.id.toString()
        })));

        setAgentOptions(
          agentsResponse.data.map((agent) => ({
            label: agent.full_name || `${agent.first_name || ''} ${agent.last_name || ''}`.trim() || `مشاور #${agent.id}`,
            value: agent.id.toString(),
          }))
        );

        const fieldOptions = await realEstateApi.getFieldOptions();
        if (fieldOptions.status) {
          setStatusOptions(fieldOptions.status.map(([value, label]) => ({ label, value })));
        }
      } catch {
      }
    };

    fetchOptions();
  }, []);

  useEffect(() => {
    const fetchRegions = async () => {
      try {
        const selectedCity = clientFilters.city;
        if (!selectedCity) {
          setRegionOptions([]);
          return;
        }

        const cityId = typeof selectedCity === 'string' ? parseInt(selectedCity, 10) : Number(selectedCity);
        if (!cityId || Number.isNaN(cityId)) {
          setRegionOptions([]);
          return;
        }

        const regions = await realEstateApi.getCityRegionsByCity(cityId);
        setRegionOptions(regions.map((region) => ({
          label: region.name,
          value: region.id.toString(),
        })));
      } catch {
        setRegionOptions([]);
      }
    };

    fetchRegions();
  }, [clientFilters.city]);

  useEffect(() => {
    const fetchCitiesByProvince = async () => {
      try {
        const selectedProvince = clientFilters.province;
        const selectedValue = Array.isArray(selectedProvince)
          ? selectedProvince[0]
          : selectedProvince;

        if (!selectedValue) {
          const cities = await realEstateApi.getCitiesWithProperties();
          setCityOptions(cities.map(city => ({
            label: `${city.name} (${(city as any).property_count || 0} ملک)`,
            value: city.id.toString(),
          })));
          return;
        }

        const provinceId = typeof selectedValue === 'string'
          ? parseInt(selectedValue, 10)
          : Number(selectedValue);

        if (!provinceId || Number.isNaN(provinceId)) {
          return;
        }

        const cities = await realEstateApi.getCitiesWithProperties(provinceId);
        setCityOptions(cities.map(city => ({
          label: `${city.name} (${(city as any).property_count || 0} ملک)`,
          value: city.id.toString(),
        })));
      } catch {
      }
    };

    fetchCitiesByProvince();
  }, [clientFilters.province]);

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
      },
      province: (value, updateUrl) => {
        const provinceValue = value
          ? Array.isArray(value)
            ? value.map(v => String(v)).join(',')
            : String(value)
          : undefined;

        setClientFilters(prev => ({
          ...prev,
          province: provinceValue as string | undefined,
          city: undefined,
          region: undefined,
        }));
        setRegionOptions([]);
        setPagination(prev => ({ ...prev, pageIndex: 0 }));

        const url = new URL(window.location.href);
        if (provinceValue && provinceValue !== '') {
          url.searchParams.set('province', provinceValue);
        } else {
          url.searchParams.delete('province');
        }
        url.searchParams.delete('city');
        url.searchParams.delete('region');
        updateUrl(url);
      },
      city: (value, updateUrl) => {
        const cityValue = value
          ? Array.isArray(value)
            ? value.map(v => String(v)).join(',')
            : String(value)
          : undefined;

        setClientFilters(prev => ({
          ...prev,
          city: cityValue as string | undefined,
          region: undefined,
        }));
        setPagination(prev => ({ ...prev, pageIndex: 0 }));

        const url = new URL(window.location.href);
        if (cityValue && cityValue !== '') {
          url.searchParams.set('city', cityValue);
        } else {
          url.searchParams.delete('city');
        }
        url.searchParams.delete('region');
        updateUrl(url);
      },
      region: (value, updateUrl) => {
        const regionValue = value
          ? Array.isArray(value)
            ? value.map(v => String(v)).join(',')
            : String(value)
          : undefined;

        setClientFilters(prev => ({
          ...prev,
          region: regionValue as string | undefined,
        }));
        setPagination(prev => ({ ...prev, pageIndex: 0 }));

        const url = new URL(window.location.href);
        if (regionValue && regionValue !== '') {
          url.searchParams.set('region', regionValue);
        } else {
          url.searchParams.delete('region');
        }
        updateUrl(url);
      },
      agent: (value, updateUrl) => {
        const agentValue = value
          ? Array.isArray(value)
            ? value.map(v => String(v)).join(',')
            : String(value)
          : undefined;
        setClientFilters(prev => ({
          ...prev,
          agent: agentValue as string | undefined
        }));
        setPagination(prev => ({ ...prev, pageIndex: 0 }));

        const url = new URL(window.location.href);
        if (agentValue && agentValue !== '') {
          url.searchParams.set('agent', agentValue);
        } else {
          url.searchParams.delete('agent');
        }
        updateUrl(url);
      }
    }
  );

  const propertyFilterConfig = getPropertyFilterConfig(
    booleanFilterOptions,
    propertyTypeOptions,
    stateOptions,
    provinceOptions,
    cityOptions,
    regionOptions,
    agentOptions,
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
