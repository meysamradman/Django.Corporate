import { Base } from "@/types/shared/base";

export interface Media extends Base {
    title: string;
    media_type: string;
    file_url: string; 
    file_name?: string;
    original_file_name?: string;
    file_size?: number;
    mime_type?: string;
    cover_image?: Media | number | null;
    cover_image_url?: string;
    alt_text: string;
    is_active: boolean;
}

export interface MediaFilter {
    search?: string;
    file_type?: string;
    page?: number;
    size: number;
    ordering?: string;
    date_from?: string;
    date_to?: string;
    [key: string]: unknown;
}