import { api } from '@/core/config/api';
import type { ApiResponse } from '@/types/api/apiResponse';
import { showError } from '@/core/toast';
import type { AdminProviderSettings } from '@/types/ai/ai';
import { AI_SETTINGS_ENDPOINTS } from './settings.endpoints';

export const personalSettingsApi = {
    getMySettings: async (): Promise<ApiResponse<AdminProviderSettings[]>> => {
        try {
            const endpoint = AI_SETTINGS_ENDPOINTS.root;
            return await api.get<AdminProviderSettings[]>(endpoint);
        } catch (error) {
            showError(error);
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
                ? AI_SETTINGS_ENDPOINTS.byId(data.id)
                : AI_SETTINGS_ENDPOINTS.root;

            const method = data.id ? 'patch' : 'post';
            return await api[method]<AdminProviderSettings>(endpoint, data as Record<string, unknown>);
        } catch (error) {
            showError(error);
            throw error;
        }
    },

    deleteMySettings: async (id: number): Promise<ApiResponse<{ success: boolean }>> => {
        try {
            const endpoint = AI_SETTINGS_ENDPOINTS.byId(id);
            return await api.delete<{ success: boolean }>(endpoint);
        } catch (error) {
            showError(error);
            throw error;
        }
    },

    getGlobalControl: async (): Promise<ApiResponse<{ allow_regular_admins_use_shared_api: boolean }>> => {
        try {
            const endpoint = AI_SETTINGS_ENDPOINTS.globalControl;
            return await api.get<{ allow_regular_admins_use_shared_api: boolean }>(endpoint);
        } catch (error) {
            showError(error);
            throw error;
        }
    },

    updateGlobalControl: async (allowRegularAdmins: boolean): Promise<ApiResponse<{ allow_regular_admins_use_shared_api: boolean }>> => {
        try {
            const endpoint = AI_SETTINGS_ENDPOINTS.globalControl;
            return await api.patch<{ allow_regular_admins_use_shared_api: boolean }>(endpoint, {
                allow_regular_admins_use_shared_api: allowRegularAdmins,
            } as Record<string, unknown>);
        } catch (error) {
            showError(error);
            throw error;
        }
    },
};

export const mySettingsApi = {
    getAll: async (): Promise<ApiResponse<AdminProviderSettings[]>> => {
        try {
            const endpoint = AI_SETTINGS_ENDPOINTS.mySettings;
            return await api.get<AdminProviderSettings[]>(endpoint);
        } catch (error) {
            showError(error);
            throw error;
        }
    },
};
