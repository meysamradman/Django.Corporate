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
    .min(1, { message: msg.validation("permissionsRequired") })
    .default([]),
});

export type RoleFormValues = z.input<typeof roleFormSchema>;

export const roleFormDefaults: RoleFormValues = {
  name: "",
  description: "",
  permission_ids: [],
};
