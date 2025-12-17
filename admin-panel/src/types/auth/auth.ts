export interface LoginRequest {
  mobile: string;
  password?: string;
  login_type?: string;
  otp_code?: string;
  captcha_id: string;
  captcha_answer: string;
}

export interface LoginResponse {
  user_id: number;
  is_superuser: boolean;
}

export interface AdminUser {
  id: number;
  mobile: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  is_superuser?: boolean;
}

