import { z } from "zod";
import { msg } from "@/core/messages";

export const userFormSchema = z.object({
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
    .min(1, { message: msg.user("fullNameRequired") })
    .min(2, { message: msg.user("fullNameMinLength") })
    .max(100, { message: msg.user("fullNameMaxLength") }),
  
  profile_first_name: z
    .string()
    .max(50, { message: msg.user("firstNameMaxLength") })
    .optional()
    .or(z.literal("")),
  
  profile_last_name: z
    .string()
    .max(50, { message: msg.user("lastNameMaxLength") })
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
    .max(15, { message: msg.user("phoneMaxLength") })
    .refine((val) => {
      if (!val || val === "") return true;
      return /^\d+$/.test(val);
    }, {
      message: msg.user("phoneInvalid")
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
    .max(500, { message: msg.user("addressMaxLength") })
    .optional()
    .or(z.literal("")),
  
  profile_bio: z
    .string()
    .max(1000, { message: msg.user("bioMaxLength") })
    .optional()
    .or(z.literal("")),
  
  profile_picture: z
    .any()
    .nullable()
    .optional(),
});

export type UserFormValues = z.infer<typeof userFormSchema>;

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
