import { fetchApi } from "@/core/config/fetch";

export interface ContactFormField {
    id: number;
    public_id: string;
    field_key: string;
    field_type: 'text' | 'email' | 'phone' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'number' | 'date' | 'url';
    label: string;
    placeholder: string | null;
    required: boolean;
    platforms: string[];
    options: Array<{ value: string; label: string }>;
    validation_rules: Record<string, any>;
    order: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface ContactFormFieldCreate {
    field_key: string;
    field_type: ContactFormField['field_type'];
    label: string;
    placeholder?: string | null;
    required?: boolean;
    platforms: string[];
    options?: Array<{ value: string; label: string }>;
    validation_rules?: Record<string, any>;
    order?: number;
    is_active?: boolean;
}

export interface ContactFormFieldUpdate {
    field_type?: ContactFormField['field_type'];
    label?: string;
    placeholder?: string | null;
    required?: boolean;
    platforms?: string[];
    options?: Array<{ value: string; label: string }>;
    validation_rules?: Record<string, any>;
    order?: number;
    is_active?: boolean;
}

export interface ContactFormSubmissionCreate {
    form_data: Record<string, any>;
    platform: 'website' | 'mobile_app';
}

class FormApi {
    private baseUrl = '/form/';

    async getFields(params?: { is_active?: boolean; platform?: string }): Promise<ContactFormField[]> {
        // Add limit to get all fields (disable pagination)
        const queryParams = new URLSearchParams();
        if (params?.is_active !== undefined) {
            queryParams.append('is_active', String(params.is_active));
        }
        if (params?.platform) {
            queryParams.append('platform', params.platform);
        }
        // Add a large limit to get all fields
        queryParams.append('limit', '1000');
        
        const queryString = queryParams.toString();
        const url = `${this.baseUrl}fields/${queryString ? '?' + queryString : ''}`;
        const response = await fetchApi.get<ContactFormField[]>(url);
        
        // Response structure from APIResponse: { metaData: {...}, data: [...], pagination?: {...} }
        // When paginated: response.data is the array from pagination results
        // When not paginated: response.data is the array directly
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

