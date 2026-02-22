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
    agent?: PropertyAgent | null;
    owner_type?: "agent" | "admin" | string;
    owner_name?: string | null;
    labels: PropertyLabel[];
    tags: PropertyTag[];
    features: PropertyFeature[];

    price?: number | null;
    sale_price?: number | null;
    pre_sale_price?: number | null;
    price_per_sqm?: number | null;
    monthly_rent?: number | null;
    mortgage_amount?: number | null;
    rent_amount?: number | null;
    security_deposit?: number | null;

    land_area?: number | null;
    built_area?: number | null;
    bedrooms?: number | null;
    bathrooms?: number | null;
    year_built?: number | null;
    build_years?: number | null;
    kitchens?: number | null;
    living_rooms?: number | null;
    floors_in_building?: number | null;
    floor_number?: number | null;
    parking_spaces?: number | null;
    storage_rooms?: number | null;
    document_type?: string | null;
    has_document?: boolean | null;

    province_name?: string;
    city_name?: string;
    district_name?: string;
    neighborhood?: string;
    address?: string | null;
    postal_code?: string | null;
    country_name?: string | null;

    latitude?: number | null;
    longitude?: number | null;

    extra_attributes?: Record<string, unknown> | null;

    views_count?: number;
    favorites_count?: number;

    media?: PropertyMediaItem[];
    floor_plans?: FloorPlan[];
    videos?: PropertyVideoItem[];
    documents?: PropertyDocumentItem[];
}

export interface PropertyAgent extends Base {
    first_name?: string;
    last_name?: string;
    full_name?: string;
    phone?: string;
    email?: string;
    license_number?: string;
    profile_picture_url?: string | null;
    public_url?: string | null;
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
    group?: string | null;
}

export interface PropertyStatusOption {
    value: string;
    label: string;
}

export interface PropertyMediaItem {
    id: number;
    media: Media;
    is_main_image?: boolean;
    order: number;
}

export interface PropertyVideoItem {
    id: number;
    order?: number;
    autoplay?: boolean;
    mute?: boolean;
    show_cover?: boolean;
    media: Media;
    media_detail?: Media;
}

export interface PropertyDocumentItem {
    id: number;
    order?: number;
    title?: string;
    media: Media;
    media_detail?: Media;
}

export interface FloorPlan {
    id: number;
    title: string;
    description?: string | null;
    floor_size: number;
    size_unit?: "sqft" | "sqm" | string;
    bedrooms?: number | null;
    bathrooms?: number | null;
    price?: number | null;
    currency?: string;
    unit_type?: string;
    main_image?: {
        url: string;
        title: string;
    } | null;
}
