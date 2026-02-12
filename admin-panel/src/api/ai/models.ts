import { api } from '@/core/config/api';
import type { ApiResponse } from '@/types/api/apiResponse';
import { showError } from '@/core/toast';
import type {
    AIModelList,
    AIModelDetail,
    ActiveCapabilityModelsResponse,
} from '@/types/ai/ai';

export const modelsApi = {
    getAll: async (filters?: {
        provider?: number;
        capability?: string;
        search?: string;
    }): Promise<ApiResponse<AIModelList[]>> => {
        try {
            const params = new URLSearchParams();
            if (filters?.provider) params.append('provider', filters.provider.toString());
            if (filters?.capability) params.append('capability', filters.capability);
            if (filters?.search) params.append('search', filters.search);

            const endpoint = `/admin/ai-models/${params.toString() ? `?${params.toString()}` : ''}`;
            return await api.get<AIModelList[]>(endpoint);
        } catch (error) {
            showError(error);
            throw error;
        }
    },

    getActiveModel: async (providerSlug: string, capability?: string): Promise<ApiResponse<AIModelDetail>> => {
        try {
            const params = new URLSearchParams({ provider: providerSlug });
            if (capability) params.append('capability', capability);
            const endpoint = `/admin/ai-models/active-model/?${params.toString()}`;
            return await api.get<AIModelDetail>(endpoint);
        } catch (error) {
            throw error;
        }
    },

    getById: async (id: number): Promise<ApiResponse<AIModelDetail>> => {
        try {
            const endpoint = `/admin/ai-models/${id}/`;
            return await api.get<AIModelDetail>(endpoint);
        } catch (error) {
            showError(error);
            throw error;
        }
    },

    getByCapability: async (capability: string, includeInactive: boolean = true): Promise<ApiResponse<AIModelList[]>> => {
        try {
            const endpoint = `/admin/ai-models/by_capability/?capability=${capability}&include_inactive=${includeInactive}`;
            return await api.get<AIModelList[]>(endpoint);
        } catch (error) {
            showError(error);
            throw error;
        }
    },

    getByProvider: async (providerSlug: string, capability?: string): Promise<ApiResponse<AIModelList[]>> => {
        try {
            const params = new URLSearchParams({ provider: providerSlug });
            if (capability) params.append('capability', capability);

            const endpoint = `/admin/ai-models/by_provider/?${params.toString()}`;
            return await api.get<AIModelList[]>(endpoint);
        } catch (error) {
            showError(error);
            throw error;
        }
    },

    update: async (id: number, data: Partial<AIModelList>): Promise<ApiResponse<AIModelDetail>> => {
        try {
            const endpoint = `/admin/ai-models/${id}/`;
            return await api.patch<AIModelDetail>(endpoint, data as Record<string, unknown>);
        } catch (error) {
            showError(error);
            throw error;
        }
    },

    create: async (data: Partial<AIModelList>): Promise<ApiResponse<AIModelDetail>> => {
        try {
            const endpoint = '/admin/ai-models/';
            return await api.post<AIModelDetail>(endpoint, data as Record<string, unknown>);
        } catch (error) {
            showError(error);
            throw error;
        }
    },

    selectModel: async (data: {
        provider: string;
        capability: string;
        model_id?: string;
        model_name?: string;
        pricing_input?: number;
        pricing_output?: number;
    }): Promise<ApiResponse<AIModelDetail>> => {
        try {
            const endpoint = '/admin/ai-models/select-provider/';
            return await api.post<AIModelDetail>(endpoint, data as Record<string, unknown>);
        } catch (error) {
            throw error;
        }
    },

    deactivateModel: async (data: {
        provider: string;
        model_id: string;
    }): Promise<ApiResponse<{ model_id: string; is_active: boolean }>> => {
        try {
            const endpoint = '/admin/ai-models/deactivate-model/';
            return await api.post<{ model_id: string; is_active: boolean }>(endpoint, data as Record<string, unknown>);
        } catch (error) {
            throw error;
        }
    },

    getModels: async (provider: string, capability: string): Promise<ApiResponse<AIModelList[]>> => {
        const params = new URLSearchParams({
            provider: provider.toLowerCase(),
            capability: capability,
            use_cache: 'true'
        });
        const endpoint = `/admin/ai-models/browse-models/?${params.toString()}`;
        return await api.get<AIModelList[]>(endpoint);
    },

    getActiveCapabilities: async (): Promise<ApiResponse<ActiveCapabilityModelsResponse>> => {
        try {
            const endpoint = '/admin/ai-models/active-capabilities/';
            return await api.get<ActiveCapabilityModelsResponse>(endpoint);
        } catch (error) {
            showError(error);
            throw error;
        }
    },
};
