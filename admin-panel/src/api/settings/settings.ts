import { api } from '@/core/config/api';
import type {
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
    SocialMediaUpdate,
    Slider,
    SliderCreate,
    SliderUpdate,
} from "@/types/settings/generalSettings";
import type { MapSettings } from "@/types/real_estate/map";

class SettingsApi {
    private baseUrl = '/settings/';

    async geocodeMap(query: string, city?: string, province?: string): Promise<{ latitude: number; longitude: number; display_name?: string; source?: string }> {
        const response = await api.get<{ latitude: number; longitude: number; display_name?: string; source?: string }>(
            `${this.baseUrl}map/geocode/`,
            {
                params: { query, city, province },
            }
        );
        return response.data;
    }

    async reverseGeocodeMap(lat: number, lng: number): Promise<any> {
        const response = await api.get<any>(
            `${this.baseUrl}map/reverse-geocode/`,
            {
                params: { lat, lng },
            }
        );
        return response.data;
    }

    async getMapSettings(): Promise<MapSettings> {
        const response = await api.get<MapSettings>(
            `${this.baseUrl}map/`
        );
        return response.data;
    }

    async updateMapSettings(data: Partial<MapSettings>): Promise<MapSettings> {
        const response = await api.patch<MapSettings>(
            `${this.baseUrl}map/1/`, // Usually we only have one row or the first row
            data as unknown as Record<string, unknown>
        );
        return response.data;
    }

    async getGeneralSettings(): Promise<GeneralSettings> {
        const response = await api.get<GeneralSettings>(
            `${this.baseUrl}general/`
        );
        return response.data;
    }

    async updateGeneralSettings(data: GeneralSettingsUpdate): Promise<GeneralSettings> {
        const response = await api.patch<GeneralSettings>(
            `${this.baseUrl}general/1/`,
            data as unknown as Record<string, unknown>
        );
        return response.data;
    }

    async getContactPhones(): Promise<ContactPhone[]> {
        const response = await api.get<ContactPhone[]>(
            `${this.baseUrl}phones/`
        );
        return response.data;
    }

    async createContactPhone(data: ContactPhoneCreate): Promise<ContactPhone> {
        const response = await api.post<ContactPhone>(
            `${this.baseUrl}phones/`,
            data as unknown as Record<string, unknown>
        );
        return response.data;
    }

    async updateContactPhone(id: number, data: ContactPhoneUpdate): Promise<ContactPhone> {
        const response = await api.patch<ContactPhone>(
            `${this.baseUrl}phones/${id}/`,
            data as unknown as Record<string, unknown>
        );
        return response.data;
    }

    async deleteContactPhone(id: number): Promise<void> {
        await api.delete(`${this.baseUrl}phones/${id}/`);
    }

    async getContactMobiles(): Promise<ContactMobile[]> {
        const response = await api.get<ContactMobile[]>(
            `${this.baseUrl}mobiles/`
        );
        return response.data;
    }

    async createContactMobile(data: ContactMobileCreate): Promise<ContactMobile> {
        const response = await api.post<ContactMobile>(
            `${this.baseUrl}mobiles/`,
            data as unknown as Record<string, unknown>
        );
        return response.data;
    }

    async updateContactMobile(id: number, data: ContactMobileUpdate): Promise<ContactMobile> {
        const response = await api.patch<ContactMobile>(
            `${this.baseUrl}mobiles/${id}/`,
            data as unknown as Record<string, unknown>
        );
        return response.data;
    }

    async deleteContactMobile(id: number): Promise<void> {
        await api.delete(`${this.baseUrl}mobiles/${id}/`);
    }

    async getContactEmails(): Promise<ContactEmail[]> {
        const response = await api.get<ContactEmail[]>(
            `${this.baseUrl}emails/`
        );
        return response.data;
    }

    async createContactEmail(data: ContactEmailCreate): Promise<ContactEmail> {
        const response = await api.post<ContactEmail>(
            `${this.baseUrl}emails/`,
            data as unknown as Record<string, unknown>
        );
        return response.data;
    }

    async updateContactEmail(id: number, data: ContactEmailUpdate): Promise<ContactEmail> {
        const response = await api.patch<ContactEmail>(
            `${this.baseUrl}emails/${id}/`,
            data as unknown as Record<string, unknown>
        );
        return response.data;
    }

    async deleteContactEmail(id: number): Promise<void> {
        await api.delete(`${this.baseUrl}emails/${id}/`);
    }

    async getSocialMedias(): Promise<SocialMedia[]> {
        const response = await api.get<SocialMedia[]>(
            `${this.baseUrl}social-media/`
        );
        return response.data;
    }

    async createSocialMedia(data: SocialMediaCreate): Promise<SocialMedia> {
        const response = await api.post<SocialMedia>(
            `${this.baseUrl}social-media/`,
            data as unknown as Record<string, unknown>
        );
        return response.data;
    }

    async updateSocialMedia(id: number, data: SocialMediaUpdate): Promise<SocialMedia> {
        const response = await api.patch<SocialMedia>(
            `${this.baseUrl}social-media/${id}/`,
            data as unknown as Record<string, unknown>
        );
        return response.data;
    }

    async deleteSocialMedia(id: number): Promise<void> {
        await api.delete(`${this.baseUrl}social-media/${id}/`);
    }

    async getSliders(): Promise<Slider[]> {
        const response = await api.get<Slider[]>(
            `${this.baseUrl}sliders/`
        );
        return response.data;
    }

    async createSlider(data: SliderCreate): Promise<Slider> {
        const response = await api.post<Slider>(
            `${this.baseUrl}sliders/`,
            data
        );
        return response.data;
    }

    async updateSlider(id: number, data: SliderUpdate): Promise<Slider> {
        const response = await api.patch<Slider>(
            `${this.baseUrl}sliders/${id}/`,
            data
        );
        return response.data;
    }

    async deleteSlider(id: number): Promise<void> {
        await api.delete(`${this.baseUrl}sliders/${id}/`);
    }
}

export const settingsApi = new SettingsApi();

