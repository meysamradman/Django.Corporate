import { z } from "zod";
import { msg } from "@/core/messages";
import { validateSlug } from "@/core/slug/validate";

export const portfolioTagFormSchema = z.object({
    name: z
        .string()
        .min(1, { message: msg.portfolio("tagNameRequired") })
        .min(2, { message: msg.portfolio("tagNameMinLength") })
        .max(200, { message: msg.portfolio("nameMaxLength") }),

    slug: z
        .string()
        .min(1, { message: msg.portfolio("tagSlugRequired") })
        .superRefine((val, ctx) => {
            const result = validateSlug(val, true);
            if (!result.isValid) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: result.error || msg.portfolio("slugInvalid"),
                });
            }
        }),

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
});

export type PortfolioTagFormValues = z.input<typeof portfolioTagFormSchema>;

export const portfolioTagFormDefaults: PortfolioTagFormValues = {
    name: "",
    slug: "",
    description: "",
    is_active: true,
    is_public: true,
};

