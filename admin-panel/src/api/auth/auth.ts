import { api } from '@/core/config/api';
import { endpoints } from '@/core/config/endpoints';
import type { LoginRequest, LoginResponse, AdminUser } from '@/types/auth/auth';

export const authApi = {
  login: async (data: LoginRequest) => {
    const response = await api.post<LoginResponse>(endpoints.auth.login(), data as unknown as Record<string, unknown>);
    return response.data;
  },

  logout: async () => {
    await api.post(endpoints.auth.logout(), {});
  },

  sendOTP: async (mobile: string): Promise<void> => {
    await api.post('/mobile/send-otp/', { identifier: mobile });
  },

  getOTPSettings: async (): Promise<{ otp_length: number }> => {
    try {
      const response = await api.getPublic<{ otp_length: number }>('/mobile/otp-settings/');
      return response.data || { otp_length: 5 };
    } catch (error) {
      return { otp_length: 5 };
    }
  },

  getCaptchaChallenge: async (): Promise<{ captcha_id: string; digits: string }> => {
    const response = await api.getPublic<{ captcha_id: string; digits: string }>(endpoints.auth.captchaGenerate());
    if (!response.data) {
      throw new Error('Captcha response data is null');
    }
    return response.data;
  },

  getCurrentUser: async (): Promise<AdminUser> => {
    const response = await api.get<AdminUser>(endpoints.auth.getCurrentUser());
    if (!response.data) {
      throw new Error('User data is null');
    }
    return response.data;
  },
};

