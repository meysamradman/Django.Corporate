import { api } from '@/core/config/api';
import type { ApiResponse } from '@/types/api/apiResponse';
import { ApiError } from '@/types/api/apiError';
import type { PanelSettings } from '@/types/settings/panelSettings';
import { showSuccess, showError } from '@/core/toast';
import { env } from '@/core/config/environment';

const BASE_URL = '/admin/panel-settings';

const requireResponseData = <T>(response: { data?: T }, message: string): T => {
    if (response && response.data !== undefined && response.data !== null) {
        return response.data;
    }

    throw ApiError.fromMessage(message, 500, response);
};

export const getPanelSettings = async (options?: Record<string, unknown>): Promise<PanelSettings> => {
    const response = await api.get<PanelSettings>(`${BASE_URL}/`, options);
    return requireResponseData(response, 'API response missing panel settings data.');
};

export const updatePanelSettings = async (data: FormData | PanelSettings): Promise<ApiResponse<PanelSettings>> => {
    const response = await api.put<PanelSettings>(`${BASE_URL}/update/`, data as FormData | PanelSettings);
    return response;
};

export const downloadDatabaseExport = async (): Promise<void> => {
    try {
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '').replace('T', '_');
        const filename = `database_backup_${timestamp}.sql`;

        const getCsrfToken = (): string | null => {
            if (typeof document === 'undefined') return null;
            try {
                const cookies = document.cookie.split(';');
                for (let i = 0; i < cookies.length; i++) {
                    const cookie = cookies[i].trim();
                    if (cookie.startsWith('csrftoken=')) {
                        return cookie.substring('csrftoken='.length);
                    }
                }
            } catch {
                return null;
            }
            return null;
        };

        const csrfToken = getCsrfToken();
        const url = `${env.API_URL}${BASE_URL}/database-export/download/`;

        const response = await fetch(url, {
            method: 'GET',
            credentials: 'include',
            headers: {
                ...(csrfToken && { 'X-CSRFToken': csrfToken }),
            },
        });

        if (!response.ok) {
            let errorMessage = `Download failed: ${response.status}`;
            try {
                const contentType = response.headers.get('content-type');
                if (contentType?.includes('application/json')) {
                    const errorData = await response.json();
                    errorMessage = errorData?.metaData?.message || errorData?.message || errorMessage;
                }
            } catch {
            }
            throw new Error(errorMessage);
        }

        const blob = await response.blob();

        if (blob.size === 0) {
            throw new Error('Downloaded file is empty');
        }

        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);

        showSuccess('دانلود پشتیبان دیتابیس با موفقیت انجام شد');
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'خطا در دانلود پشتیبان دیتابیس';
        showError(errorMessage);
        throw error;
    }
};

export const getDatabaseExportInfo = async (): Promise<{ size: string; table_count: number; top_tables: { name: string; size: string }[] }> => {
    const response = await api.get<{ size: string; table_count: number; top_tables: { name: string; size: string }[] }>(`${BASE_URL}/database-export/info/`);
    return requireResponseData(response, 'API response missing database info.');
};