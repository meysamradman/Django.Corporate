import { fetchApi } from '@/lib/fetch';

export interface FormField {
  id: number;
  field_key: string;
  label: string;
  placeholder?: string;
  field_type: 'text' | 'email' | 'tel' | 'number' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'date';
  required: boolean;
  order: number;
  validation_rules?: Record<string, any>;
  options?: string[];
  enabled_for_website: boolean;
  enabled_for_mobile_app: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export const formFieldsApi = {
  /**
   * دریافت فیلدهای فعال برای یک پلتفرم خاص
   * @param platform - 'website' یا 'mobile_app'
   */
  getFieldsForPlatform: async (platform: 'website' | 'mobile_app' = 'website'): Promise<ApiResponse<FormField[]>> => {
    return fetchApi<FormField[]>(`/form/fields/get_fields_for_platform/?platform=${platform}`);
  },
};
