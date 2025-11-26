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
                // ✅ NO CACHE: Admin panel is CSR only - caching handled by backend Redis
                return await fetchApi.get<any[]>(endpoint);
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
                // ✅ NO CACHE: Admin panel is CSR only - caching handled by backend Redis
                return await fetchApi.get<any[]>(endpoint);
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
                // ✅ NO CACHE: Admin panel is CSR only - caching handled by backend Redis
                return await fetchApi.get<any>(endpoint);
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
         * دریافت لیست مدل‌های OpenRouter
         */
        getOpenRouterModels: async (provider?: string): Promise<ApiResponse<any[]>> => {
            try {
                const endpoint = `/admin/ai-image-generation/providers/openrouter-models/${provider ? `?provider=${provider}` : ''}`;
                return await fetchApi.get<any[]>(endpoint);
            } catch (error: any) {
                // Don't show error toast - just log it (models might not be critical)
                console.error('[AI Image Generation API] Error fetching OpenRouter models:', error);
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
                // ✅ NO CACHE: Admin panel is CSR only - caching handled by backend Redis
                return await fetchApi.get<AvailableProvider[]>(endpoint);
            } catch (error: any) {
                showErrorToast(error?.message || 'خطا در دریافت لیست Provider های فعال');
                throw error;
            }
        },

        /**
         * دریافت لیست مدل‌های OpenRouter
         */
        getOpenRouterModels: async (provider?: string): Promise<ApiResponse<any[]>> => {
            try {
                const endpoint = `/admin/ai-content-generation/openrouter-models/${provider ? `?provider=${provider}` : ''}`;
                return await fetchApi.get<any[]>(endpoint);
            } catch (error: any) {
                // Don't show error toast - just log it (models might not be critical)
                console.error('[AI Content Generation API] Error fetching OpenRouter models:', error);
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
     * Provider Capabilities API
     */
    capabilities: {
        /**
         * دریافت قابلیت‌های یک Provider یا همه Provider ها
         */
        getCapabilities: async (providerName?: string, featureType?: 'chat' | 'content' | 'image'): Promise<ApiResponse<any>> => {
            try {
                const baseEndpoint = featureType 
                    ? `/admin/ai-${featureType}/capabilities/`
                    : '/admin/ai-image/capabilities/';  // Default to image
                
                const endpoint = providerName 
                    ? `${baseEndpoint}?provider_name=${providerName}`
                    : baseEndpoint;
                
                return await fetchApi.get<any>(endpoint);
            } catch (error: any) {
                console.error('[AI Capabilities API] Error fetching capabilities:', error);
                throw error;
            }
        },
    },

    /**
     * Audio Generation API (Text-to-Speech)
     */
    audio: {
        /**
         * دریافت لیست Provider های فعال برای تولید صدا
         */
        getAvailableProviders: async (): Promise<ApiResponse<AvailableProvider[]>> => {
            try {
                const endpoint = '/admin/ai-audio/available-providers/';
                // ✅ NO CACHE: Admin panel is CSR only - caching handled by backend Redis
                return await fetchApi.get<AvailableProvider[]>(endpoint);
            } catch (error: any) {
                showErrorToast(error?.message || 'خطا در دریافت لیست Provider های فعال');
                throw error;
            }
        },

        /**
         * تولید فایل صوتی با AI (Text-to-Speech)
         */
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
            try {
                const endpoint = '/admin/ai-audio/generate/';
                return await fetchApi.post<Media | { audio_data_url: string; saved: boolean }>(endpoint, data as Record<string, unknown>);
            } catch (error: any) {
                showErrorToast(error?.message || 'خطا در تولید فایل صوتی');
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
                // ✅ NO CACHE: Admin panel is CSR only - caching handled by backend Redis
                return await fetchApi.get<AvailableProvider[]>(endpoint);
            } catch (error: any) {
                showErrorToast(error?.message || 'خطا در دریافت لیست Provider های فعال');
                throw error;
            }
        },

        /**
         * دریافت لیست مدل‌های OpenRouter
         */
        getOpenRouterModels: async (provider?: string): Promise<ApiResponse<any[]>> => {
            try {
                const endpoint = `/admin/ai-chat/openrouter-models/${provider ? `?provider=${provider}` : ''}`;
                return await fetchApi.get<any[]>(endpoint);
            } catch (error: any) {
                // Don't show error toast - just log it (models might not be critical)
                console.error('[AI Chat API] Error fetching OpenRouter models:', error);
                throw error;
            }
        },

        /**
         * ارسال پیام و دریافت پاسخ از AI
         */
        sendMessage: async (data: {
            message: string;
            provider_name?: string;
            model?: string;  // Model ID for OpenRouter (e.g., 'google/gemini-2.5-flash')
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
    /**
     * Personal AI Settings API
     */
    personalSettings: {
        /**
         * دریافت تنظیمات شخصی ادمین فعلی
         */
        getMySettings: async (): Promise<ApiResponse<any[]>> => {
            try {
                const endpoint = '/admin/ai-settings/my-settings/';
                return await fetchApi.get<any[]>(endpoint);
            } catch (error: any) {
                showErrorToast(error?.message || 'خطا در دریافت تنظیمات شخصی');
                throw error;
            }
        },

        /**
         * ایجاد یا به‌روزرسانی تنظیمات شخصی
         */
        saveMySettings: async (data: {
            id?: number;
            provider_name: string;
            api_key?: string;
            use_shared_api: boolean;
            is_active: boolean;
            monthly_limit?: number;
            config?: any;
        }): Promise<ApiResponse<any>> => {
            try {
                const endpoint = data.id
                    ? `/admin/ai-settings/${data.id}/`
                    : '/admin/ai-settings/';
                
                const method = data.id ? 'patch' : 'post';
                return await fetchApi[method]<any>(endpoint, data as Record<string, unknown>);
            } catch (error: any) {
                showErrorToast(error?.message || 'خطا در ذخیره تنظیمات شخصی');
                throw error;
            }
        },

        /**
         * حذف تنظیمات شخصی
         */
        deleteMySettings: async (id: number): Promise<ApiResponse<any>> => {
            try {
                const endpoint = `/admin/ai-settings/${id}/`;
                return await fetchApi.delete<any>(endpoint);
            } catch (error: any) {
                showErrorToast(error?.message || 'خطا در حذف تنظیمات شخصی');
                throw error;
            }
        },

        /**
         * دریافت وضعیت Global Control (اجازه استفاده از Shared API برای ادمین‌های معمولی)
         */
        getGlobalControl: async (): Promise<ApiResponse<{ allow_regular_admins_use_shared_api: boolean }>> => {
            try {
                const endpoint = '/admin/ai-settings/global-control/';
                return await fetchApi.get<{ allow_regular_admins_use_shared_api: boolean }>(endpoint);
            } catch (error: any) {
                showErrorToast(error?.message || 'خطا در دریافت تنظیمات Global Control');
                throw error;
            }
        },

        /**
         * تغییر وضعیت Global Control
         */
        updateGlobalControl: async (allowRegularAdmins: boolean): Promise<ApiResponse<{ allow_regular_admins_use_shared_api: boolean }>> => {
            try {
                const endpoint = '/admin/ai-settings/global-control/';
                return await fetchApi.patch<{ allow_regular_admins_use_shared_api: boolean }>(endpoint, {
                    allow_regular_admins_use_shared_api: allowRegularAdmins,
                } as Record<string, unknown>);
            } catch (error: any) {
                showErrorToast(error?.message || 'خطا در به‌روزرسانی تنظیمات Global Control');
                throw error;
            }
        },
    },
};

