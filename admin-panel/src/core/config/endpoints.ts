import { adminEndpoints } from './adminEndpoints';

export const endpoints = {
  auth: {
    login: () => adminEndpoints.login(),
    logout: () => adminEndpoints.logout(),
    csrfToken: () => adminEndpoints.csrfToken(),
    captchaGenerate: () => adminEndpoints.captchaGenerate(),
    getCurrentUser: () => adminEndpoints.profileMe(),
    passwordResetRequestOtp: () => adminEndpoints.passwordResetRequestOtp(),
    passwordResetVerifyOtp: () => adminEndpoints.passwordResetVerifyOtp(),
    passwordResetConfirm: () => adminEndpoints.passwordResetConfirm(),
  },
};

