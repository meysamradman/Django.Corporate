import { z } from "zod";
import { msg } from "@/core/messages";
import { validateSlug } from "@/core/slug/validate";

export const propertyFeatureFormSchema = z.object({
    title: z
        .string()
        .min(1, { message: msg.realEstate().validation.featureTitleRequired })
        .min(3, { message: msg.realEstate().validation.featureTitleMinLength })
        .max(200, { message: msg.realEstate().validation.featureTitleMaxLength }),

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

    group: z
        .string()
        .max(100, { message: msg.realEstate().validation.featureGroupMaxLength })
        .optional()
        .or(z.literal("")),

    parent_id: z
        .number()
        .int()
        .positive()
        .nullable()
        .optional(),

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

export type PropertyFeatureFormValues = z.input<typeof propertyFeatureFormSchema>;

export const propertyFeatureFormDefaults: PropertyFeatureFormValues = {
    title: "",
    slug: "",
    group: "",
    parent_id: null,
    is_active: true,
    image_id: null,
} as PropertyFeatureFormValues;

