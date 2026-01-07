import { z } from "zod";
import { msg } from "@/core/messages";
import { validateMobile } from "@/core/validation/mobile";
import { validateEmail } from "@/core/validation/email";
import { validatePassword } from "@/core/validation/password";
import { validateNationalId } from "@/core/validation/nationalId";
import { validatePhone } from "@/core/validation/phone";

export const adminFormSchema = z.object({
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

  is_superuser: z.boolean().default(false),

  is_active: z
    .boolean()
    .default(true)
    .optional(),

  role_id: z
    .string()
    .optional()
    .or(z.literal("none")),

  admin_role_type: z
    .enum(["admin", "consultant"])
    .default("admin")
    .optional(),

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
    .int()
    .positive({ message: msg.validation("provinceRequired") })
    .optional()
    .or(z.literal(null)),

  profile_city_id: z
    .number()
    .int()
    .positive({ message: msg.validation("cityRequired") })
    .optional()
    .or(z.literal(null)),

  profile_address: z
    .string()
    .max(500, { message: msg.validation("addressMaxLength") })
    .optional()
    .or(z.literal("")),

  profile_department: z
    .string()
    .max(100, { message: msg.validation("departmentMaxLength") })
    .optional()
    .or(z.literal("")),

  profile_position: z
    .string()
    .max(100, { message: msg.validation("positionMaxLength") })
    .optional()
    .or(z.literal("")),

  profile_bio: z
    .string()
    .max(1000, { message: msg.validation("bioMaxLength") })
    .optional()
    .or(z.literal("")),

  profile_notes: z
    .string()
    .max(1000, { message: msg.validation("notesMaxLength") })
    .optional()
    .or(z.literal("")),

  profile_picture: z
    .any()
    .nullable()
    .optional(),

  // PropertyAgent fields (consultant only)
  license_number: z
    .string()
    .max(100, { message: msg.validation("maxLength", { field: "شماره پروانه", max: 100 }) })
    .optional()
    .or(z.literal("")),

  license_expire_date: z
    .string()
    .optional()
    .or(z.literal("")),

  specialization: z
    .string()
    .max(200, { message: msg.validation("maxLength", { field: "تخصص", max: 200 }) })
    .optional()
    .or(z.literal("")),

  agency_id: z
    .number()
    .int()
    .positive()
    .optional()
    .or(z.literal(null)),

  bio: z
    .string()
    .max(1000, { message: msg.validation("maxLength", { field: "بیوگرافی", max: 1000 }) })
    .optional()
    .or(z.literal("")),

  is_verified: z
    .boolean()
    .optional()
    .default(false),

  // SEO fields for PropertyAgent
  meta_title: z
    .string()
    .max(70, { message: msg.validation("maxLength", { field: "عنوان متا", max: 70 }) })
    .optional()
    .or(z.literal("")),

  meta_description: z
    .string()
    .max(300, { message: msg.validation("maxLength", { field: "توضیحات متا", max: 300 }) })
    .optional()
    .or(z.literal("")),

  meta_keywords: z
    .string()
    .max(200, { message: msg.validation("maxLength", { field: "کلمات کلیدی", max: 200 }) })
    .optional()
    .or(z.literal("")),

  og_title: z
    .string()
    .max(70, { message: msg.validation("maxLength", { field: "عنوان OG", max: 70 }) })
    .optional()
    .or(z.literal("")),

  og_description: z
    .string()
    .max(300, { message: msg.validation("maxLength", { field: "توضیحات OG", max: 300 }) })
    .optional()
    .or(z.literal("")),

  og_image_id: z
    .number()
    .int()
    .positive()
    .optional()
    .or(z.literal(null)),

  og_image: z
    .any()
    .nullable()
    .optional(),
});

export type AdminFormValues = z.input<typeof adminFormSchema>;

export const adminFormDefaults: AdminFormValues = {
  mobile: "",
  email: "",
  password: "",
  full_name: "",
  is_superuser: false,
  is_active: true,
  role_id: "none",
  admin_role_type: "admin",
  // PropertyAgent fields
  license_number: "",
  license_expire_date: "",
  specialization: "",
  agency_id: null,
  bio: "",
  is_verified: false,
  // SEO fields
  meta_title: "",
  meta_description: "",
  meta_keywords: "",
  og_title: "",
  og_description: "",
  og_image_id: null,
  og_image: null,
  // Profile fields
  profile_first_name: "",
  profile_last_name: "",
  profile_birth_date: "",
  profile_national_id: "",
  profile_phone: "",
  profile_province_id: null,
  profile_city_id: null,
  profile_address: "",
  profile_department: "",
  profile_position: "",
  profile_bio: "",
  profile_notes: "",
  profile_picture: null,
};
