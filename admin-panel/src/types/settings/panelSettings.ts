import type { Media } from '@/types/shared/media';

export interface PanelSettings {
    id?: number;
    panel_title?: string;
    web_title?: string;
    logo_id?: number | null;
    favicon_id?: number | null;
    logo?: Media | null;
    favicon?: Media | null;
    logo_url?: string | null;
    favicon_url?: string | null;
    logo_detail?: Media | null;
    favicon_detail?: Media | null;
}