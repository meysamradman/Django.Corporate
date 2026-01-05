import { z } from "zod";
import { msg } from "@/core/messages";
import { validateSlug } from "@/core/slug/validate";

export const propertyLabelFormSchema = z.object({
    title: z
        .string()
        .min(1, { message: msg.realEstate().validation.labelTitleRequired })
        .min(3, { message: msg.realEstate().validation.labelTitleMinLength })
        .max(200, { message: msg.realEstate().validation.labelTitleMaxLength }),

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

    is_active: z
        .boolean()
        .default(true)
        .optional(),
});

export type PropertyLabelFormValues = z.infer<typeof propertyLabelFormSchema>;

export const propertyLabelFormDefaults: Partial<PropertyLabelFormValues> = {
    title: "",
    slug: "",
    is_active: true,
};

