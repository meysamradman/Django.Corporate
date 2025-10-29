import { z } from "zod";
import { msg } from "@/core/messages/message";

/**
 * Zod Schema برای Validation فرم کاربر
 * 
 * @description
 * این Schema تمام فیلدهای فرم کاربر را validate می‌کند
 * و از message system برای نمایش خطاها استفاده می‌کند
 */
export const userFormSchema = z.object({
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
      // اگر پر بود، باید دقیقاً 10 رقم باشد
      if (val.length !== 10) return false;
      // و باید فقط عدد باشد
      return /^\d{10}$/.test(val);
    }, {
      message: msg.validation("nationalIdInvalid")
    })
    .optional()
    .or(z.literal("")),
  
  // ❌ اختیاری: تلفن
  profile_phone: z
    .string()
    .max(15, { message: msg.validation("phoneMaxLength") })
    .refine((val) => {
      // اگر خالی بود، OK
      if (!val || val === "") return true;
      // باید فقط عدد باشد (می‌تواند صفر در ابتدای شماره داشته باشد)
      return /^\d+$/.test(val);
    }, {
      message: msg.validation("phoneInvalid")
    })
    .optional()
    .or(z.literal("")),
  
  // ❌ اختیاری: استان ID (عدد)
  profile_province_id: z
    .number()
    .optional()
    .nullable(),
  
  // ❌ اختیاری: شهر ID (عدد)
  profile_city_id: z
    .number()
    .optional()
    .nullable(),
  
  // ❌ اختیاری: آدرس
  profile_address: z
    .string()
    .max(500, { message: msg.validation("addressMaxLength") })
    .optional()
    .or(z.literal("")),
  
  // ❌ اختیاری: بیوگرافی
  profile_bio: z
    .string()
    .max(1000, { message: msg.validation("bioMaxLength") })
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
export type UserFormValues = z.infer<typeof userFormSchema>;

/**
 * Default Values برای فرم
 */
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
};