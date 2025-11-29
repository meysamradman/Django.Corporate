// ✅ Global Control Setting - تنظیمات کنترل دسترسی ادمین‌های معمولی
export interface GlobalControlSetting {
  id: number;
  provider_name: string;
  allow_normal_admins_use_shared_api: boolean;
  created_at: string;
  updated_at: string;
}

// ✅ AI Provider List (از AIProviderListSerializer)
export interface AIProviderList {
  id: number;
  name: string;
  slug: string;
  display_name: string;
  description: string;
  allow_personal_keys: boolean;
  allow_shared_for_normal_admins: boolean;
  models_count: number;
  has_shared_api: boolean;
  is_active: boolean;
  total_requests: number;
  last_used_at: string | null;
  created_at: string;
}

// ✅ AI Provider Detail (از AIProviderDetailSerializer)
export interface AIProviderDetail extends AIProviderList {
  website: string;
  api_base_url: string;
  shared_api_key_preview: string | null;
  config: Record<string, any>;
  sort_order: number;
  updated_at: string;
}

// ✅ AI Model List (از AIModelListSerializer)
export interface AIModelList {
  id: number;
  name: string;
  model_id: string;
  display_name: string;
  description: string;
  provider_name: string;
  provider_slug: string;
  capabilities: string[];
  pricing_input: number | null;
  pricing_output: number | null;
  is_free: boolean;
  max_tokens: number | null;
  context_window: number | null;
  is_active: boolean;
  total_requests: number;
  last_used_at: string | null;
  sort_order: number;
}

// ✅ AI Model Detail (از AIModelDetailSerializer) - با Computed Fields
export interface AIModelDetail extends AIModelList {
  provider: AIProviderList;
  config: Record<string, any>;
  created_at: string;
  updated_at: string;
  // Computed Fields از backend
  access_state: 'available_shared' | 'available_personal' | 'no_access' | 'disabled';
  api_config: {
    current_source: 'shared' | 'personal' | 'none';
    shared: {
      available: boolean;
      has_access: boolean;
    };
    personal: {
      available: boolean;
      configured: boolean;
    };
  };
  actions: {
    can_use: boolean;
    can_configure: boolean;
  };
  usage_info: {
    current: number;
    limit: number;
  };
}

// ✅ Admin Provider Settings (از AdminProviderSettingsSerializer)
export interface AdminProviderSettings {
  id: number;
  provider_name: string;
  provider_slug: string;
  has_personal_api: boolean;
  use_shared_api: boolean;
  monthly_limit: number;
  monthly_usage: number;
  usage_info: {
    current: number;
    limit: number;
  };
  api_config: {
    current_source: 'shared' | 'personal' | 'none';
    shared: {
      available: boolean;
      has_access: boolean;
    };
    personal: {
      available: boolean;
      configured: boolean;
    };
  };
  actions: {
    can_use: boolean;
    can_configure: boolean;
  };
  total_requests: number;
  last_used_at: string | null;
  is_active: boolean;
}

// Legacy interfaces - برای backward compatibility
export interface AdminAISetting {
  id: number;
  provider_name: string;
  api_key?: string;
  use_shared_api: boolean;
  is_active: boolean;
  monthly_limit: number;
  monthly_usage: number;
  usage_count: number;
  last_used_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AIProvider {
  id: number;
  provider_name: string;
  api_key?: string;
  is_active: boolean;
  config: Record<string, any>;
  usage_count: number;
  last_used_at?: string | null;
  created_at: string;
  updated_at: string;
}

// Existing interfaces
export interface AIContentGenerationRequest {
    provider_name: string;
    topic: string;
    word_count?: number;
    tone?: string;
    keywords?: string[];
}

export interface AIContentGenerationResponse {
    title: string;
    meta_title: string;
    meta_description: string;
    slug: string;
    h1: string;
    content: string;
    keywords: string[];
    word_count: number;
    provider_name: string;
    generation_time_ms: number;
}

export interface AvailableProvider {
    id: number;
    provider_name: string;
    provider_display?: string;
    can_generate?: boolean;
    can_chat?: boolean;
    has_api_key?: boolean;
    is_active?: boolean;
    usage_count?: number;
    last_used_at?: string | null;
}

