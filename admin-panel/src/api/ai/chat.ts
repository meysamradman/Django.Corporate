import { api } from '@/core/config/api';
import type { ApiResponse } from '@/types/api/apiResponse';
import { showError } from '@/core/toast';
import type { AvailableProvider, AIModelList } from '@/types/ai/ai';
import { throwAIError } from './_shared';

export const chatApi = {
    getAvailableProviders: async (capability: string = 'chat'): Promise<ApiResponse<AvailableProvider[]>> => {
        try {
            const endpoint = `/admin/ai-providers/available/?capability=${capability}`;
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
                capability: 'chat',
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
                capability: 'chat',
                use_cache: 'true'
            });
            if (task) params.append('task_filter', task);
            const endpoint = `/admin/ai-models/browse-models/?${params.toString()}`;
            return await api.get<AIModelList[]>(endpoint);
        } catch (error) {
            throw error;
        }
    },

    sendMessage: async (data: {
        message: string;
        provider_name?: string;
        model_id?: string;
        conversation_history?: Array<{ role: 'user' | 'assistant'; content: string }>;
        system_message?: string;
        temperature?: number;
        max_tokens?: number;
        file?: File | null;
    }): Promise<ApiResponse<{
        message: string;
        reply: string;
        provider_name: string;
        model_name?: string;
        generation_time_ms: number;
    }>> => {
        const endpoint = '/admin/ai-chat/send-message/';

        if (data.file) {
            const formData = new FormData();
            formData.append('message', data.message);
            if (data.provider_name) formData.append('provider_name', data.provider_name);
            if (data.model_id) formData.append('model_id', data.model_id);
            if (data.system_message) formData.append('system_message', data.system_message);
            if (data.temperature) formData.append('temperature', data.temperature.toString());
            if (data.max_tokens) formData.append('max_tokens', data.max_tokens.toString());
            formData.append('image', data.file);

            if (data.conversation_history) {
                formData.append('conversation_history', JSON.stringify(data.conversation_history));
            }

            try {
                return await api.post<{
                    message: string;
                    reply: string;
                    provider_name: string;
                    model_name?: string;
                    generation_time_ms: number;
                }>(endpoint, formData as unknown as Record<string, unknown>);
            } catch (error) {
                return throwAIError(error);
            }
        }

        try {
            return await api.post<{
                message: string;
                reply: string;
                provider_name: string;
                model_name?: string;
                generation_time_ms: number;
            }>(endpoint, data as Record<string, unknown>);
        } catch (error) {
            return throwAIError(error);
        }
    },
};
