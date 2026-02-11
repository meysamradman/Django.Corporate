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
    ActiveCapabilityModelsResponse,
} from '@/types/ai/ai';

export const aiApi = {
    image: {
        getProviders: async (): Promise<ApiResponse<AIProviderList[]>> => {
            try {
                const endpoint = '/admin/ai-providers/';
                return await api.get<AIProviderList[]>(endpoint);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'خطا در دریافت لیست Provider ها';
                showError(errorMessage);
                throw error;
            }
        },

        getAvailableProviders: async (capability?: string): Promise<ApiResponse<AvailableProvider[]>> => {
            try {
                const endpoint = capability
                    ? `/admin/ai-providers/available/?capability=${capability}`
                    : '/admin/ai-providers/available/';
                return await api.get<AvailableProvider[]>(endpoint);
            } catch (error) {
                if (error && typeof error === 'object' && 'response' in error && (error.response as { AppStatusCode?: number })?.AppStatusCode !== 404) {
                    const errorMessage = error instanceof Error ? error.message : 'خطا در دریافت لیست Provider های فعال';
                    showError(errorMessage);
                }
                throw error;
            }
        },

        getProvider: async (id: number): Promise<ApiResponse<AIProviderDetail>> => {
            try {
                const endpoint = `/admin/ai-providers/${id}/`;
                return await api.get<AIProviderDetail>(endpoint);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'خطا در دریافت اطلاعات Provider';
                showError(errorMessage);
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
                const errorMessage = error instanceof Error ? error.message : 'خطا در ذخیره Provider';
                showError(errorMessage);
                throw error;
            }
        },

        toggleProvider: async (id: number, activate: boolean): Promise<ApiResponse<AIProviderDetail>> => {
            try {
                const endpoint = `/admin/ai-providers/${id}/${activate ? 'activate' : 'deactivate'}/`;
                return await api.post<AIProviderDetail>(endpoint, {});
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : `خطا در ${activate ? 'فعال' : 'غیرفعال'} کردن Provider`;
                showError(errorMessage);
                throw error;
            }
        },

        validateApiKey: async (id: number): Promise<ApiResponse<{ valid: boolean; message: string }>> => {
            try {
                const endpoint = `/admin/ai-providers/${id}/validate-api-key/`;
                return await api.post<{ valid: boolean; message: string }>(endpoint, {});
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'خطا در بررسی اعتبار API key';
                showError(errorMessage);
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
            } catch {
                throw new Error('خطا در دریافت لیست مدل‌های OpenRouter');
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
            } catch {
                throw new Error('خطا در دریافت لیست مدل‌های HuggingFace');
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
        }): Promise<ApiResponse<Media>> => {
            const endpoint = '/admin/ai-images/generate/';
            return await api.post<Media>(endpoint, data as Record<string, unknown>);
        },
    },

    content: {
        getDestinations: async (): Promise<ApiResponse<{ key: string; label: string }[]>> => {
            const endpoint = '/admin/ai-content/destinations/';
            return await api.get<{ key: string; label: string }[]>(endpoint);
        },

        getAvailableProviders: async (): Promise<ApiResponse<AvailableProvider[]>> => {
            try {
                const endpoint = '/admin/ai-providers/available/?capability=content';
                return await api.get<AvailableProvider[]>(endpoint);
            } catch (error) {
                if (error && typeof error === 'object' && 'response' in error && (error.response as { AppStatusCode?: number })?.AppStatusCode !== 404) {
                    const errorMessage = error instanceof Error ? error.message : 'خطا در دریافت لیست Provider های فعال';
                    showError(errorMessage);
                }
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
            } catch {
                throw new Error('خطا در دریافت لیست مدل‌های OpenRouter');
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
            } catch {
                throw new Error('خطا در دریافت لیست مدل‌های HuggingFace');
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
                const endpoint = '/admin/ai-providers/available/?capability=audio';
                return await api.get<AvailableProvider[]>(endpoint);
            } catch (error) {
                if (error && typeof error === 'object' && 'response' in error && (error.response as { AppStatusCode?: number })?.AppStatusCode !== 404) {
                    const errorMessage = error instanceof Error ? error.message : 'خطا در دریافت لیست Provider های فعال';
                    showError(errorMessage);
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
        getAvailableProviders: async (capability?: string): Promise<ApiResponse<AvailableProvider[]>> => {
            try {
                const endpoint = capability
                    ? `/admin/ai-providers/available/?capability=${capability}`
                    : '/admin/ai-providers/available/';
                return await api.get<AvailableProvider[]>(endpoint);
            } catch (error) {
                if (error && typeof error === 'object' && 'response' in error && (error.response as { AppStatusCode?: number })?.AppStatusCode !== 404) {
                    const errorMessage = error instanceof Error ? error.message : 'خطا در دریافت لیست Provider های فعال';
                    showError(errorMessage);
                }
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
            } catch {
                throw new Error('خطا در دریافت لیست مدل‌های OpenRouter');
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
            } catch {
                throw new Error('خطا در دریافت لیست مدل‌های HuggingFace');
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
                formData.append('image', data.file); // Backend expects 'image'

                if (data.conversation_history) {
                    formData.append('conversation_history', JSON.stringify(data.conversation_history));
                }

                return await api.post<{
                    message: string;
                    reply: string;
                    provider_name: string;
                    model_name?: string;
                    generation_time_ms: number;
                }>(endpoint, formData as unknown as Record<string, unknown>);
            }

            return await api.post<{
                message: string;
                reply: string;
                provider_name: string;
                model_name?: string;
                generation_time_ms: number;
            }>(endpoint, data as Record<string, unknown>);
        },
    },
    personalSettings: {
        getMySettings: async (): Promise<ApiResponse<AdminProviderSettings[]>> => {
            try {
                const endpoint = '/admin/ai-settings/';
                return await api.get<AdminProviderSettings[]>(endpoint);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'خطا در دریافت تنظیمات شخصی';
                showError(errorMessage);
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
            config?: Record<string, unknown>;
        }): Promise<ApiResponse<AdminProviderSettings>> => {
            try {
                const endpoint = data.id
                    ? `/admin/ai-settings/${data.id}/`
                    : '/admin/ai-settings/';

                const method = data.id ? 'patch' : 'post';
                return await api[method]<AdminProviderSettings>(endpoint, data as Record<string, unknown>);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'خطا در ذخیره تنظیمات شخصی';
                showError(errorMessage);
                throw error;
            }
        },

        deleteMySettings: async (id: number): Promise<ApiResponse<{ success: boolean }>> => {
            try {
                const endpoint = `/admin/ai-settings/${id}/`;
                return await api.delete<{ success: boolean }>(endpoint);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'خطا در حذف تنظیمات شخصی';
                showError(errorMessage);
                throw error;
            }
        },

        getGlobalControl: async (): Promise<ApiResponse<{ allow_regular_admins_use_shared_api: boolean }>> => {
            try {
                const endpoint = '/admin/ai-settings/global-control/';
                return await api.get<{ allow_regular_admins_use_shared_api: boolean }>(endpoint);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'خطا در دریافت تنظیمات Global Control';
                showError(errorMessage);
                throw error;
            }
        },

        updateGlobalControl: async (allowRegularAdmins: boolean): Promise<ApiResponse<{ allow_regular_admins_use_shared_api: boolean }>> => {
            try {
                const endpoint = '/admin/ai-settings/global-control/';
                return await api.patch<{ allow_regular_admins_use_shared_api: boolean }>(endpoint, {
                    allow_regular_admins_use_shared_api: allowRegularAdmins,
                } as Record<string, unknown>);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'خطا در به‌روزرسانی تنظیمات Global Control';
                showError(errorMessage);
                throw error;
            }
        },
    },

    providers: {
        getAll: async (): Promise<ApiResponse<AIProviderList[]>> => {
            try {
                const endpoint = '/admin/ai-providers/';
                return await api.get<AIProviderList[]>(endpoint);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'خطا در دریافت لیست Provider ها';
                showError(errorMessage);
                throw error;
            }
        },

        getById: async (id: number): Promise<ApiResponse<AIProviderDetail>> => {
            try {
                const endpoint = `/admin/ai-providers/${id}/`;
                return await api.get<AIProviderDetail>(endpoint);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'خطا در دریافت اطلاعات Provider';
                showError(errorMessage);
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
                const errorMessage = error instanceof Error ? error.message : 'خطا در دریافت آمار';
                showError(errorMessage);
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
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'خطا در دریافت لیست Model ها';
                showError(errorMessage);
                throw error;
            }
        },

        getActiveModel: async (providerSlug: string, capability?: string): Promise<ApiResponse<AIModelDetail>> => {
            try {
                const params = new URLSearchParams({ provider: providerSlug });
                if (capability) params.append('capability', capability);
                const endpoint = `/admin/ai-models/active-model/?${params.toString()}`;
                return await api.get<AIModelDetail>(endpoint);
            } catch {
                throw new Error('خطا در دریافت مدل فعال');
            }
        },

        getById: async (id: number): Promise<ApiResponse<AIModelDetail>> => {
            try {
                const endpoint = `/admin/ai-models/${id}/`;
                return await api.get<AIModelDetail>(endpoint);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'خطا در دریافت اطلاعات Model';
                showError(errorMessage);
                throw error;
            }
        },

        getByCapability: async (capability: string, includeInactive: boolean = true): Promise<ApiResponse<AIModelList[]>> => {
            try {
                const endpoint = `/admin/ai-models/by_capability/?capability=${capability}&include_inactive=${includeInactive}`;
                return await api.get<AIModelList[]>(endpoint);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'خطا در دریافت Model ها';
                showError(errorMessage);
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
                const errorMessage = error instanceof Error ? error.message : 'خطا در دریافت Model ها';
                showError(errorMessage);
                throw error;
            }
        },

        update: async (id: number, data: Partial<AIModelList>): Promise<ApiResponse<AIModelDetail>> => {
            try {
                const endpoint = `/admin/ai-models/${id}/`;
                return await api.patch<AIModelDetail>(endpoint, data as Record<string, unknown>);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'خطا در به‌روزرسانی Model';
                showError(errorMessage);
                throw error;
            }
        },

        create: async (data: Partial<AIModelList>): Promise<ApiResponse<AIModelDetail>> => {
            try {
                const endpoint = '/admin/ai-models/';
                return await api.post<AIModelDetail>(endpoint, data as Record<string, unknown>);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'خطا در ایجاد Model';
                showError(errorMessage);
                throw error;
            }
        },

        selectModel: async (data: {
            provider: string;  // provider slug
            capability: string;
            model_id?: string; // Optional/Ignored by backend
            model_name?: string; // Optional/Ignored by backend
            pricing_input?: number;
            pricing_output?: number;
        }): Promise<ApiResponse<AIModelDetail>> => {
            try {
                // Backend now handles provider selection via this endpoint
                const endpoint = '/admin/ai-models/select-provider/';
                return await api.post<AIModelDetail>(endpoint, data as Record<string, unknown>);
            } catch {
                throw new Error('خطا در انتخاب Provider');
            }
        },

        deactivateModel: async (data: {
            provider: string;
            model_id: string;
        }): Promise<ApiResponse<{ model_id: string; is_active: boolean }>> => {
            try {
                const endpoint = '/admin/ai-models/deactivate-model/';
                return await api.post<{ model_id: string; is_active: boolean }>(endpoint, data as Record<string, unknown>);
            } catch {
                throw new Error('خطا در غیرفعال‌سازی مدل');
            }
        },

        getActiveCapabilities: async (): Promise<ApiResponse<ActiveCapabilityModelsResponse>> => {
            try {
                const endpoint = '/admin/ai-models/active-capabilities/';
                return await api.get<ActiveCapabilityModelsResponse>(endpoint);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'خطا در دریافت مدل‌های پیش‌فرض';
                showError(errorMessage);
                throw error;
            }
        },
    },

    mySettings: {
        getAll: async (): Promise<ApiResponse<AdminProviderSettings[]>> => {
            try {
                const endpoint = '/admin/ai-settings/my_settings/';
                return await api.get<AdminProviderSettings[]>(endpoint);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Error fetching settings';
                showError(errorMessage);
                throw error;
            }
        },
    },
};

