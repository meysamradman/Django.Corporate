import { z } from "zod";
import { msg } from "@/core/messages";
import { validateMobile } from "@/core/validation/mobile";

export const passwordLoginSchema = z.object({
  mobile: z
    .string()
    .superRefine((val, ctx) => {
      const result = validateMobile(val);
      if (!result.isValid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: result.error || msg.validation("mobileInvalid"),
        });
      }
    }),
  
  password: z
    .string()
    .min(1, { message: msg.validation("passwordRequired") }),
  
  captcha_id: z
    .string()
    .min(1, { message: msg.validation("captchaRequired") }),
  
  captcha_answer: z
    .string()
    .min(1, { message: msg.validation("captchaRequired") }),
});

export const otpLoginSchema = z.object({
  mobile: z
    .string()
    .superRefine((val, ctx) => {
      const result = validateMobile(val);
      if (!result.isValid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: result.error || msg.validation("mobileInvalid"),
        });
      }
    }),
  
  otp: z
    .string()
    .min(1, { message: msg.validation("otpRequired") }),
  
  captcha_id: z
    .string()
    .min(1, { message: msg.validation("captchaRequired") }),
  
  captcha_answer: z
    .string()
    .min(1, { message: msg.validation("captchaRequired") }),
});

export type PasswordLoginForm = z.infer<typeof passwordLoginSchema>;
export type OtpLoginForm = z.infer<typeof otpLoginSchema>;

