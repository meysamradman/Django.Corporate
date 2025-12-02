import { fetchApi } from '@/core/config/fetch';
import { ApiResponse } from '@/types/api/apiResponse';
import { ApiError } from '@/types/api/apiError';
import { showErrorToast } from '@/core/config/errorHandler';
import { Media } from '@/types/shared/media';
import {
    AIContentGenerationRequest,
    AIContentGenerationResponse,
    AvailableProvider,
    GlobalControlSetting,
    AIProviderList,
    AIProviderDetail,
    AIModelList,
    AIModelDetail,
    AdminProviderSettings,
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
                // ✅ اگر 404 بود، Toast نشان نده (مدل فعال نیست - طبیعی است)
                if (error?.response?.AppStatusCode !== 404) {
                    showErrorToast(error?.message || 'خطا در دریافت لیست Provider های فعال');
                }
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
            api_key?: string; // ✅ اختیاری - می‌تواند shared_api_key باشد
            shared_api_key?: string; // ✅ اضافه کردن shared_api_key
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
                throw error;
            }
        },

        /**
         * دریافت لیست مدل‌های Hugging Face
         */
        getHuggingFaceModels: async (task?: string): Promise<ApiResponse<any[]>> => {
            try {
                const endpoint = `/admin/ai-image-providers/huggingface-models/${task ? `?task=${task}` : ''}`;
                return await fetchApi.get<any[]>(endpoint);
            } catch (error: any) {
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
                // ✅ اگر 404 بود، Toast نشان نده (مدل فعال نیست - طبیعی است)
                if (error?.response?.AppStatusCode !== 404) {
                    showErrorToast(error?.message || 'خطا در دریافت لیست Provider های فعال');
                }
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
     * ✅ REMOVED: capabilities API - Use models API instead
     * Models are managed via /ai/admin/models/ endpoint
     */

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
                // ✅ اگر 404 بود، Toast نشان نده (مدل فعال نیست - طبیعی است)
                if (error?.response?.AppStatusCode !== 404) {
                    showErrorToast(error?.message || 'خطا در دریافت لیست Provider های فعال');
                }
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
                // ✅ اگر 404 بود، Toast نشان نده (مدل فعال نیست - طبیعی است)
                if (error?.response?.AppStatusCode !== 404) {
                    showErrorToast(error?.message || 'خطا در دریافت لیست Provider های فعال');
                }
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
                throw error;
            }
        },

        /**
         * دریافت لیست مدل‌های Hugging Face
         */
        getHuggingFaceModels: async (task?: string): Promise<ApiResponse<any[]>> => {
            try {
                const endpoint = `/admin/ai-image-providers/huggingface-models/${task ? `?task=${task}` : ''}`;
                return await fetchApi.get<any[]>(endpoint);
            } catch (error: any) {
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
                const endpoint = '/admin/ai-settings/';
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
                const endpoint = '/admin/ai-settings/global-control/';  // Updated endpoint
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

    /**
     * ✅ REMOVED: Global Control API - Backend doesn't have this endpoint yet
     * When backend implements global_controls endpoint, restore this section
     */

    /**
     * ✅ AI Providers API - مدیریت Provider ها (طبق backend)
     */
    providers: {
        /**
         * دریافت لیست Provider ها
         */
        getAll: async (): Promise<ApiResponse<AIProviderList[]>> => {
            try {
                const endpoint = '/admin/ai-providers/';
                return await fetchApi.get<AIProviderList[]>(endpoint);
            } catch (error: any) {
                showErrorToast(error?.message || 'خطا در دریافت لیست Provider ها');
                throw error;
            }
        },

        /**
         * دریافت جزئیات Provider
         */
        getById: async (id: number): Promise<ApiResponse<AIProviderDetail>> => {
            try {
                const endpoint = `/admin/ai-providers/${id}/`;
                return await fetchApi.get<AIProviderDetail>(endpoint);
            } catch (error: any) {
                showErrorToast(error?.message || 'خطا در دریافت اطلاعات Provider');
                throw error;
            }
        },

        /**
         * آمار Provider ها
         */
        getStats: async (): Promise<ApiResponse<{
            total_providers: number;
            total_models: number;
            total_requests: number;
        }>> => {
            try {
                const endpoint = '/admin/ai-providers/stats/';
                return await fetchApi.get(endpoint);
            } catch (error: any) {
                showErrorToast(error?.message || 'خطا در دریافت آمار');
                throw error;
            }
        },
    },

    /**
     * ✅ AI Models API - مدیریت Model ها (طبق backend)
     */
    models: {
        /**
         * دریافت لیست Model ها
         */
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
                return await fetchApi.get<AIModelList[]>(endpoint);
            } catch (error: any) {
                showErrorToast(error?.message || 'خطا در دریافت لیست Model ها');
                throw error;
            }
        },

        /**
         * دریافت جزئیات Model (با computed fields)
         */
        getById: async (id: number): Promise<ApiResponse<AIModelDetail>> => {
            try {
                const endpoint = `/admin/ai-models/${id}/`;
                return await fetchApi.get<AIModelDetail>(endpoint);
            } catch (error: any) {
                showErrorToast(error?.message || 'خطا در دریافت اطلاعات Model');
                throw error;
            }
        },

        /**
         * دریافت Model ها بر اساس capability
         */
        getByCapability: async (capability: string, includeInactive: boolean = true): Promise<ApiResponse<AIModelList[]>> => {
            try {
                const endpoint = `/admin/ai-models/by_capability/?capability=${capability}&include_inactive=${includeInactive}`;
                return await fetchApi.get<AIModelList[]>(endpoint);
            } catch (error: any) {
                showErrorToast(error?.message || 'خطا در دریافت Model ها');
                throw error;
            }
        },

        /**
         * دریافت Model ها بر اساس provider
         */
        getByProvider: async (providerSlug: string, capability?: string): Promise<ApiResponse<AIModelList[]>> => {
            try {
                const params = new URLSearchParams({ provider: providerSlug });
                if (capability) params.append('capability', capability);

                const endpoint = `/admin/ai-models/by_provider/?${params.toString()}`;
                return await fetchApi.get<AIModelList[]>(endpoint);
            } catch (error: any) {
                showErrorToast(error?.message || 'خطا در دریافت Model ها');
                throw error;
            }
        },

        /**
         * به‌روزرسانی Model
         */
        update: async (id: number, data: Partial<AIModelList>): Promise<ApiResponse<AIModelDetail>> => {
            try {
                const endpoint = `/admin/ai-models/${id}/`;
                return await fetchApi.patch<AIModelDetail>(endpoint, data as Record<string, unknown>);
            } catch (error: any) {
                showErrorToast(error?.message || 'خطا در به‌روزرسانی Model');
                throw error;
            }
        },

        /**
         * ایجاد Model جدید
         */
        create: async (data: Partial<AIModelList>): Promise<ApiResponse<AIModelDetail>> => {
            try {
                const endpoint = '/admin/ai-models/';
                return await fetchApi.post<AIModelDetail>(endpoint, data as Record<string, unknown>);
            } catch (error: any) {
                showErrorToast(error?.message || 'خطا در ایجاد Model');
                throw error;
            }
        },
    },

    /**
     * ✅ Admin Provider Settings API - تنظیمات شخصی (طبق backend)
     */
    mySettings: {
        /**
         * دریافت همه تنظیمات شخصی
         */
        getAll: async (): Promise<ApiResponse<AdminProviderSettings[]>> => {
            try {
                const endpoint = '/admin/ai-settings/my_settings/';
                return await fetchApi.get<AdminProviderSettings[]>(endpoint);
            } catch (error: any) {
                showErrorToast(error?.message || 'خطا در دریافت تنظیمات');
                throw error;
            }
        },
    },
};

