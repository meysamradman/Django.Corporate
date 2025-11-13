import { fetchApi } from '@/core/config/fetch';
import { ApiResponse } from '@/types/api/apiResponse';
import { ApiError } from '@/types/api/apiError';
import { showErrorToast } from '@/core/config/errorHandler';
import { Media } from '@/types/shared/media';
import {
    AIContentGenerationRequest,
    AIContentGenerationResponse,
    AvailableProvider
} from '@/types/ai/ai';

export const aiApi = {
    /**
     * Image Generation API
     */
    image: {
        /**
         * دریافت لیست Provider های AI
         */
        getProviders: async (): Promise<ApiResponse<any[]>> => {
            try {
                const endpoint = '/admin/ai-providers/';
                return await fetchApi.get<any[]>(endpoint, {
                    cache: 'no-store',
                });
            } catch (error: any) {
                showErrorToast(error?.message || 'خطا در دریافت لیست Provider ها');
                throw error;
            }
        },

        /**
         * دریافت لیست Provider های فعال
         */
        getAvailableProviders: async (): Promise<ApiResponse<any[]>> => {
            try {
                const endpoint = '/admin/ai-providers/available/';
                return await fetchApi.get<any[]>(endpoint, {
                    cache: 'no-store',
                });
            } catch (error: any) {
                showErrorToast(error?.message || 'خطا در دریافت لیست Provider های فعال');
                throw error;
            }
        },

        /**
         * دریافت اطلاعات یک Provider
         */
        getProvider: async (id: number): Promise<ApiResponse<any>> => {
            try {
                const endpoint = `/admin/ai-providers/${id}/`;
                return await fetchApi.get<any>(endpoint, {
                    cache: 'no-store',
                });
            } catch (error: any) {
                showErrorToast(error?.message || 'خطا در دریافت اطلاعات Provider');
                throw error;
            }
        },

        /**
         * ایجاد یا به‌روزرسانی Provider
         */
        saveProvider: async (data: {
            id?: number;
            provider_name: string;
            api_key: string;
            is_active?: boolean;
            config?: any;
        }): Promise<ApiResponse<any>> => {
            try {
                const endpoint = data.id 
                    ? `/admin/ai-providers/${data.id}/`
                    : '/admin/ai-providers/';
                
                const method = data.id ? 'patch' : 'post';
                return await fetchApi[method]<any>(endpoint, data as Record<string, unknown>);
            } catch (error: any) {
                showErrorToast(error?.message || 'خطا در ذخیره Provider');
                throw error;
            }
        },

        /**
         * فعال/غیرفعال کردن Provider
         */
        toggleProvider: async (id: number, activate: boolean): Promise<ApiResponse<any>> => {
            try {
                const endpoint = `/admin/ai-providers/${id}/${activate ? 'activate' : 'deactivate'}/`;
                return await fetchApi.post<any>(endpoint, {
                    body: JSON.stringify({}),
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
            } catch (error: any) {
                showErrorToast(error?.message || `خطا در ${activate ? 'فعال' : 'غیرفعال'} کردن Provider`);
                throw error;
            }
        },

        /**
         * بررسی اعتبار API key
         */
        validateApiKey: async (id: number): Promise<ApiResponse<{ valid: boolean; message: string }>> => {
            try {
                const endpoint = `/admin/ai-providers/${id}/validate-api-key/`;
                return await fetchApi.post<{ valid: boolean; message: string }>(endpoint, {
                    body: JSON.stringify({}),
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
            } catch (error: any) {
                showErrorToast(error?.message || 'خطا در بررسی اعتبار API key');
                throw error;
            }
        },

        /**
         * تولید تصویر با AI
         */
        generateImage: async (data: {
            provider_name: string;
            prompt: string;
            title?: string;
            alt_text?: string;
            size?: string;
            quality?: string;
            save_to_db?: boolean;
        }): Promise<ApiResponse<Media>> => {
            try {
                const endpoint = '/admin/ai-generate/generate/';
                return await fetchApi.post<Media>(endpoint, data as Record<string, unknown>);
            } catch (error: any) {
                showErrorToast(error?.message || 'خطا در تولید تصویر');
                throw error;
            }
        },
    },

    /**
     * Content Generation API
     */
    content: {
        /**
         * دریافت لیست Provider های فعال برای تولید محتوا
         */
        getAvailableProviders: async (): Promise<ApiResponse<AvailableProvider[]>> => {
            try {
                const endpoint = '/admin/ai-content/available-providers/';
                return await fetchApi.get<AvailableProvider[]>(endpoint, {
                    cache: 'no-store',
                });
            } catch (error: any) {
                showErrorToast(error?.message || 'خطا در دریافت لیست Provider های فعال');
                throw error;
            }
        },

        /**
         * تولید محتوا با AI
         */
        generateContent: async (
            data: AIContentGenerationRequest
        ): Promise<ApiResponse<AIContentGenerationResponse>> => {
            try {
                const endpoint = '/admin/ai-content/generate/';
                return await fetchApi.post<AIContentGenerationResponse>(endpoint, data as unknown as Record<string, unknown>);
            } catch (error: any) {
                showErrorToast(error?.message || 'خطا در تولید محتوا');
                throw error;
            }
        },
    },

    /**
     * Chat API
     */
    chat: {
        /**
         * دریافت لیست Provider های فعال برای چت
         */
        getAvailableProviders: async (): Promise<ApiResponse<AvailableProvider[]>> => {
            try {
                const endpoint = '/admin/ai-chat/available-providers/';
                return await fetchApi.get<AvailableProvider[]>(endpoint, {
                    cache: 'no-store',
                });
            } catch (error: any) {
                showErrorToast(error?.message || 'خطا در دریافت لیست Provider های فعال');
                throw error;
            }
        },

        /**
         * ارسال پیام و دریافت پاسخ از AI
         */
        sendMessage: async (data: {
            message: string;
            provider_name?: string;
            conversation_history?: Array<{ role: 'user' | 'assistant'; content: string }>;
            system_message?: string;
            temperature?: number;
            max_tokens?: number;
        }): Promise<ApiResponse<{
            message: string;
            reply: string;
            provider_name: string;
            generation_time_ms: number;
        }>> => {
            try {
                const endpoint = '/admin/ai-chat/send-message/';
                return await fetchApi.post<{
                    message: string;
                    reply: string;
                    provider_name: string;
                    generation_time_ms: number;
                }>(endpoint, data as Record<string, unknown>);
            } catch (error: any) {
                showErrorToast(error?.message || 'خطا در ارسال پیام');
                throw error;
            }
        },
    },
};

