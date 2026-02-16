import { fetchApi } from "@/core/config/fetch";
import {
    Property,
    PropertyType,
    PropertyState,
    PropertyLabel,
    PropertyTag,
    PropertyFeature
} from "@/types/real-estate/property";
import { RealEstateListParams, RealEstateTaxonomyListParams } from "@/types/real-estate/realEstateListParams";
import { PaginatedResponse } from "@/types/shared/pagination";
import { withQuery, toPaginatedResponse } from "@/api/shared";

export const realEstateApi = {
    getProperties: async (params?: RealEstateListParams): Promise<PaginatedResponse<Property>> => {
        const response = await fetchApi.get<Property[]>(withQuery('/real-estate/properties/', params as Record<string, unknown>));
        return toPaginatedResponse<Property>(response, params?.size || 10);
    },

    getPropertyDetail: async (slugOrId: string | number): Promise<Property> => {
        const response = await fetchApi.get<Property>(`/real-estate/properties/${slugOrId}/`);
        return response.data;
    },

    getTypes: async (params?: RealEstateTaxonomyListParams): Promise<PaginatedResponse<PropertyType>> => {
        const response = await fetchApi.get<PropertyType[]>(withQuery('/real-estate/types/', params as Record<string, unknown>));
        return toPaginatedResponse<PropertyType>(response, params?.size || 50);
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
