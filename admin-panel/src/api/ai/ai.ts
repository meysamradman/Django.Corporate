import { api } from '@/core/config/api';
import type { ApiResponse } from '@/types/api/apiResponse';
import { showError } from '@/core/toast';
import type { Media } from '@/types/shared/media';
import type {
    AIContentGenerationRequest,
    AIContentGenerationResponse,
    AvailableProvider,
    AIProviderList,
    AIProviderDetail,
    AIModelList,
    AIModelDetail,
    AdminProviderSettings,
} from '@/types/ai/ai';

export const aiApi = {
    image: {
        getProviders: async (): Promise<ApiResponse<any[]>> => {
            try {
                const endpoint = '/admin/ai-providers/';
                return await api.get<any[]>(endpoint);
            } catch (error: any) {
                showError(error?.message || 'خطا در دریافت لیست Provider ها');
                throw error;
            }
        },

        getAvailableProviders: async (capability?: string): Promise<ApiResponse<any[]>> => {
            try {
                const endpoint = capability 
                    ? `/admin/ai-providers/available/?capability=${capability}`
                    : '/admin/ai-providers/available/';
                return await api.get<any[]>(endpoint);
            } catch (error: any) {
                if (error?.response?.AppStatusCode !== 404) {
                    showError(error?.message || 'خطا در دریافت لیست Provider های فعال');
                }
                throw error;
            }
        },

        getProvider: async (id: number): Promise<ApiResponse<any>> => {
            try {
                const endpoint = `/admin/ai-providers/${id}/`;
                return await api.get<any>(endpoint);
            } catch (error: any) {
                showError(error?.message || 'خطا در دریافت اطلاعات Provider');
                throw error;
            }
        },

        saveProvider: async (data: {
            id?: number;
            provider_name: string;
            api_key?: string;
            shared_api_key?: string;
            is_active?: boolean;
            config?: any;
        }): Promise<ApiResponse<any>> => {
            try {
                const endpoint = data.id
                    ? `/admin/ai-providers/${data.id}/`
                    : '/admin/ai-providers/';

                const method = data.id ? 'patch' : 'post';
                return await api[method]<any>(endpoint, data as Record<string, unknown>);
            } catch (error: any) {
                showError(error?.message || 'خطا در ذخیره Provider');
                throw error;
            }
        },

        toggleProvider: async (id: number, activate: boolean): Promise<ApiResponse<any>> => {
            try {
                const endpoint = `/admin/ai-providers/${id}/${activate ? 'activate' : 'deactivate'}/`;
                return await api.post<any>(endpoint, {});
            } catch (error: any) {
                showError(error?.message || `خطا در ${activate ? 'فعال' : 'غیرفعال'} کردن Provider`);
                throw error;
            }
        },

        validateApiKey: async (id: number): Promise<ApiResponse<{ valid: boolean; message: string }>> => {
            try {
                const endpoint = `/admin/ai-providers/${id}/validate-api-key/`;
                return await api.post<{ valid: boolean; message: string }>(endpoint, {});
            } catch (error: any) {
                showError(error?.message || 'خطا در بررسی اعتبار API key');
                throw error;
            }
        },

        getOpenRouterModels: async (provider?: string): Promise<ApiResponse<any[]>> => {
            try {
                // استفاده از endpoint جدید browse-models
                const params = new URLSearchParams({ 
                    provider: 'openrouter', 
                    capability: 'image',
                    use_cache: 'true'
                });
                if (provider) params.append('provider_filter', provider);
                const endpoint = `/admin/ai-models/browse-models/?${params.toString()}`;
                return await api.get<any[]>(endpoint);
            } catch (error: any) {
                throw error;
            }
        },

        getHuggingFaceModels: async (task?: string): Promise<ApiResponse<any[]>> => {
            try {
                // استفاده از endpoint جدید browse-models
                const params = new URLSearchParams({ 
                    provider: 'huggingface', 
                    capability: 'image',
                    use_cache: 'true'
                });
                if (task) params.append('task_filter', task);
                const endpoint = `/admin/ai-models/browse-models/?${params.toString()}`;
                return await api.get<any[]>(endpoint);
            } catch (error: any) {
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
            save_to_db?: boolean;
        }): Promise<ApiResponse<Media>> => {
            const endpoint = '/admin/ai-generate/generate/';
            return await api.post<Media>(endpoint, data as Record<string, unknown>);
        },
    },

    content: {
        getAvailableProviders: async (): Promise<ApiResponse<AvailableProvider[]>> => {
            try {
                // استفاده از endpoint اصلی با capability
                const endpoint = '/admin/ai-providers/available/?capability=content';
                return await api.get<AvailableProvider[]>(endpoint);
            } catch (error: any) {
                if (error?.response?.AppStatusCode !== 404) {
                    showError(error?.message || 'خطا در دریافت لیست Provider های فعال');
                }
                throw error;
            }
        },

        getOpenRouterModels: async (provider?: string): Promise<ApiResponse<any[]>> => {
            try {
                // استفاده از endpoint جدید browse-models
                const params = new URLSearchParams({ 
                    provider: 'openrouter', 
                    capability: 'content',
                    use_cache: 'true'
                });
                if (provider) params.append('provider_filter', provider);
                const endpoint = `/admin/ai-models/browse-models/?${params.toString()}`;
                return await api.get<any[]>(endpoint);
            } catch (error: any) {
                throw error;
            }
        },

        getHuggingFaceModels: async (task?: string): Promise<ApiResponse<any[]>> => {
            try {
                // استفاده از endpoint جدید browse-models
                const params = new URLSearchParams({ 
                    provider: 'huggingface', 
                    capability: 'content',
                    use_cache: 'true'
                });
                if (task) params.append('task_filter', task);
                const endpoint = `/admin/ai-models/browse-models/?${params.toString()}`;
                return await api.get<any[]>(endpoint);
            } catch (error: any) {
                throw error;
            }
        },

        generateContent: async (
            data: AIContentGenerationRequest
        ): Promise<ApiResponse<AIContentGenerationResponse>> => {
            const endpoint = '/admin/ai-content/generate/';
            return await api.post<AIContentGenerationResponse>(endpoint, data as unknown as Record<string, unknown>);
        },
    },

    audio: {
        getAvailableProviders: async (): Promise<ApiResponse<AvailableProvider[]>> => {
            try {
                // استفاده از endpoint اصلی با capability
                const endpoint = '/admin/ai-providers/available/?capability=audio';
                return await api.get<AvailableProvider[]>(endpoint);
            } catch (error: any) {
                if (error?.response?.AppStatusCode !== 404) {
                    showError(error?.message || 'خطا در دریافت لیست Provider های فعال');
                }
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
            return await api.post<Media | { audio_data_url: string; saved: boolean }>(endpoint, data as Record<string, unknown>);
        },
    },

    chat: {
        getAvailableProviders: async (): Promise<ApiResponse<AvailableProvider[]>> => {
            try {
                // استفاده از endpoint اصلی با capability
                const endpoint = '/admin/ai-providers/available/?capability=chat';
                return await api.get<AvailableProvider[]>(endpoint);
            } catch (error: any) {
                if (error?.response?.AppStatusCode !== 404) {
                    showError(error?.message || 'خطا در دریافت لیست Provider های فعال');
                }
                throw error;
            }
        },

        getOpenRouterModels: async (provider?: string): Promise<ApiResponse<any[]>> => {
            try {
                // استفاده از endpoint جدید browse-models
                const params = new URLSearchParams({ 
                    provider: 'openrouter', 
                    capability: 'chat',
                    use_cache: 'true'
                });
                if (provider) params.append('provider_filter', provider);
                const endpoint = `/admin/ai-models/browse-models/?${params.toString()}`;
                return await api.get<any[]>(endpoint);
            } catch (error: any) {
                throw error;
            }
        },

        getHuggingFaceModels: async (task?: string): Promise<ApiResponse<any[]>> => {
            try {
                // استفاده از endpoint جدید browse-models
                const params = new URLSearchParams({ 
                    provider: 'huggingface', 
                    capability: 'chat',
                    use_cache: 'true'
                });
                if (task) params.append('task_filter', task);
                const endpoint = `/admin/ai-models/browse-models/?${params.toString()}`;
                return await api.get<any[]>(endpoint);
            } catch (error: any) {
                throw error;
            }
        },

        sendMessage: async (data: {
            message: string;
            provider_name?: string;
            model?: string;
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
            const endpoint = '/admin/ai-chat/send-message/';
            return await api.post<{
                message: string;
                reply: string;
                provider_name: string;
                generation_time_ms: number;
            }>(endpoint, data as Record<string, unknown>);
        },
    },
    personalSettings: {
        getMySettings: async (): Promise<ApiResponse<any[]>> => {
            try {
                const endpoint = '/admin/ai-settings/';
                return await api.get<any[]>(endpoint);
            } catch (error: any) {
                showError(error?.message || 'خطا در دریافت تنظیمات شخصی');
                throw error;
            }
        },

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
                return await api[method]<any>(endpoint, data as Record<string, unknown>);
            } catch (error: any) {
                showError(error?.message || 'خطا در ذخیره تنظیمات شخصی');
                throw error;
            }
        },

        deleteMySettings: async (id: number): Promise<ApiResponse<any>> => {
            try {
                const endpoint = `/admin/ai-settings/${id}/`;
                return await api.delete<any>(endpoint);
            } catch (error: any) {
                showError(error?.message || 'خطا در حذف تنظیمات شخصی');
                throw error;
            }
        },

        getGlobalControl: async (): Promise<ApiResponse<{ allow_regular_admins_use_shared_api: boolean }>> => {
            try {
                const endpoint = '/admin/ai-settings/global-control/';
                return await api.get<{ allow_regular_admins_use_shared_api: boolean }>(endpoint);
            } catch (error: any) {
                showError(error?.message || 'خطا در دریافت تنظیمات Global Control');
                throw error;
            }
        },

        updateGlobalControl: async (allowRegularAdmins: boolean): Promise<ApiResponse<{ allow_regular_admins_use_shared_api: boolean }>> => {
            try {
                const endpoint = '/admin/ai-settings/global-control/';
                return await api.patch<{ allow_regular_admins_use_shared_api: boolean }>(endpoint, {
                    allow_regular_admins_use_shared_api: allowRegularAdmins,
                } as Record<string, unknown>);
            } catch (error: any) {
                showError(error?.message || 'خطا در به‌روزرسانی تنظیمات Global Control');
                throw error;
            }
        },
    },

    providers: {
        getAll: async (): Promise<ApiResponse<AIProviderList[]>> => {
            try {
                const endpoint = '/admin/ai-providers/';
                return await api.get<AIProviderList[]>(endpoint);
            } catch (error: any) {
                showError(error?.message || 'خطا در دریافت لیست Provider ها');
                throw error;
            }
        },

        getById: async (id: number): Promise<ApiResponse<AIProviderDetail>> => {
            try {
                const endpoint = `/admin/ai-providers/${id}/`;
                return await api.get<AIProviderDetail>(endpoint);
            } catch (error: any) {
                showError(error?.message || 'خطا در دریافت اطلاعات Provider');
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
                return await api.get(endpoint);
            } catch (error: any) {
                showError(error?.message || 'خطا در دریافت آمار');
                throw error;
            }
        },
    },

    models: {
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
            } catch (error: any) {
                showError(error?.message || 'خطا در دریافت لیست Model ها');
                throw error;
            }
        },

        getActiveModel: async (providerSlug: string, capability: string): Promise<ApiResponse<AIModelDetail>> => {
            try {
                // استفاده از endpoint جدید active-model در ai-models viewset
                const endpoint = `/admin/ai-models/active-model/?provider=${providerSlug}&capability=${capability}`;
                // Silent mode - 404 is expected when no active model exists
                return await api.get<AIModelDetail>(endpoint);
            } catch (error: any) {
                // Silently throw - caller will handle
                throw error;
            }
        },

        getById: async (id: number): Promise<ApiResponse<AIModelDetail>> => {
            try {
                const endpoint = `/admin/ai-models/${id}/`;
                return await api.get<AIModelDetail>(endpoint);
            } catch (error: any) {
                showError(error?.message || 'خطا در دریافت اطلاعات Model');
                throw error;
            }
        },

        getByCapability: async (capability: string, includeInactive: boolean = true): Promise<ApiResponse<AIModelList[]>> => {
            try {
                const endpoint = `/admin/ai-models/by_capability/?capability=${capability}&include_inactive=${includeInactive}`;
                return await api.get<AIModelList[]>(endpoint);
            } catch (error: any) {
                showError(error?.message || 'خطا در دریافت Model ها');
                throw error;
            }
        },

        getByProvider: async (providerSlug: string, capability?: string): Promise<ApiResponse<AIModelList[]>> => {
            try {
                const params = new URLSearchParams({ provider: providerSlug });
                if (capability) params.append('capability', capability);

                const endpoint = `/admin/ai-models/by_provider/?${params.toString()}`;
                return await api.get<AIModelList[]>(endpoint);
            } catch (error: any) {
                showError(error?.message || 'خطا در دریافت Model ها');
                throw error;
            }
        },

        update: async (id: number, data: Partial<AIModelList>): Promise<ApiResponse<AIModelDetail>> => {
            try {
                const endpoint = `/admin/ai-models/${id}/`;
                return await api.patch<AIModelDetail>(endpoint, data as Record<string, unknown>);
            } catch (error: any) {
                showError(error?.message || 'خطا در به‌روزرسانی Model');
                throw error;
            }
        },

        create: async (data: Partial<AIModelList>): Promise<ApiResponse<AIModelDetail>> => {
            try {
                const endpoint = '/admin/ai-models/';
                return await api.post<AIModelDetail>(endpoint, data as Record<string, unknown>);
            } catch (error: any) {
                showError(error?.message || 'خطا در ایجاد Model');
                throw error;
            }
        },

        selectModel: async (data: {
            provider: string;  // provider slug
            capability: string;
            model_id: string;
            model_name: string;
            pricing_input?: number;
            pricing_output?: number;
        }): Promise<ApiResponse<AIModelDetail>> => {
            try {
                const endpoint = '/admin/ai-models/select-model/';
                return await api.post<AIModelDetail>(endpoint, data as Record<string, unknown>);
            } catch (error: any) {
                throw error;
            }
        },
    },

    mySettings: {
        getAll: async (): Promise<ApiResponse<AdminProviderSettings[]>> => {
            try {
                const endpoint = '/admin/ai-settings/my_settings/';
                return await api.get<AdminProviderSettings[]>(endpoint);
            } catch (error: any) {
                showError(error?.message || 'Error fetching settings');
                throw error;
            }
        },
    },
};

