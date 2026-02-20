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
import { withQuery, toPaginatedResponse } from "@/api/shared";

export const realEstateApi = {
    getFeaturedProperties: async (limit: number = 4): Promise<Property[]> => {
        const response = await fetchApi.get<Property[]>(withQuery('/real-estate/properties/featured/', { limit }));
        return response.data;
    },

    getProperties: async (params?: RealEstateListParams): Promise<PaginatedResponse<Property>> => {
        const response = await fetchApi.get<Property[]>(withQuery('/real-estate/properties/', params as Record<string, unknown>));
        return toPaginatedResponse<Property>(response, params?.size || 10);
    },

    getPropertyByNumericId: async (id: string | number): Promise<Property> => {
        const response = await fetchApi.get<Property>(`/real-estate/properties/id/${id}/`);
        return response.data;
    },

    getPropertyBySlug: async (slug: string): Promise<Property> => {
        const response = await fetchApi.get<Property>(`/real-estate/properties/${slug}/`);
        return response.data;
    },

    getPropertyByPublicId: async (publicId: string): Promise<Property> => {
        const response = await fetchApi.get<Property>(`/real-estate/properties/p/${publicId}/`);
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

    getProvinces: async (params?: { page?: number; size?: number; search?: string }): Promise<PaginatedResponse<ProvinceCompact>> => {
        const response = await fetchApi.get<ProvinceCompact[]>(withQuery('/real-estate/provinces/', params as Record<string, unknown>));
        return toPaginatedResponse<ProvinceCompact>(response, params?.size || 100);
    },

    getCities: async (params?: { page?: number; size?: number; search?: string; province_id?: number | string }): Promise<PaginatedResponse<CityCompact & { province_id?: number }>> => {
        const response = await fetchApi.get<(CityCompact & { province_id?: number })[]>(withQuery('/real-estate/cities/', params as Record<string, unknown>));
        return toPaginatedResponse<CityCompact & { province_id?: number }>(response, params?.size || 300);
    },

    getRegions: async (params?: { page?: number; size?: number; search?: string; province_id?: number | string; city_id?: number | string }): Promise<PaginatedResponse<RegionCompact>> => {
        const response = await fetchApi.get<RegionCompact[]>(withQuery('/real-estate/regions/', params as Record<string, unknown>));
        return toPaginatedResponse<RegionCompact>(response, params?.size || 600);
    },

    getTypeBySlug: async (slug: string): Promise<PropertyType> => {
        const response = await fetchApi.get<PropertyType>(`/real-estate/types/${encodeURIComponent(slug)}/`);
        return response.data;
    },

    getStates: async (params?: RealEstateTaxonomyListParams): Promise<PaginatedResponse<PropertyState>> => {
        const limit = params?.size;
        const offset = params?.page && params?.size ? (params.page - 1) * params.size : undefined;
        const queryParams = {
            ...params,
            limit,
            offset,
            page: undefined,
            size: undefined,
        } as Record<string, unknown>;

        const response = await fetchApi.get<PropertyState[]>(withQuery('/real-estate/states/', queryParams));
        return toPaginatedResponse<PropertyState>(response, limit || 50);
    },

    getListingTypes: async (): Promise<PropertyStatusOption[]> => {
        const response = await fetchApi.get<PropertyStatusOption[]>('/real-estate/states/usage-types/');
        return response.data;
    },

    getStateBySlug: async (slug: string): Promise<PropertyState> => {
        const response = await fetchApi.get<PropertyState>(`/real-estate/states/${encodeURIComponent(slug)}/`);
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
