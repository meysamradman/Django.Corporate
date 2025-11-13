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

