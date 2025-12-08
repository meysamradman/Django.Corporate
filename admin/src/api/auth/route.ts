import {fetchApi} from '@/core/config/fetch';
import {LoginRequest, LoginResponse} from '@/types/auth/auth';
import {AdminWithProfile} from '@/types/auth/admin';
import { showError } from '@/core/toast';

export const authApi = {
    getCSRFToken: async (): Promise<{csrf_token: string}> => {
        try {
            const response = await fetchApi.get<{csrf_token: string}>('/admin/login/');
            return response.data;
        } catch (error) {
            showError(error);
            throw error;
        }
    },

    login: async (data: LoginRequest): Promise<LoginResponse> => {
        const payload = data as unknown as Record<string, unknown>;
        const response = await fetchApi.post<LoginResponse>('/admin/login/', payload);
        return response.data;
    },

    logout: async (): Promise<void> => {
        await fetchApi.post('/admin/logout/', {});
    },

    sendOTP: async (mobile: string): Promise<void> => {
        try {
            await fetchApi.post('/mobile/send-otp/', {mobile});
        } catch (error) {
            showError(error);
            throw error;
        }
    },

    verifyOTP: async (identifier: string, otp: string): Promise<void> => {
        try {
            await fetchApi.post('/mobile/verify-otp/', {identifier, otp});
        } catch (error) {
            showError(error);
            throw error;
        }
    },

    getCurrentAdminUser: async (options?: {
        refresh?: boolean
    }): Promise<AdminWithProfile> => {
        let url = '/admin/profile/';
        if (options?.refresh) {
            url += url.includes('?') ? '&refresh=1' : '?refresh=1';
        }
        const response = await fetchApi.get<AdminWithProfile>(url);
        if (!response.data) {
            throw new Error("API returned success but no admin user data found.");
        }

        return response.data;
    },

    isAdminAuthenticated: async (): Promise<boolean> => {
        try {
            const user = await authApi.getCurrentAdminUser({refresh: true});
            return !!user;
        } catch (error) {
            return false;
        }
    },

    getOTPSettings: async (): Promise<{ otp_length: number }> => {
        try {
            const response = await fetchApi.get<{ otp_length: number }>('/mobile/otp-settings/');
            return response.data;
        } catch (error) {
            return {otp_length: 5};
        }
    },

    getCaptchaChallenge: async (): Promise<{ captcha_id: string; digits: string }> => {
        const response = await fetchApi.get<{ captcha_id: string; digits: string }>('/admin/auth/captcha/generate/');
        return response.data;
    },
};
