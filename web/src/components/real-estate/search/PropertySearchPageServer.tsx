import { realEstateApi } from "@/api/real-estate/route";
import PropertySearchClient from "@/components/real-estate/search/PropertySearchClient";
import { toPropertyListApiParams } from "@/components/real-estate/search/filters";
import { resolvePaginatedData } from "@/core/utils/pagination";
import type { PropertySearchFilters } from "@/types/real-estate/searchFilters";

type PropertySearchPageServerProps = {
  filters: PropertySearchFilters;
};

export default async function PropertySearchPageServer({ filters }: PropertySearchPageServerProps) {
  const [propertiesResponse, typesResponse, statesResponse, labelsResponse, tagsResponse, featuresResponse, statusesResponse] = await Promise.all([
    realEstateApi.getProperties(toPropertyListApiParams(filters)).catch(() => null),
    realEstateApi.getTypes({ page: 1, size: 100 }).catch(() => null),
    realEstateApi.getStates({ page: 1, size: 100 }).catch(() => null),
    realEstateApi.getLabels({ page: 1, size: 100 }).catch(() => null),
    realEstateApi.getTags({ page: 1, size: 100 }).catch(() => null),
    realEstateApi.getFeatures({ page: 1, size: 200 }).catch(() => null),
    realEstateApi.getPropertyStatuses().catch(() => []),
  ]);

  const { items: properties, pagination } = resolvePaginatedData(propertiesResponse, filters.page);
  const totalCount = pagination.count;
  const totalPages = pagination.total_pages;
  const currentPage = pagination.current_page;

  const typeOptions = (typesResponse?.data ?? []).map((item) => ({
    id: item.id,
    value: String(item.id),
    title: item.name,
    slug: item.slug,
  }));

  const stateOptions = (statesResponse?.data ?? []).map((item) => ({
    id: item.id,
    value: String(item.id),
    title: item.title || item.name,
    slug: item.slug,
  }));

  const labelOptions = (labelsResponse?.data ?? []).map((item) => ({
    id: item.id,
    value: item.public_id,
    title: item.name,
  }));

  const tagOptions = (tagsResponse?.data ?? []).map((item) => ({
    id: item.id,
    value: item.slug,
    title: item.name,
  }));

  const featureOptions = (featuresResponse?.data ?? []).map((item) => ({
    id: item.id,
    value: item.public_id,
    title: item.name,
  }));

  const statusOptions = (statusesResponse ?? []).map((item, index) => ({
    id: index + 1,
    value: item.value,
    title: item.label,
  }));

  return (
    <PropertySearchClient
      initialFilters={filters}
      initialProperties={properties}
      initialTotalCount={totalCount}
      initialTotalPages={totalPages}
      initialCurrentPage={currentPage}
      typeOptions={typeOptions}
      stateOptions={stateOptions}
      labelOptions={labelOptions}
      tagOptions={tagOptions}
      featureOptions={featureOptions}
      statusOptions={statusOptions}
    />
  );
}
