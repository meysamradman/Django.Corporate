import { z } from "zod";
import { msg } from "@/core/messages";

export const roleFormSchema = z.object({
  name: z
    .string()
    .min(1, { message: msg.role("nameRequired") })
    .min(2, { message: msg.role("nameMinLength") })
    .max(100, { message: msg.role("nameMaxLength") }),
  
  description: z
    .string()
    .max(300, { message: msg.role("descMaxLength") })
    .optional()
    .or(z.literal("")),
  
  permission_ids: z
    .array(z.number())
    .default([])
    .refine((val) => val.length > 0, {
      message: msg.role("permissionsRequired")
    }),
});

export type RoleFormValues = z.infer<typeof roleFormSchema>;

export const roleFormDefaults: Partial<RoleFormValues> = {
  name: "",
  description: "",
  permission_ids: [],
};
