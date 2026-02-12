import { api } from '@/core/config/api';
import type { ApiResponse } from '@/types/api/apiResponse';
import { showError } from '@/core/toast';
import type { Media } from '@/types/shared/media';
import type {
    AvailableProvider,
    AIProviderList,
    AIProviderDetail,
    AIModelList,
} from '@/types/ai/ai';
import { throwAIError } from './_shared';

export const imageApi = {
    getProviders: async (): Promise<ApiResponse<AIProviderList[]>> => {
        try {
            const endpoint = '/admin/ai-providers/';
            return await api.get<AIProviderList[]>(endpoint);
        } catch (error) {
            showError(error);
            throw error;
        }
    },

    getAvailableProviders: async (capability: string = 'image'): Promise<ApiResponse<AvailableProvider[]>> => {
        try {
            const endpoint = `/admin/ai-providers/available/?capability=${capability}`;
            return await api.get<AvailableProvider[]>(endpoint);
        } catch (error) {
            const statusCode = (error as any)?.response?.AppStatusCode;
            if (statusCode !== 404) showError(error);
            throw error;
        }
    },

    getProvider: async (id: number): Promise<ApiResponse<AIProviderDetail>> => {
        try {
            const endpoint = `/admin/ai-providers/${id}/`;
            return await api.get<AIProviderDetail>(endpoint);
        } catch (error) {
            showError(error);
            throw error;
        }
    },

    saveProvider: async (data: {
        id?: number;
        provider_name: string;
        api_key?: string;
        shared_api_key?: string;
        is_active?: boolean;
        config?: Record<string, unknown>;
    }): Promise<ApiResponse<AIProviderDetail>> => {
        try {
            const endpoint = data.id
                ? `/admin/ai-providers/${data.id}/`
                : '/admin/ai-providers/';

            const method = data.id ? 'patch' : 'post';
            return await api[method]<AIProviderDetail>(endpoint, data as Record<string, unknown>);
        } catch (error) {
            showError(error);
            throw error;
        }
    },

    toggleProvider: async (id: number, activate: boolean): Promise<ApiResponse<AIProviderDetail>> => {
        try {
            const endpoint = `/admin/ai-providers/${id}/${activate ? 'activate' : 'deactivate'}/`;
            return await api.post<AIProviderDetail>(endpoint, {});
        } catch (error) {
            showError(error);
            throw error;
        }
    },

    validateApiKey: async (id: number): Promise<ApiResponse<{ valid: boolean; message: string }>> => {
        try {
            const endpoint = `/admin/ai-providers/${id}/validate-api-key/`;
            return await api.post<{ valid: boolean; message: string }>(endpoint, {});
        } catch (error) {
            showError(error);
            throw error;
        }
    },

    getOpenRouterModels: async (provider?: string): Promise<ApiResponse<AIModelList[]>> => {
        try {
            const params = new URLSearchParams({
                provider: 'openrouter',
                capability: 'image',
                use_cache: 'true'
            });
            if (provider) params.append('provider_filter', provider);
            const endpoint = `/admin/ai-models/browse-models/?${params.toString()}`;
            return await api.get<AIModelList[]>(endpoint);
        } catch (error) {
            throw error;
        }
    },

    getHuggingFaceModels: async (task?: string): Promise<ApiResponse<AIModelList[]>> => {
        try {
            const params = new URLSearchParams({
                provider: 'huggingface',
                capability: 'image',
                use_cache: 'true'
            });
            if (task) params.append('task_filter', task);
            const endpoint = `/admin/ai-models/browse-models/?${params.toString()}`;
            return await api.get<AIModelList[]>(endpoint);
        } catch (error) {
            throw error;
        }
    },

    generateImage: async (data: {
        provider_name: string;
        prompt: string;
        title?: string;
        alt_text?: string;
        size?: string;
        quality?: string;
        save_to_media?: boolean;
        model?: string;
    }): Promise<ApiResponse<Media>> => {
        const endpoint = '/admin/ai-images/generate/';
        try {
            return await api.post<Media>(endpoint, data as Record<string, unknown>);
        } catch (error) {
            return throwAIError(error);
        }
    },
};
