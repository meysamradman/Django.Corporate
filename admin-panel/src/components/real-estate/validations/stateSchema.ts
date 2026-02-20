import { z } from "zod";
import { msg } from "@/core/messages";
import { validateSlug } from "@/core/slug/validate";

export const propertyStateFormSchema = z.object({
    title: z
        .string()
        .min(1, { message: msg.realEstate().validation.stateTitleRequired })
        .min(3, { message: msg.realEstate().validation.stateTitleMinLength })
        .max(200, { message: msg.realEstate().validation.stateTitleMaxLength }),

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

    usage_type: z
        .string()
        .min(1, { message: msg.realEstate().validation.stateUsageTypeRequired }),

    short_description: z
        .string()
        .max(255, { message: msg.realEstate().validation.shortDescMaxLength })
        .optional()
        .or(z.literal("")),

    is_active: z
        .boolean()
        .default(true)
        .optional(),

    image_id: z
        .number()
        .int()
        .positive()
        .nullable()
        .optional(),
});

export type PropertyStateFormValues = z.input<typeof propertyStateFormSchema>;

export const propertyStateFormDefaults: PropertyStateFormValues = {
    title: "",
    slug: "",
    short_description: "",
    usage_type: "sale",
    is_active: true,
    image_id: null,
} as PropertyStateFormValues;

