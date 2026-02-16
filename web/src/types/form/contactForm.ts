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
    [key: string]: unknown;
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
    [key: string]: unknown;
}

export interface ContactFormSubmissionCreate {
    form_data: Record<string, any>;
    platform: 'website' | 'mobile_app';
    [key: string]: unknown;
}

export interface PublicContactFormField {
    field_key: string;
    field_type: ContactFormField['field_type'];
    label: string;
    placeholder: string | null;
    required: boolean;
    options: Array<{ value: string; label: string }>;
    validation_rules: Record<string, any>;
    order: number;
}

export interface PublicContactFormSubmissionCreate {
    form_data: Record<string, any>;
    platform: 'website' | 'mobile_app';
}

