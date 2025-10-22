import { z } from "zod";
import { msg } from "@/core/messages/message";

/**
 * Zod Schema برای Validation فرم نقش
 * 
 * @description
 * این Schema تمام فیلدهای فرم نقش را validate می‌کند
 * و از message system برای نمایش خطاها استفاده می‌کند
 */
export const roleFormSchema = z.object({
  // ✅ ضروری: نام نقش
  name: z
    .string()
    .min(1, { message: msg.validation("roleNameRequired") })
    .min(2, { message: msg.validation("roleNameMinLength") })
    .max(100, { message: msg.validation("roleNameMaxLength") }),
  
  // ❌ اختیاری: توضیحات
  description: z
    .string()
    .max(300, { message: msg.validation("roleDescMaxLength") })
    .optional()
    .or(z.literal("")),
  
  // ✅ ضروری: دسترسی‌ها (حداقل یکی)
  permission_ids: z
    .array(z.number())
    .default([])
    .refine((val) => val.length > 0, {
      message: msg.validation("rolePermissionsRequired")
    }),
});

/**
 * TypeScript Type از Zod Schema
 */
export type RoleFormValues = z.infer<typeof roleFormSchema>;

/**
 * Default Values برای فرم
 */
export const roleFormDefaults: Partial<RoleFormValues> = {
  name: "",
  description: "",
  permission_ids: [], // شروع با آرایه خالی، validation خطا میده اگه خالی بمونه
};

