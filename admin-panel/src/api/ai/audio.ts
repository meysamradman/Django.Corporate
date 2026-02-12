import { api } from '@/core/config/api';
import type { ApiResponse } from '@/types/api/apiResponse';
import { showError } from '@/core/toast';
import type { Media } from '@/types/shared/media';
import type { AvailableProvider } from '@/types/ai/ai';
import { throwAIError } from './_shared';

export const audioApi = {
    getAvailableProviders: async (): Promise<ApiResponse<AvailableProvider[]>> => {
        try {
            const endpoint = '/admin/ai-providers/available/?capability=audio';
            return await api.get<AvailableProvider[]>(endpoint);
        } catch (error) {
            const statusCode = (error as any)?.response?.AppStatusCode;
            if (statusCode !== 404) showError(error);
            throw error;
        }
    },

    generateAudio: async (data: {
        provider_name: string;
        text: string;
        title?: string;
        model?: string;
        voice?: string;
        speed?: number;
        response_format?: string;
        save_to_db?: boolean;
    }): Promise<ApiResponse<Media | { audio_data_url: string; saved: boolean }>> => {
        const endpoint = '/admin/ai-audio/generate/';
        try {
            return await api.post<Media | { audio_data_url: string; saved: boolean }>(endpoint, data as Record<string, unknown>);
        } catch (error) {
            return throwAIError(error);
        }
    },
};
