import { fetchApi } from "@/core/config/fetch";
import {
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
        const response = await fetchApi.get<ContactFormField[]>(url);
        
        if (!response || !response.data) {
            return [];
        }
        return Array.isArray(response.data) ? response.data : [];
    }

    async getFieldById(id: number): Promise<ContactFormField> {
        const response = await fetchApi.get<{ data: ContactFormField }>(
            `${this.baseUrl}fields/${id}/`
        );
        return response.data.data;
    }

    async createField(data: ContactFormFieldCreate): Promise<ContactFormField> {
        const response = await fetchApi.post<{ data: ContactFormField }>(
            `${this.baseUrl}fields/`,
            data
        );
        return response.data.data;
    }

    async updateField(id: number, data: ContactFormFieldUpdate): Promise<ContactFormField> {
        const response = await fetchApi.patch<{ data: ContactFormField }>(
            `${this.baseUrl}fields/${id}/`,
            data
        );
        return response.data.data;
    }

    async deleteField(id: number): Promise<void> {
        await fetchApi.delete(`${this.baseUrl}fields/${id}/`);
    }

    async getFieldsForPlatform(platform: 'website' | 'mobile_app'): Promise<ContactFormField[]> {
        const response = await fetchApi.get<ContactFormField[]>(
            `${this.baseUrl}fields/get_fields_for_platform/?platform=${platform}`
        );
        return Array.isArray(response.data) ? response.data : [];
    }

    async createSubmission(data: ContactFormSubmissionCreate): Promise<void> {
        await fetchApi.post(
            `${this.baseUrl}submissions/`,
            data
        );
    }
}

export const formApi = new FormApi();

