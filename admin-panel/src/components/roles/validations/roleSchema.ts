import { z } from "zod";
import { msg } from "@/core/messages";

export const roleFormSchema = z.object({
  name: z
    .string()
    .min(1, { message: msg.validation("required", { field: "نام نقش" }) })
    .min(2, { message: msg.validation("minLength", { field: "نام نقش", min: 2 }) })
    .max(100, { message: msg.validation("maxLength", { field: "نام نقش", max: 100 }) }),
  
  description: z
    .string()
    .max(300, { message: msg.validation("roleDescMaxLength") })
    .optional()
    .or(z.literal("")),
  
  permission_ids: z
    .array(z.number())
    .default([])
    .refine((val) => val.length > 0, {
      message: msg.validation("permissionsRequired")
    }),
});

export type RoleFormValues = z.infer<typeof roleFormSchema>;

export const roleFormDefaults: Partial<RoleFormValues> = {
  name: "",
  description: "",
  permission_ids: [],
};
