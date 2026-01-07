import { z } from "zod";
import { msg } from "@/core/messages";
import { validateSlug } from "@/core/slug/validate";

export const portfolioCategoryFormSchema = z.object({
    name: z
        .string()
        .min(1, { message: msg.portfolio("categoryNameRequired") })
        .min(2, { message: msg.portfolio("categoryNameMinLength") })
        .max(200, { message: msg.portfolio("nameMaxLength") }),

    slug: z
        .string()
        .min(1, { message: msg.portfolio("categorySlugRequired") })
        .superRefine((val, ctx) => {
            const result = validateSlug(val, true);
            if (!result.isValid) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: result.error || msg.portfolio("slugInvalid"),
                });
            }
        }),

    parent_id: z
        .number()
        .int()
        .positive()
        .nullable()
        .optional(),

    description: z
        .string()
        .max(1000, { message: msg.validation("bioMaxLength") }) // ✅ از msg استفاده کنید
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

    image_id: z
        .number()
        .int()
        .positive()
        .nullable()
        .optional(),
});

export type PortfolioCategoryFormValues = z.infer<typeof portfolioCategoryFormSchema>;

export const portfolioCategoryFormDefaults: PortfolioCategoryFormValues = {
    name: "",
    slug: "",
    parent_id: null,
    description: "",
    is_active: true,
    is_public: true,
    image_id: null,
} as PortfolioCategoryFormValues;

