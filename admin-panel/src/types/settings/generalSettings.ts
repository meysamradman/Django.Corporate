import type { Media } from "@/types/shared/media";

export interface GeneralSettings {
    id: number;
    public_id: string;
    site_name: string;
    enamad_image: number | null;
    enamad_image_data: Media | null;
    logo_image: number | null;
    logo_image_data: Media | null;
    favicon_image: number | null;
    favicon_image_data: Media | null;
    copyright_text: string;
    copyright_link: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface ContactPhone {
    id: number;
    public_id: string;
    phone_number: string;
    label: string;
    order: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface ContactMobile {
    id: number;
    public_id: string;
    mobile_number: string;
    label: string;
    order: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface ContactEmail {
    id: number;
    public_id: string;
    email: string;
    label: string;
    order: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface SocialMedia {
    id: number;
    public_id: string;
    name: string;
    url: string;
    icon: number | null;
    icon_data: Media | null;
    order: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface GeneralSettingsUpdate {
    site_name?: string;
    enamad_image?: number | null;
    logo_image?: number | null;
    favicon_image?: number | null;
    copyright_text?: string;
    copyright_link?: string | null;
}

export interface ContactPhoneCreate {
    phone_number: string;
    label?: string;
    order?: number;
    is_active?: boolean;
}

export interface ContactPhoneUpdate {
    phone_number?: string;
    label?: string;
    order?: number;
    is_active?: boolean;
}

export interface ContactMobileCreate {
    mobile_number: string;
    label?: string;
    order?: number;
    is_active?: boolean;
}

export interface ContactMobileUpdate {
    mobile_number?: string;
    label?: string;
    order?: number;
    is_active?: boolean;
}

export interface ContactEmailCreate {
    email: string;
    label?: string;
    order?: number;
    is_active?: boolean;
}

export interface ContactEmailUpdate {
    email?: string;
    label?: string;
    order?: number;
    is_active?: boolean;
}

export interface SocialMediaCreate {
    name: string;
    url: string;
    icon?: number | null;
    order?: number;
    is_active?: boolean;
}

export interface SocialMediaUpdate {
    name?: string;
    url?: string;
    icon?: number | null;
    order?: number;
    is_active?: boolean;
}

export interface Slider {
    id: number;
    title: string;
    description: string;
    image: Media | null;
    image_data?: Media | null;
    video: Media | null;
    video_data?: Media | null;
    link: string;
    order: number;
    is_active: boolean;
    created_at: string;
}

export interface SliderCreate {
    title: string;
    description?: string;
    image_id?: number | null;
    video_id?: number | null;
    link?: string;
    order?: number;
    is_active?: boolean;
}

export interface SliderUpdate {
    title?: string;
    description?: string;
    image_id?: number | null;
    video_id?: number | null;
    link?: string;
    order?: number;
    is_active?: boolean;
}

