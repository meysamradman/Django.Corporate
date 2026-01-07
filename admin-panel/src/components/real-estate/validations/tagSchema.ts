import { z } from "zod";
import { msg } from "@/core/messages";
import { validateSlug } from "@/core/slug/validate";

export const propertyTagFormSchema = z.object({
    title: z
        .string()
        .min(1, { message: msg.realEstate().validation.tagTitleRequired })
        .min(3, { message: msg.realEstate().validation.tagTitleMinLength })
        .max(200, { message: msg.realEstate().validation.tagTitleMaxLength }),

    slug: z
        .string()
        .min(1, { message: msg.realEstate().validation.slugRequired })
        .superRefine((val, ctx) => {
            const result = validateSlug(val, true);
            if (!result.isValid) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: result.error || msg.realEstate().validation.slugInvalid,
                });
            }
        }),

    description: z
        .string()
        .max(1000, { message: msg.realEstate().validation.tagDescriptionMaxLength })
        .optional()
        .or(z.literal("")),

    is_active: z
        .boolean()
        .default(true)
        .optional(),

    is_public: z
        .boolean()
        .default(true)
        .optional(),
});

export type PropertyTagFormValues = z.infer<typeof propertyTagFormSchema>;

export const propertyTagFormDefaults: PropertyTagFormValues = {
    title: "",
    slug: "",
    description: "",
    is_active: true,
    is_public: true,
} as PropertyTagFormValues;

