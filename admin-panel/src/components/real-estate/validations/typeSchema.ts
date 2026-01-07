import { z } from "zod";
import { msg } from "@/core/messages";
import { validateSlug } from "@/core/slug/validate";

export const propertyTypeFormSchema = z.object({
    title: z
        .string()
        .min(1, { message: msg.realEstate().validation.typeTitleRequired })
        .min(3, { message: msg.realEstate().validation.typeTitleMinLength })
        .max(200, { message: msg.realEstate().validation.typeTitleMaxLength }),

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
        .max(1000, { message: msg.realEstate().validation.typeDescriptionMaxLength })
        .optional()
        .or(z.literal("")),

    parent_id: z
        .number()
        .int()
        .positive()
        .nullable()
        .optional(),

    display_order: z
        .number()
        .int()
        .min(0)
        .default(0)
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

export type PropertyTypeFormValues = z.infer<typeof propertyTypeFormSchema>;

export const propertyTypeFormDefaults: PropertyTypeFormValues = {
    title: "",
    slug: "",
    description: "",
    parent_id: null,
    display_order: 0,
    is_active: true,
    image_id: null,
} as PropertyTypeFormValues;

