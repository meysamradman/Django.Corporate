import type { Base } from "@/types/shared/base";
import type { Media } from "@/types/shared/media";

export interface Property extends Base {
    title: string;
    slug: string;
    short_description: string;
    description: string;
    is_published: boolean;
    is_featured: boolean;
    is_active: boolean;
    status: string;

    main_image?: {
        id: number;
        url?: string;
        file_url?: string;
        title: string;
        alt_text: string;
    } | null;

    property_type?: PropertyType | null;
    state?: PropertyState | null;
    labels: PropertyLabel[];
    tags: PropertyTag[];
    features: PropertyFeature[];

    price?: number | null;
    sale_price?: number | null;
    monthly_rent?: number | null;
    mortgage_amount?: number | null;

    land_area?: number | null;
    built_area?: number | null;
    bedrooms?: number | null;
    bathrooms?: number | null;
    year_built?: number | null;

    province_name?: string;
    city_name?: string;
    district_name?: string;
    neighborhood?: string;
    address?: string | null;

    latitude?: number | null;
    longitude?: number | null;

    views_count?: number;
    favorites_count?: number;

    media?: PropertyMediaItem[];
    floor_plans?: FloorPlan[];
}

export interface PropertyType extends Base {
    name: string;
    slug: string;
    description?: string;
    // Backend public serializer returns `image_url` string.
    image_url?: string | null;
    // Keep `image` optional for any other endpoints that return a nested Media object.
    image?: Media | null;
}

export interface PropertyState extends Base {
    title?: string;
    name: string;
    slug: string;
    usage_type: string; // sale, rent, etc.
    image_url?: string | null;
    property_count?: number;
}

export interface PropertyLabel extends Base {
    name: string;
    slug: string;
    color?: string;
}

export interface PropertyTag extends Base {
    name: string;
    slug: string;
}

export interface PropertyFeature extends Base {
    name: string;
    slug: string;
    icon?: string;
}

export interface PropertyMediaItem {
    id: number;
    media: Media;
    is_main_image?: boolean;
    order: number;
}

export interface FloorPlan {
    id: number;
    title: string;
    floor_size: number;
    bedrooms?: number | null;
    bathrooms?: number | null;
    price?: number | null;
    unit_type?: string;
    main_image?: {
        url: string;
        title: string;
    } | null;
}
