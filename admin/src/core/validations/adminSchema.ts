import { z } from "zod";
import { msg } from "@/core/messages/message";

/**
 * Zod Schema برای Validation فرم ادمین
 * 
 * @description
 * این Schema تمام فیلدهای فرم ادمین را validate می‌کند
 * و از message system برای نمایش خطاها استفاده می‌کند
 */
export const adminFormSchema = z.object({
  // اطلاعات پایه (BaseInfoTab)
  // ✅ ضروری: موبایل
  mobile: z
    .string()
    .min(1, { message: msg.validation("mobileRequired") })
    .regex(/^09\d{9}$/, { message: msg.validation("mobileInvalid") }),
  
  // ❌ اختیاری: ایمیل
  email: z
    .string()
    .email({ message: msg.validation("emailInvalid") })
    .optional()
    .or(z.literal("")),
  
  // ✅ ضروری: رمز عبور
  password: z
    .string()
    .min(1, { message: msg.validation("passwordRequired") })
    .min(8, { message: msg.validation("passwordMinLength") })
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/, {
      message: msg.validation("passwordComplexity")
    }),
  
  // ✅ ضروری: نام کامل
  full_name: z
    .string()
    .min(1, { message: msg.validation("fullNameRequired") })
    .min(2, { message: msg.validation("fullNameMinLength") })
    .max(100, { message: msg.validation("fullNameMaxLength") }),
  
  // ❌ اختیاری: سوپر ادمین
  is_superuser: z.boolean().default(false),
  
  // ❌ اختیاری: نقش
  role_id: z
    .string()
    .optional()
    .or(z.literal("none")),
  
  // اطلاعات پروفایل (ProfileTab)
  // ❌ اختیاری: نام
  profile_first_name: z
    .string()
    .max(50, { message: msg.validation("firstNameMaxLength") })
    .optional()
    .or(z.literal("")),
  
  // ❌ اختیاری: نام خانوادگی
  profile_last_name: z
    .string()
    .max(50, { message: msg.validation("lastNameMaxLength") })
    .optional()
    .or(z.literal("")),
  
  // ❌ اختیاری: تاریخ تولد
  profile_birth_date: z
    .string()
    .optional()
    .or(z.literal("")),
  
  // ❌ اختیاری: کد ملی
  profile_national_id: z
    .string()
    .refine((val) => {
      // اگر خالی بود، OK
      if (!val || val === "") return true;
      // اگر پر بود، باید 10 رقم باشد
      if (val.length !== 10) return false;
      // و باید فقط عدد باشد
      return /^\d{10}$/.test(val);
    }, {
      message: msg.validation("nationalIdInvalid")
    })
    .optional()
    .or(z.literal("")),
  
  // ❌ اختیاری: آدرس
  profile_address: z
    .string()
    .max(500, { message: msg.validation("addressMaxLength") })
    .optional()
    .or(z.literal("")),
  
  // ❌ اختیاری: بخش
  profile_department: z
    .string()
    .max(100, { message: msg.validation("departmentMaxLength") })
    .optional()
    .or(z.literal("")),
  
  // ❌ اختیاری: سمت
  profile_position: z
    .string()
    .max(100, { message: msg.validation("positionMaxLength") })
    .optional()
    .or(z.literal("")),
  
  // ❌ اختیاری: بیوگرافی
  profile_bio: z
    .string()
    .max(1000, { message: msg.validation("bioMaxLength") })
    .optional()
    .or(z.literal("")),
  
  // ❌ اختیاری: یادداشت‌ها
  profile_notes: z
    .string()
    .max(1000, { message: msg.validation("notesMaxLength") })
    .optional()
    .or(z.literal("")),
  
  // ❌ اختیاری: تصویر پروفایل
  profile_picture: z
    .any()
    .nullable()
    .optional(),
});

/**
 * TypeScript Type از Zod Schema
 */
export type AdminFormValues = z.infer<typeof adminFormSchema>;

/**
 * Default Values برای فرم
 */
export const adminFormDefaults: Partial<AdminFormValues> = {
  mobile: "",
  email: "",
  password: "",
  full_name: "",
  is_superuser: false,
  role_id: "none",
  profile_first_name: "",
  profile_last_name: "",
  profile_birth_date: "",
  profile_national_id: "",
  profile_address: "",
  profile_department: "",
  profile_position: "",
  profile_bio: "",
  profile_notes: "",
  profile_picture: null,
};

