import { Media } from "@/types/shared/media";
import { Base } from "@/types/shared/base";

export interface CMSPage extends Base {
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
}

export type AboutPage = CMSPage;
export type TermsPage = CMSPage;
