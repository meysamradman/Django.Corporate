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

export interface GeneralSettings {
    id: number;
    public_id: string;
    site_name: string;
    enamad_image: number | null;
    enamad_image_data: ImageMedia | null;
    logo_image: number | null;
    logo_image_data: ImageMedia | null;
    favicon_image: number | null;
    favicon_image_data: ImageMedia | null;
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
    icon_data: ImageMedia | null;
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

class SettingsApi {
    private baseUrl = '/settings/';

    async getGeneralSettings(): Promise<GeneralSettings> {
        const response = await fetchApi.get<GeneralSettings>(
            `${this.baseUrl}general/`
        );
        return response.data;
    }

    async updateGeneralSettings(data: GeneralSettingsUpdate): Promise<GeneralSettings> {
        const settings = await this.getGeneralSettings();
        const response = await fetchApi.patch<GeneralSettings>(
            `${this.baseUrl}general/${settings.id}/`,
            data as unknown as Record<string, unknown>
        );
        return response.data;
    }

    async getContactPhones(): Promise<ContactPhone[]> {
        const response = await fetchApi.get<ContactPhone[]>(
            `${this.baseUrl}phones/`
        );
        return response.data;
    }

    async createContactPhone(data: ContactPhoneCreate): Promise<ContactPhone> {
        const response = await fetchApi.post<ContactPhone>(
            `${this.baseUrl}phones/`,
            data as unknown as Record<string, unknown>
        );
        return response.data;
    }

    async updateContactPhone(id: number, data: ContactPhoneUpdate): Promise<ContactPhone> {
        const response = await fetchApi.patch<ContactPhone>(
            `${this.baseUrl}phones/${id}/`,
            data as unknown as Record<string, unknown>
        );
        return response.data;
    }

    async deleteContactPhone(id: number): Promise<void> {
        await fetchApi.delete(`${this.baseUrl}phones/${id}/`);
    }

    async getContactMobiles(): Promise<ContactMobile[]> {
        const response = await fetchApi.get<ContactMobile[]>(
            `${this.baseUrl}mobiles/`
        );
        return response.data;
    }

    async createContactMobile(data: ContactMobileCreate): Promise<ContactMobile> {
        const response = await fetchApi.post<ContactMobile>(
            `${this.baseUrl}mobiles/`,
            data as unknown as Record<string, unknown>
        );
        return response.data;
    }

    async updateContactMobile(id: number, data: ContactMobileUpdate): Promise<ContactMobile> {
        const response = await fetchApi.patch<ContactMobile>(
            `${this.baseUrl}mobiles/${id}/`,
            data as unknown as Record<string, unknown>
        );
        return response.data;
    }

    async deleteContactMobile(id: number): Promise<void> {
        await fetchApi.delete(`${this.baseUrl}mobiles/${id}/`);
    }

    async getContactEmails(): Promise<ContactEmail[]> {
        const response = await fetchApi.get<ContactEmail[]>(
            `${this.baseUrl}emails/`
        );
        return response.data;
    }

    async createContactEmail(data: ContactEmailCreate): Promise<ContactEmail> {
        const response = await fetchApi.post<ContactEmail>(
            `${this.baseUrl}emails/`,
            data as unknown as Record<string, unknown>
        );
        return response.data;
    }

    async updateContactEmail(id: number, data: ContactEmailUpdate): Promise<ContactEmail> {
        const response = await fetchApi.patch<ContactEmail>(
            `${this.baseUrl}emails/${id}/`,
            data as unknown as Record<string, unknown>
        );
        return response.data;
    }

    async deleteContactEmail(id: number): Promise<void> {
        await fetchApi.delete(`${this.baseUrl}emails/${id}/`);
    }

    async getSocialMedias(): Promise<SocialMedia[]> {
        const response = await fetchApi.get<SocialMedia[]>(
            `${this.baseUrl}social-media/`
        );
        return response.data;
    }

    async createSocialMedia(data: SocialMediaCreate): Promise<SocialMedia> {
        const response = await fetchApi.post<SocialMedia>(
            `${this.baseUrl}social-media/`,
            data as unknown as Record<string, unknown>
        );
        return response.data;
    }

    async updateSocialMedia(id: number, data: SocialMediaUpdate): Promise<SocialMedia> {
        const response = await fetchApi.patch<SocialMedia>(
            `${this.baseUrl}social-media/${id}/`,
            data as unknown as Record<string, unknown>
        );
        return response.data;
    }

    async deleteSocialMedia(id: number): Promise<void> {
        await fetchApi.delete(`${this.baseUrl}social-media/${id}/`);
    }
}

export const settingsApi = new SettingsApi();

