import { api } from '@/core/config/api';
import type { ApiResponse } from '@/types/api/apiResponse';
import { showError } from '@/core/toast';
import type {
    AIContentGenerationRequest,
    AIContentGenerationResult,
    AvailableProvider,
    AIModelList,
} from '@/types/ai/ai';
import { throwAIError } from './_shared';

export const contentApi = {
    getDestinations: async (): Promise<ApiResponse<{ key: string; label: string }[]>> => {
        const endpoint = '/admin/ai-content/destinations/';
        return await api.get<{ key: string; label: string }[]>(endpoint);
    },

    getAvailableProviders: async (): Promise<ApiResponse<AvailableProvider[]>> => {
        try {
            const endpoint = '/admin/ai-providers/available/?capability=content';
            return await api.get<AvailableProvider[]>(endpoint);
        } catch (error) {
            const statusCode = (error as any)?.response?.AppStatusCode;
            if (statusCode !== 404) showError(error);
            throw error;
        }
    },

    getOpenRouterModels: async (provider?: string): Promise<ApiResponse<AIModelList[]>> => {
        try {
            const params = new URLSearchParams({
                provider: 'openrouter',
                capability: 'content',
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
                capability: 'content',
                use_cache: 'true'
            });
            if (task) params.append('task_filter', task);
            const endpoint = `/admin/ai-models/browse-models/?${params.toString()}`;
            return await api.get<AIModelList[]>(endpoint);
        } catch (error) {
            throw error;
        }
    },

    generateContent: async (
        data: AIContentGenerationRequest
    ): Promise<ApiResponse<AIContentGenerationResult>> => {
        const endpoint = '/admin/ai-content/generate/';
        try {
            const response = await api.post<AIContentGenerationResult>(endpoint, data as unknown as Record<string, unknown>);
            return response;
        } catch (error) {
            return throwAIError(error);
        }
    },
};
