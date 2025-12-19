import { api } from '@/core/config/api';
import { getCrud } from '@/core/messages';
import type {
    ContactFormField,
    ContactFormFieldCreate,
    ContactFormFieldUpdate,
    ContactFormSubmissionCreate
} from "@/types/form/contactForm";

class FormApi {
    private baseUrl = '/form/';

    async getFields(params?: { is_active?: boolean; platform?: string }): Promise<ContactFormField[]> {
        const queryParams = new URLSearchParams();
        if (params?.is_active !== undefined) {
            queryParams.append('is_active', String(params.is_active));
        }
        if (params?.platform) {
            queryParams.append('platform', params.platform);
        }
        queryParams.append('limit', '1000');

        const queryString = queryParams.toString();
        const url = `${this.baseUrl}fields/${queryString ? '?' + queryString : ''}`;
        
        try {
            const response = await api.get<ContactFormField[]>(url, {
                silent: true
            });

            if (!response || !response.data) {
                return [];
            }
            return Array.isArray(response.data) ? response.data : [];
        } catch (error) {
            return [];
        }
    }

    async getFieldById(id: number): Promise<ContactFormField> {
        const response = await api.get<{ data: ContactFormField }>(
            `${this.baseUrl}fields/${id}/`,
            {
                showErrorToast: true
            }
        );
        return response.data.data;
    }

    async createField(data: ContactFormFieldCreate): Promise<ContactFormField> {
        const response = await api.post<{ data: ContactFormField }>(
            `${this.baseUrl}fields/`,
            data,
            {
                showSuccessToast: true,
                successMessage: getCrud('created', { item: 'فیلد فرم' })
            }
        );
        return response.data.data;
    }

    async updateField(id: number, data: ContactFormFieldUpdate): Promise<ContactFormField> {
        const response = await api.patch<{ data: ContactFormField }>(
            `${this.baseUrl}fields/${id}/`,
            data,
            {
                showSuccessToast: true,
                successMessage: getCrud('updated', { item: 'فیلد فرم' })
            }
        );
        return response.data.data;
    }

    async deleteField(id: number): Promise<void> {
        await api.delete(`${this.baseUrl}fields/${id}/`, {
            showSuccessToast: true,
            successMessage: getCrud('deleted', { item: 'فیلد فرم' })
        });
    }

    async getFieldsForPlatform(platform: 'website' | 'mobile_app'): Promise<ContactFormField[]> {
        try {
            const response = await api.get<ContactFormField[]>(
                `${this.baseUrl}fields/get_fields_for_platform/?platform=${platform}`,
                {
                    silent: true
                }
            );
            return Array.isArray(response.data) ? response.data : [];
        } catch (error) {
            return [];
        }
    }

    async createSubmission(data: ContactFormSubmissionCreate): Promise<void> {
        await api.post(
            `${this.baseUrl}submissions/`,
            data,
            {
                showSuccessToast: true,
                successMessage: getCrud('created', { item: 'پیام' })
            }
        );
    }
}

export const formApi = new FormApi();

