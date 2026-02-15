import { api } from '@/core/config/api';
import { endpoints } from '@/core/config/endpoints';
import { ApiError } from '@/types/api/apiError';
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

  getOTPSettings: async (): Promise<{ otp_length: number; otp_resend_seconds: number }> => {
    try {
      const response = await api.getPublic<{ otp_length: number; otp_resend_seconds: number }>('/mobile/otp-settings/');
      return response.data || { otp_length: 5, otp_resend_seconds: 60 };
    } catch {
      return { otp_length: 5, otp_resend_seconds: 60 };
    }
  },

  getCaptchaChallenge: async (): Promise<{ captcha_id: string; digits: string }> => {
    const response = await api.getPublic<{ captcha_id: string; digits: string }>(endpoints.auth.captchaGenerate());
    if (!response.data) {
      throw ApiError.fromMessage('Captcha response data is null', 500, response);
    }
    return response.data;
  },

  requestAdminPasswordResetOtp: async (data: {
    mobile: string;
    captcha_id: string;
    captcha_answer: string;
  }): Promise<void> => {
    await api.post(endpoints.auth.passwordResetRequestOtp(), data as unknown as Record<string, unknown>);
  },

  verifyAdminPasswordResetOtp: async (data: {
    mobile: string;
    otp_code: string;
  }): Promise<{ reset_token: string }> => {
    const response = await api.post<{ reset_token: string }>(
      endpoints.auth.passwordResetVerifyOtp(),
      data as unknown as Record<string, unknown>
    );

    if (!response.data) {
      throw ApiError.fromMessage('Reset token response data is null', 500, response);
    }

    return response.data;
  },

  confirmAdminPasswordReset: async (data: {
    mobile: string;
    reset_token: string;
    new_password: string;
    confirm_password: string;
  }): Promise<void> => {
    await api.post(endpoints.auth.passwordResetConfirm(), data as unknown as Record<string, unknown>);
  },

  getCurrentUser: async (): Promise<AdminUser> => {
    const response = await api.get<AdminUser>(endpoints.auth.getCurrentUser());
    if (!response.data) {
      throw ApiError.fromMessage('User data is null', 500, response);
    }
    return response.data;
  },
};

