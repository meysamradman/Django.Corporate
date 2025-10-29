import { AdminWithProfile } from "@/types/auth/admin";

export interface LoginResponse {
    user_id: number;
    is_superuser: boolean;
}

export interface LoginRequest {
    mobile: string;
    password?: string;
    login_type?: string;
    otp_code?: string;
    captcha_id: string;
    captcha_answer: string;
}