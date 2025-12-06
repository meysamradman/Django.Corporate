import { z } from "zod";
import { msg } from "@/core/messages";

export const adminFormSchema = z.object({
  mobile: z
    .string()
    .min(1, { message: msg.validation("mobileRequired") })
    .regex(/^09\d{9}$/, { message: msg.validation("mobileInvalid") }),
  
  email: z
    .string()
    .email({ message: msg.validation("emailInvalid") })
    .optional()
    .or(z.literal("")),
  
  password: z
    .string()
    .min(1, { message: msg.validation("passwordRequired") })
    .min(8, { message: msg.validation("passwordMinLength") })
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/, {
      message: msg.validation("passwordComplexity")
    }),
  
  full_name: z
    .string()
    .min(1, { message: msg.admin("fullNameRequired") })
    .min(2, { message: msg.admin("fullNameMinLength") })
    .max(100, { message: msg.admin("fullNameMaxLength") }),
  
  is_superuser: z.boolean().default(false),
  
  role_id: z
    .string()
    .optional()
    .or(z.literal("none")),
  
  profile_first_name: z
    .string()
    .max(50, { message: msg.admin("firstNameMaxLength") })
    .optional()
    .or(z.literal("")),
  
  profile_last_name: z
    .string()
    .max(50, { message: msg.admin("lastNameMaxLength") })
    .optional()
    .or(z.literal("")),
  
  profile_birth_date: z
    .string()
    .optional()
    .or(z.literal("")),
  
  profile_national_id: z
    .string()
    .refine((val) => {
      if (!val || val === "") return true;
      if (val.length !== 10) return false;
      return /^\d{10}$/.test(val);
    }, {
      message: msg.validation("nationalIdInvalid")
    })
    .optional()
    .or(z.literal("")),
  
  profile_phone: z
    .string()
    .max(15, { message: msg.admin("phoneMaxLength") })
    .refine((val) => {
      if (!val || val === "") return true;
      return /^\d+$/.test(val);
    }, {
      message: msg.admin("phoneInvalid")
    })
    .optional()
    .or(z.literal("")),
  
  profile_province_id: z
    .number()
    .int()
    .positive({ message: msg.admin("provinceRequired") })
    .optional()
    .or(z.literal(null)),
  
  profile_city_id: z
    .number()
    .int()
    .positive({ message: msg.admin("cityRequired") })
    .optional()
    .or(z.literal(null)),
  
  profile_address: z
    .string()
    .max(500, { message: msg.admin("addressMaxLength") })
    .optional()
    .or(z.literal("")),
  
  profile_department: z
    .string()
    .max(100, { message: msg.admin("departmentMaxLength") })
    .optional()
    .or(z.literal("")),
  
  profile_position: z
    .string()
    .max(100, { message: msg.admin("positionMaxLength") })
    .optional()
    .or(z.literal("")),
  
  profile_bio: z
    .string()
    .max(1000, { message: msg.admin("bioMaxLength") })
    .optional()
    .or(z.literal("")),
  
  profile_notes: z
    .string()
    .max(1000, { message: msg.admin("notesMaxLength") })
    .optional()
    .or(z.literal("")),
  
  profile_picture: z
    .any()
    .nullable()
    .optional(),
});

export type AdminFormValues = z.infer<typeof adminFormSchema>;

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
