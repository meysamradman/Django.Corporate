import { fetchApi } from "@/core/config/fetch";
import {
    GeneralSettings,
    ContactPhone,
    ContactMobile,
    ContactEmail,
    SocialMedia,
    GeneralSettingsUpdate,
    ContactPhoneCreate,
    ContactPhoneUpdate,
    ContactMobileCreate,
    ContactMobileUpdate,
    ContactEmailCreate,
    ContactEmailUpdate,
    SocialMediaCreate,
    SocialMediaUpdate
} from "@/types/settings/generalSettings";

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

