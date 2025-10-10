import { AdminWithProfile } from "@/types/auth/admin";

export interface LoginResponse {
    access_token: string;
    refresh_token: string;
    user: AdminWithProfile;
}

export interface LoginRequest {
    mobile: string;
    password?: string;
    login_type?: string;
    otp_code?: string;
    captcha_id: string;
    captcha_answer: string;
}