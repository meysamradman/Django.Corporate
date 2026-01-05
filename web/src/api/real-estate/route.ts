import { fetchApi } from "@/core/config/fetch";
import {
    Property,
    PropertyType,
    PropertyState,
    PropertyLabel,
    PropertyTag,
    PropertyFeature
} from "@/types/real-estate/property";
import { PaginatedResponse } from "@/types/shared/pagination";

export const realEstateApi = {
    getProperties: async (params?: Record<string, any>): Promise<PaginatedResponse<Property>> => {
        let url = '/public/real-estate/properties/';
        if (params) {
            const queryParams = new URLSearchParams();
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') queryParams.append(key, String(value));
            });
            const queryString = queryParams.toString();
            if (queryString) url += `?${queryString}`;
        }
        const response = await fetchApi.get<Property[]>(url);
        return {
            data: Array.isArray(response.data) ? response.data : [],
            pagination: (response as any).pagination || { count: 0, current_page: 1, total_pages: 0, page_size: 10 }
        };
    },

    getPropertyDetail: async (slugOrId: string | number): Promise<Property> => {
        const response = await fetchApi.get<Property>(`/public/real-estate/properties/${slugOrId}/`);
        return response.data;
    },

    getTypes: async (): Promise<PaginatedResponse<PropertyType>> => {
        const response = await fetchApi.get<PropertyType[]>('/public/real-estate/types/');
        return {
            data: Array.isArray(response.data) ? response.data : [],
            pagination: (response as any).pagination || { count: 0, current_page: 1, total_pages: 0, page_size: 10 }
        };
    },

    getStates: async (): Promise<PaginatedResponse<PropertyState>> => {
        const response = await fetchApi.get<PropertyState[]>('/public/real-estate/states/');
        return {
            data: Array.isArray(response.data) ? response.data : [],
            pagination: (response as any).pagination || { count: 0, current_page: 1, total_pages: 0, page_size: 10 }
        };
    },

    getLabels: async (): Promise<PaginatedResponse<PropertyLabel>> => {
        const response = await fetchApi.get<PropertyLabel[]>('/public/real-estate/labels/');
        return {
            data: Array.isArray(response.data) ? response.data : [],
            pagination: (response as any).pagination || { count: 0, current_page: 1, total_pages: 0, page_size: 10 }
        };
    },

    getTags: async (): Promise<PaginatedResponse<PropertyTag>> => {
        const response = await fetchApi.get<PropertyTag[]>('/public/real-estate/tags/');
        return {
            data: Array.isArray(response.data) ? response.data : [],
            pagination: (response as any).pagination || { count: 0, current_page: 1, total_pages: 0, page_size: 10 }
        };
    },

    getFeatures: async (): Promise<PaginatedResponse<PropertyFeature>> => {
        const response = await fetchApi.get<PropertyFeature[]>('/public/real-estate/features/');
        return {
            data: Array.isArray(response.data) ? response.data : [],
            pagination: (response as any).pagination || { count: 0, current_page: 1, total_pages: 0, page_size: 10 }
        };
    }
};
