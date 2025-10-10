import { Base } from "@/types/shared/base";

export interface Media extends Base {
    title: string;
    media_type: string;
    file_url: string; 
    url?: string; // Alternative URL field from backend
    file_name?: string; // File name from backend
    original_file_name?: string; // Original file name from backend
    file_size?: number;
    mime_type?: string;
    cover_image?: Media | number | null; // Can be a Media object, ID, or null
    cover_image_url?: string; // URL for the cover image provided by backend
    alt_text: string;
    is_active: boolean;
}

// API Request/Response Types
export interface MediaFilter {
    search?: string;
    file_type?: string;
    page?: number;
    size: number; // Required field - like it was before
    ordering?: string;
    date_from?: string;
    date_to?: string;
    [key: string]: unknown;
}