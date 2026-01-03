import type { Base } from "@/types/shared/base";

export interface Media extends Base {
    title?: string;
    media_type?: string;
    file_url: string; 
    file_name?: string;
    original_file_name?: string;
    file_size?: number;
    mime_type?: string;
    cover_image?: Media | number | null;
    cover_image_url?: string;
    alt_text?: string;
    is_active?: boolean;
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

export interface MediaUploadSettings {
  MEDIA_IMAGE_SIZE_LIMIT: number;
  MEDIA_VIDEO_SIZE_LIMIT: number;
  MEDIA_AUDIO_SIZE_LIMIT: number;
  MEDIA_DOCUMENT_SIZE_LIMIT: number;
  MEDIA_ALLOWED_IMAGE_EXTENSIONS: string[];
  MEDIA_ALLOWED_VIDEO_EXTENSIONS: string[];
  MEDIA_ALLOWED_AUDIO_EXTENSIONS: string[];
  MEDIA_ALLOWED_PDF_EXTENSIONS: string[];
}