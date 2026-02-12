import { api } from '@/core/config/api';
import type { ApiResponse } from '@/types/api/apiResponse';
import { showError } from '@/core/toast';
import type { AIProviderList, AIProviderDetail } from '@/types/ai/ai';

export const providersApi = {
    getAll: async (): Promise<ApiResponse<AIProviderList[]>> => {
        try {
            const endpoint = '/admin/ai-providers/';
            return await api.get<AIProviderList[]>(endpoint);
        } catch (error) {
            showError(error);
            throw error;
        }
    },

    getById: async (id: number): Promise<ApiResponse<AIProviderDetail>> => {
        try {
            const endpoint = `/admin/ai-providers/${id}/`;
            return await api.get<AIProviderDetail>(endpoint);
        } catch (error) {
            showError(error);
            throw error;
        }
    },

    getStats: async (): Promise<ApiResponse<{
        total_providers: number;
        total_models: number;
        total_requests: number;
    }>> => {
        try {
            const endpoint = '/admin/ai-providers/stats/';
            return await api.get<{
                total_providers: number;
                total_models: number;
                total_requests: number;
            }>(endpoint);
        } catch (error) {
            showError(error);
            throw error;
        }
    },
};
