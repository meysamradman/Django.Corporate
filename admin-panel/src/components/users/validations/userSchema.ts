import { z } from "zod";
import { msg } from "@/core/messages";
import { validateMobile } from "@/core/validation/mobile";
import { validateEmail } from "@/core/validation/email";
import { validatePassword } from "@/core/validation/password";
import { validateNationalId } from "@/core/validation/nationalId";
import { validatePhone } from "@/core/validation/phone";

export const userFormSchema = z.object({
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
  
  email: z
    .string()
    .superRefine((val, ctx) => {
      if (!val || val === "") return;
      const result = validateEmail(val, false);
      if (!result.isValid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: result.error || msg.validation("emailInvalid"),
        });
      }
    })
    .optional()
    .or(z.literal("")),
  
  password: z
    .string()
    .superRefine((val, ctx) => {
      const result = validatePassword(val);
      if (!result.isValid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: result.error || msg.validation("passwordRequired"),
        });
      }
    }),
  
  full_name: z
    .string()
    .min(1, { message: msg.validation("required", { field: "نام کامل" }) })
    .min(2, { message: msg.validation("minLength", { field: "نام کامل", min: 2 }) })
    .max(100, { message: msg.validation("maxLength", { field: "نام کامل", max: 100 }) }),
  
  profile_first_name: z
    .string()
    .max(50, { message: msg.validation("maxLength", { field: "نام", max: 50 }) })
    .optional()
    .or(z.literal("")),
  
  profile_last_name: z
    .string()
    .max(50, { message: msg.validation("maxLength", { field: "نام خانوادگی", max: 50 }) })
    .optional()
    .or(z.literal("")),
  
  profile_birth_date: z
    .string()
    .optional()
    .or(z.literal("")),
  
  profile_national_id: z
    .string()
    .superRefine((val, ctx) => {
      if (!val || val === "") return;
      const result = validateNationalId(val, false, false);
      if (!result.isValid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: result.error || msg.validation("nationalIdInvalid"),
        });
      }
    })
    .optional()
    .or(z.literal("")),
  
  profile_phone: z
    .string()
    .superRefine((val, ctx) => {
      if (!val || val === "") return;
      const result = validatePhone(val, false);
      if (!result.isValid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: result.error || msg.validation("phoneInvalid"),
        });
      }
    })
    .optional()
    .or(z.literal("")),
  
  profile_province_id: z
    .number()
    .optional()
    .nullable(),
  
  profile_city_id: z
    .number()
    .optional()
    .nullable(),
  
  profile_address: z
    .string()
    .max(500, { message: msg.validation("addressMaxLength") })
    .optional()
    .or(z.literal("")),
  
  profile_bio: z
    .string()
    .max(1000, { message: msg.validation("bioMaxLength") })
    .optional()
    .or(z.literal("")),
  
  profile_picture: z
    .any()
    .nullable()
    .optional(),
  
  is_active: z
    .boolean()
    .default(true)
    .optional(),
});

export type UserFormValues = z.input<typeof userFormSchema>;

export const userFormDefaults: Partial<UserFormValues> = {
  mobile: "",
  email: "",
  password: "",
  full_name: "",
  profile_first_name: "",
  profile_last_name: "",
  profile_birth_date: "",
  profile_national_id: "",
  profile_phone: "",
  profile_province_id: null,
  profile_city_id: null,
  profile_address: "",
  profile_bio: "",
  profile_picture: null,
  is_active: true,
};
