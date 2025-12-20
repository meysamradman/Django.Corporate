import { api } from '@/core/config/api';
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
            const response = await api.get<ContactFormField[]>(url);

            if (!response || !response.data) {
                return [];
            }
            return Array.isArray(response.data) ? response.data : [];
        } catch {
            return [];
        }
    }

    async getFieldById(id: number): Promise<ContactFormField> {
        const response = await api.get<{ data: ContactFormField }>(
            `${this.baseUrl}fields/${id}/`
        );
        return response.data.data;
    }

    async createField(data: ContactFormFieldCreate): Promise<ContactFormField> {
        const response = await api.post<{ data: ContactFormField }>(
            `${this.baseUrl}fields/`,
            data
        );
        return response.data.data;
    }

    async updateField(id: number, data: ContactFormFieldUpdate): Promise<ContactFormField> {
        const response = await api.patch<{ data: ContactFormField }>(
            `${this.baseUrl}fields/${id}/`,
            data
        );
        return response.data.data;
    }

    async deleteField(id: number): Promise<void> {
        await api.delete(`${this.baseUrl}fields/${id}/`);
    }

    async getFieldsForPlatform(platform: 'website' | 'mobile_app'): Promise<ContactFormField[]> {
        try {
            const response = await api.get<ContactFormField[]>(
                `${this.baseUrl}fields/get_fields_for_platform/?platform=${platform}`
            );
            return Array.isArray(response.data) ? response.data : [];
        } catch {
            return [];
        }
    }

    async createSubmission(data: ContactFormSubmissionCreate): Promise<void> {
        await api.post(
            `${this.baseUrl}submissions/`,
            data
        );
    }
}

export const formApi = new FormApi();

