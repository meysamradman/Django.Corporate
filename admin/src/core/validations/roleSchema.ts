import { z } from "zod";
import { msg } from "@/core/messages/message";

export const roleFormSchema = z.object({
  name: z
    .string()
    .min(1, { message: msg.validation("roleNameRequired") })
    .min(2, { message: msg.validation("roleNameMinLength") })
    .max(100, { message: msg.validation("roleNameMaxLength") }),
  
  description: z
    .string()
    .max(300, { message: msg.validation("roleDescMaxLength") })
    .optional()
    .or(z.literal("")),
  
  permission_ids: z
    .array(z.number())
    .default([])
    .refine((val) => val.length > 0, {
      message: msg.validation("rolePermissionsRequired")
    }),
});

export type RoleFormValues = z.infer<typeof roleFormSchema>;

export const roleFormDefaults: Partial<RoleFormValues> = {
  name: "",
  description: "",
  permission_ids: [],
};

