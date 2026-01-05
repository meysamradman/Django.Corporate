import { Base } from "@/types/shared/base";
import { Media } from "@/types/shared/media";

export interface Portfolio extends Base {
    status: "draft" | "published";
    title: string;
    slug: string;
    short_description: string;
    description: string;
    is_featured: boolean;
    is_public: boolean;
    is_active: boolean;
    main_image?: {
        id: number;
        file_url: string;
        title: string;
        alt_text: string;
    } | null;
    categories: PortfolioCategory[];
    tags: PortfolioTag[];
    options: PortfolioOption[];
    meta_title?: string | null;
    meta_description?: string | null;
    og_title?: string | null;
    og_description?: string | null;
    og_image?: Media | null;
    canonical_url?: string | null;
}

export interface PortfolioCategory extends Base {
    name: string;
    slug: string;
    parent_id?: number | null;
    description?: string;
    image?: Media | null;
}

export interface PortfolioTag extends Base {
    name: string;
    slug: string;
}

export interface PortfolioOption extends Base {
    name: string;
    value: string;
    icon?: string;
}