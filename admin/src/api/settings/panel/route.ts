import { fetchApi } from '@/core/config/fetch';
import { ApiResponse } from '@/types/api/apiResponse';
import { PanelSettings } from '@/types/settings/panelSettings';

const BASE_URL = '/admin/panel-settings';

export const getPanelSettings = async (options?: { cache?: RequestCache, revalidate?: number | false }): Promise<PanelSettings> => {
    try {
        const response = await fetchApi.get<PanelSettings>(`${BASE_URL}/`, options);
        if (!response || !response.data) {
            throw new Error("API response missing panel settings data.");
        }
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const updatePanelSettings = async (data: FormData | PanelSettings): Promise<ApiResponse<PanelSettings>> => {
    const response = await fetchApi.put<PanelSettings>(`${BASE_URL}/`, data);
    return response;
};