import { fetchApi } from "@/core/config/fetch";
import {
    Property,
    FloorPlan,
    PropertyType,
    PropertyState,
    PropertyLabel,
    PropertyTag,
    PropertyFeature,
    PropertyStatusOption,
} from "@/types/real-estate/property";
import { RealEstateListParams, RealEstateTaxonomyListParams } from "@/types/real-estate/realEstateListParams";
import { PaginatedResponse } from "@/types/shared/pagination";
import { CityCompact, ProvinceCompact, RegionCompact } from "@/types/shared/location";
import { withQuery, toLimitOffsetQuery, toPaginatedResponse } from "@/api/shared";

const REAL_ESTATE_CACHE = {
    list: { cache: 'no-store' as const },
    featured: { next: { revalidate: 15, tags: ['re:properties:featured'] } },
    detail: { next: { revalidate: 60, tags: ['re:properties:detail'] } },
};

export const realEstateApi = {
    getFeaturedProperties: async (limit: number = 4): Promise<Property[]> => {
        const response = await fetchApi.get<Property[]>(
            withQuery('/real-estate/properties/featured/', { limit }),
            REAL_ESTATE_CACHE.featured
        );
        return response.data;
    },

    getProperties: async (params?: RealEstateListParams): Promise<PaginatedResponse<Property>> => {
        const queryParams = toLimitOffsetQuery(params as (RealEstateListParams & Record<string, unknown>) | undefined);

        const response = await fetchApi.get<Property[]>(
            withQuery('/real-estate/properties/', queryParams),
            REAL_ESTATE_CACHE.list
        );
        return toPaginatedResponse<Property>(response, params?.size || 10);
    },

    getPropertyByNumericId: async (id: string | number): Promise<Property> => {
        const response = await fetchApi.get<Property>(`/real-estate/properties/id/${id}/`, REAL_ESTATE_CACHE.detail);
        return response.data;
    },

    getPropertyBySlug: async (slug: string): Promise<Property> => {
        const response = await fetchApi.get<Property>(`/real-estate/properties/${slug}/`, REAL_ESTATE_CACHE.detail);
        return response.data;
    },

    getPropertyByPublicId: async (publicId: string): Promise<Property> => {
        const response = await fetchApi.get<Property>(`/real-estate/properties/p/${publicId}/`, REAL_ESTATE_CACHE.detail);
        return response.data;
    },

    getPropertyStatuses: async (): Promise<PropertyStatusOption[]> => {
        const response = await fetchApi.get<PropertyStatusOption[]>('/real-estate/properties/statuses/');
        return response.data;
    },

    getFloorPlans: async (params?: RealEstateTaxonomyListParams & { property_id?: number | string }): Promise<PaginatedResponse<FloorPlan>> => {
        const response = await fetchApi.get<FloorPlan[]>(withQuery('/real-estate/floor-plans/', params as Record<string, unknown>));
        return toPaginatedResponse<FloorPlan>(response, params?.size || 50);
    },

    getFloorPlanByNumericId: async (id: string | number): Promise<FloorPlan> => {
        const response = await fetchApi.get<FloorPlan>(`/real-estate/floor-plans/id/${id}/`);
        return response.data;
    },

    getFloorPlanBySlug: async (slug: string): Promise<FloorPlan> => {
        const response = await fetchApi.get<FloorPlan>(`/real-estate/floor-plans/${slug}/`);
        return response.data;
    },

    getTypes: async (params?: RealEstateTaxonomyListParams): Promise<PaginatedResponse<PropertyType>> => {
        const response = await fetchApi.get<PropertyType[]>(withQuery('/real-estate/types/', params as Record<string, unknown>));
        return toPaginatedResponse<PropertyType>(response, params?.size || 50);
    },

    getProvinces: async (
        params?: { page?: number; size?: number; search?: string; min_property_count?: number; ordering?: string }
    ): Promise<PaginatedResponse<ProvinceCompact>> => {
        const limit = params?.size;
        const queryParams = toLimitOffsetQuery(
            params as ({ page?: number; size?: number; search?: string; min_property_count?: number; ordering?: string } & Record<string, unknown>) | undefined
        );

        const response = await fetchApi.get<ProvinceCompact[]>(withQuery('/real-estate/provinces/', queryParams));
        return toPaginatedResponse<ProvinceCompact>(response, limit || 100);
    },

    getProvinceById: async (id: string | number): Promise<ProvinceCompact> => {
        const response = await fetchApi.get<ProvinceCompact>(`/real-estate/provinces/${id}/`);
        return response.data;
    },

    getCities: async (params?: { page?: number; size?: number; search?: string; province_id?: number | string }): Promise<PaginatedResponse<CityCompact & { province_id?: number }>> => {
        const limit = params?.size;
        const queryParams = toLimitOffsetQuery(params as ({ page?: number; size?: number; search?: string; province_id?: number | string } & Record<string, unknown>) | undefined);

        const response = await fetchApi.get<(CityCompact & { province_id?: number })[]>(withQuery('/real-estate/cities/', queryParams));
        return toPaginatedResponse<CityCompact & { province_id?: number }>(response, limit || 300);
    },

    getCityById: async (id: string | number): Promise<CityCompact & { province_id?: number }> => {
        const response = await fetchApi.get<CityCompact & { province_id?: number }>(`/real-estate/cities/${id}/`);
        return response.data;
    },

    getRegions: async (params?: { page?: number; size?: number; search?: string; province_id?: number | string; city_id?: number | string }): Promise<PaginatedResponse<RegionCompact>> => {
        const limit = params?.size;
        const queryParams = toLimitOffsetQuery(params as ({ page?: number; size?: number; search?: string; province_id?: number | string; city_id?: number | string } & Record<string, unknown>) | undefined);

        const response = await fetchApi.get<RegionCompact[]>(withQuery('/real-estate/regions/', queryParams));
        return toPaginatedResponse<RegionCompact>(response, limit || 600);
    },

    getTypeBySlug: async (slug: string): Promise<PropertyType> => {
        const response = await fetchApi.get<PropertyType>(`/real-estate/types/${encodeURIComponent(slug)}/`);
        return response.data;
    },

    getListingTypes: async (params?: RealEstateTaxonomyListParams): Promise<PaginatedResponse<PropertyState>> => {
        const limit = params?.size;
        const queryParams = toLimitOffsetQuery(params as (RealEstateTaxonomyListParams & Record<string, unknown>) | undefined);

        const response = await fetchApi.get<PropertyState[]>(withQuery('/real-estate/listing-types/', queryParams));
        return toPaginatedResponse<PropertyState>(response, limit || 50);
    },

    getListingTypeUsageOptions: async (): Promise<PropertyStatusOption[]> => {
        const response = await fetchApi.get<PropertyStatusOption[]>('/real-estate/listing-types/usage-types/');
        return response.data;
    },

    getListingTypeBySlug: async (slug: string): Promise<PropertyState> => {
        const response = await fetchApi.get<PropertyState>(`/real-estate/listing-types/${encodeURIComponent(slug)}/`);
        return response.data;
    },

    getLabels: async (params?: RealEstateTaxonomyListParams): Promise<PaginatedResponse<PropertyLabel>> => {
        const response = await fetchApi.get<PropertyLabel[]>(withQuery('/real-estate/labels/', params as Record<string, unknown>));
        return toPaginatedResponse<PropertyLabel>(response, params?.size || 50);
    },

    getTags: async (params?: RealEstateTaxonomyListParams): Promise<PaginatedResponse<PropertyTag>> => {
        const response = await fetchApi.get<PropertyTag[]>(withQuery('/real-estate/tags/', params as Record<string, unknown>));
        return toPaginatedResponse<PropertyTag>(response, params?.size || 50);
    },

    getFeatures: async (params?: RealEstateTaxonomyListParams): Promise<PaginatedResponse<PropertyFeature>> => {
        const response = await fetchApi.get<PropertyFeature[]>(withQuery('/real-estate/features/', params as Record<string, unknown>));
        return toPaginatedResponse<PropertyFeature>(response, params?.size || 50);
    }
};
