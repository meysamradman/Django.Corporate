import { z } from "zod";
import { msg } from "@/core/messages";
import { validateSlug } from "@/core/slug/validate";

export const agencyFormSchema = z.object({
    name: z
        .string()
        .min(1, { message: msg.realEstate().validation.agencyNameRequired })
        .min(3, { message: msg.realEstate().validation.agencyNameMinLength })
        .max(200, { message: msg.realEstate().validation.agencyNameMaxLength }),

    slug: z
        .string()
        .optional()
        .nullable()
        .superRefine((val, ctx) => {
            if (val && val.trim()) {
                const result = validateSlug(val, true);
                if (!result.isValid) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: result.error || msg.realEstate().validation.slugInvalid,
                    });
                }
            }
        }),

    phone: z
        .string()
        .min(1, { message: msg.realEstate().validation.agencyPhoneRequired })
        .min(10, { message: msg.realEstate().validation.agencyPhoneMinLength })
        .max(15, { message: msg.realEstate().validation.agencyPhoneMaxLength }),

    email: z
        .string()
        .email({ message: msg.realEstate().validation.agencyEmailInvalid })
        .optional()
        .or(z.literal("")),

    website: z
        .string()
        .url({ message: msg.realEstate().validation.agencyWebsiteInvalid })
        .optional()
        .or(z.literal("")),

    license_number: z
        .string()
        .max(100, { message: msg.realEstate().validation.agencyLicenseNumberMaxLength })
        .optional()
        .nullable()
        .or(z.literal("")),

    license_expire_date: z
        .string()
        .optional()
        .nullable()
        .or(z.literal("")),

    city: z
        .number()
        .int()
        .positive()
        .nullable()
        .optional(),

    province: z
        .number()
        .int()
        .positive()
        .nullable()
        .optional(),

    description: z
        .string()
        .max(1000, { message: msg.realEstate().validation.agencyDescriptionMaxLength })
        .optional()
        .nullable()
        .or(z.literal("")),

    address: z
        .string()
        .max(500, { message: msg.realEstate().validation.agencyAddressMaxLength })
        .optional()
        .nullable()
        .or(z.literal("")),

    is_active: z
        .boolean()
        .default(true)
        .optional(),


    rating: z
        .number()
        .min(0, { message: msg.realEstate().validation.agencyRatingMin })
        .max(5, { message: msg.realEstate().validation.agencyRatingMax })
        .optional()
        .default(0),

    total_reviews: z
        .number()
        .min(0, { message: msg.realEstate().validation.agencyTotalReviewsMin })
        .optional()
        .default(0),

    meta_title: z
        .string()
        .max(70, { message: msg.validation("metaTitleMaxLength") })
        .optional()
        .nullable()
        .or(z.literal("")),

    meta_description: z
        .string()
        .max(160, { message: msg.validation("metaDescMaxLength") })
        .optional()
        .nullable()
        .or(z.literal("")),

    og_title: z
        .string()
        .max(70, { message: msg.validation("ogTitleMaxLength") })
        .optional()
        .nullable()
        .or(z.literal("")),

    og_description: z
        .string()
        .max(160, { message: msg.validation("ogDescMaxLength") })
        .optional()
        .nullable()
        .or(z.literal("")),

    canonical_url: z
        .string()
        .url({ message: msg.validation("urlInvalid") })
        .optional()
        .nullable()
        .or(z.literal("")),

    robots_meta: z
        .string()
        .optional()
        .nullable()
        .or(z.literal("")),
});

export type AgencyFormValues = z.infer<typeof agencyFormSchema>;

export const agencyFormDefaults: Partial<AgencyFormValues> = {
    name: "",
    slug: "",
    phone: "",
    email: "",
    website: "",
    license_number: "",
    license_expire_date: "",
    city: null,
    province: null,
    description: "",
    address: "",
    is_active: true,
    rating: 0,
    total_reviews: 0,
    meta_title: "",
    meta_description: "",
    og_title: "",
    og_description: "",
    canonical_url: "",
    robots_meta: "",
};

