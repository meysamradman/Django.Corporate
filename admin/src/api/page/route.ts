import { fetchApi } from "@/core/config/fetch";

export interface ImageMedia {
    id: number;
    public_id: string;
    title: string;
    file_url: string;
    file_size: number;
    mime_type: string;
    alt_text: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    media_type: string;
}

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
    og_image_data?: ImageMedia | null;
    canonical_url?: string | null;
    robots_meta?: string | null;
    structured_data?: Record<string, any> | null;
    hreflang_data?: Record<string, any> | null;
    featured_image?: number | null;
    featured_image_data?: ImageMedia | null;
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
    og_image_data?: ImageMedia | null;
    canonical_url?: string | null;
    robots_meta?: string | null;
    structured_data?: Record<string, any> | null;
    hreflang_data?: Record<string, any> | null;
    featured_image?: number | null;
    featured_image_data?: ImageMedia | null;
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

class PageApi {
    private baseUrl = '/pages/';

    async getAboutPage(): Promise<AboutPage> {
        const response = await fetchApi.get<AboutPage>(
            `${this.baseUrl}about/`
        );
        return response.data;
    }

    async updateAboutPage(data: AboutPageUpdate): Promise<AboutPage> {
        const response = await fetchApi.patch<AboutPage>(
            `${this.baseUrl}about/`,
            data
        );
        return response.data;
    }

    async getTermsPage(): Promise<TermsPage> {
        const response = await fetchApi.get<TermsPage>(
            `${this.baseUrl}terms/`
        );
        return response.data;
    }

    async updateTermsPage(data: TermsPageUpdate): Promise<TermsPage> {
        const response = await fetchApi.patch<TermsPage>(
            `${this.baseUrl}terms/`,
            data
        );
        return response.data;
    }
}

export const pageApi = new PageApi();

