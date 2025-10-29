import { z } from "zod";
import { msg } from "@/core/messages/message";

/**
 * Zod Schema برای Validation فرم ورود
 * 
 * @description
 * این Schema تمام فیلدهای فرم ورود را validate می‌کند
 * و از message system برای نمایش خطاها استفاده می‌کند
 */
export const passwordLoginSchema = z.object({
  mobile: z
    .string()
    .min(1, { message: msg.validation("mobileRequired") })
    .regex(/^09\d{9}$/, { message: msg.validation("mobileInvalid") }),
  
  password: z
    .string()
    .min(1, { message: msg.validation("passwordRequired") }),
  
  captchaAnswer: z
    .string()
    .min(1, { message: msg.validation("captchaRequired") }),
});

export const otpLoginSchema = z.object({
  mobile: z
    .string()
    .min(1, { message: msg.validation("mobileRequired") })
    .regex(/^09\d{9}$/, { message: msg.validation("mobileInvalid") }),
  
  otp: z
    .string()
    .min(1, { message: msg.validation("otpRequired") }),
  
  captchaAnswer: z
    .string()
    .min(1, { message: msg.validation("captchaRequired") }),
});

/**
 * TypeScript Types از Zod Schemas
 */
export type PasswordLoginForm = z.infer<typeof passwordLoginSchema>;
export type OtpLoginForm = z.infer<typeof otpLoginSchema>;

/**
 * Default Values برای فرم‌ها
 */
export const passwordLoginDefaults: Partial<PasswordLoginForm> = {
  mobile: "",
  password: "",
  captchaAnswer: "",
};

export const otpLoginDefaults: Partial<OtpLoginForm> = {
  mobile: "",
  otp: "",
  captchaAnswer: "",
};
