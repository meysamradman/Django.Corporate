import { Media } from "@/types/shared/media";

export interface AboutPage {
    id: number;
    public_id: string;
    title: string;
    content: string;
    short_description?: string | null;
    meta_title?: string | null;
    meta_description?: string | null;
    og_title?: string | null;
    og_description?: string | null;
    og_image?: number | null;
    og_image_data?: Media | null;
    canonical_url?: string | null;
    robots_meta?: string | null;
    structured_data?: Record<string, any> | null;
    hreflang_data?: Record<string, any> | null;
    featured_image?: number | null;
    featured_image_data?: Media | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    computed_meta_title?: string;
    computed_meta_description?: string;
    computed_og_title?: string;
    computed_og_description?: string;
    computed_canonical_url?: string;
}

export interface TermsPage {
    id: number;
    public_id: string;
    title: string;
    content: string;
    short_description?: string | null;
    meta_title?: string | null;
    meta_description?: string | null;
    og_title?: string | null;
    og_description?: string | null;
    og_image?: number | null;
    og_image_data?: Media | null;
    canonical_url?: string | null;
    robots_meta?: string | null;
    structured_data?: Record<string, any> | null;
    hreflang_data?: Record<string, any> | null;
    featured_image?: number | null;
    featured_image_data?: Media | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    computed_meta_title?: string;
    computed_meta_description?: string;
    computed_og_title?: string;
    computed_og_description?: string;
    computed_canonical_url?: string;
}

export interface AboutPageUpdate {
    title?: string;
    content?: string;
    short_description?: string | null;
    meta_title?: string | null;
    meta_description?: string | null;
    og_title?: string | null;
    og_description?: string | null;
    og_image?: number | null;
    canonical_url?: string | null;
    robots_meta?: string | null;
    structured_data?: Record<string, any> | null;
    hreflang_data?: Record<string, any> | null;
    featured_image?: number | null;
    is_active?: boolean;
}

export interface TermsPageUpdate {
    title?: string;
    content?: string;
    short_description?: string | null;
    meta_title?: string | null;
    meta_description?: string | null;
    og_title?: string | null;
    og_description?: string | null;
    og_image?: number | null;
    canonical_url?: string | null;
    robots_meta?: string | null;
    structured_data?: Record<string, any> | null;
    hreflang_data?: Record<string, any> | null;
    featured_image?: number | null;
    is_active?: boolean;
}

