import {fetchApi} from '@/core/config/fetch';
import {LoginRequest, LoginResponse} from '@/types/auth/auth';
import {AdminWithProfile} from '@/types/auth/admin';
import {showErrorToast} from '@/core/config/errorHandler';

export const authApi = {
    login: async (data: LoginRequest): Promise<LoginResponse> => {
        try {
            const response = await fetchApi.post<LoginResponse>('/admin/login/', data);
            return response.data;
        } catch (error) {
            showErrorToast(error, 'Login failed');
            throw error;
        }
    },

    logout: async (): Promise<void> => {
        await fetchApi.post('/admin/logout/', {});
    },

    sendOTP: async (mobile: string): Promise<void> => {
        try {
            await fetchApi.post('/mobile/send-otp/', {mobile});
        } catch (error) {
            showErrorToast(error, 'Failed to send verification code');
            throw error;
        }
    },

    verifyOTP: async (identifier: string, otp: string): Promise<void> => {
        try {
            await fetchApi.post('/mobile/verify-otp/', {identifier, otp});
        } catch (error) {
            showErrorToast(error, 'Invalid verification code');
            throw error;
        }
    },

    getCurrentAdminUser: async (options?: {
        cache?: RequestCache,
        revalidate?: number | false
    }): Promise<AdminWithProfile> => {
        const response = await fetchApi.get<AdminWithProfile>('/admin/profile/', options);
        if (!response.data) {
            throw new Error("API returned success but no admin user data found.");
        }

        return response.data;
    },

    isAdminAuthenticated: async (): Promise<boolean> => {
        try {
            const user = await authApi.getCurrentAdminUser({cache: 'no-store'});
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
            console.error('Error fetching OTP settings:', error);
            return {otp_length: 5};
        }
    },

    getCaptchaChallenge: async (): Promise<{ captcha_id: string; digits: string }> => {
        try {
            const response = await fetchApi.get<{ captcha_id: string; digits: string }>('/admin/auth/captcha/generate/');
            return response.data;
        } catch (error) {
            console.error("CAPTCHA fetch failed:", error);
            showErrorToast(error, 'Failed to load CAPTCHA challenge');
            throw error;
        }
    },
};
