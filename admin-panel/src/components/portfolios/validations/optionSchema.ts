import { z } from "zod";
import { msg } from "@/core/messages";
import { validateSlug } from "@/core/slug/validate";

export const portfolioOptionFormSchema = z.object({
    name: z
        .string()
        .min(1, { message: msg.portfolio("optionNameRequired") })
        .min(2, { message: msg.portfolio("optionNameMinLength") })
        .max(200, { message: msg.portfolio("nameMaxLength") }),

    slug: z
        .string()
        .min(1, { message: msg.portfolio("optionSlugRequired") })
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
        .max(1000, { message: "توضیحات نمی‌تواند بیشتر از ۱۰۰۰ کاراکتر باشد" })
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

export type PortfolioOptionFormValues = z.infer<typeof portfolioOptionFormSchema>;

export const portfolioOptionFormDefaults: Partial<PortfolioOptionFormValues> = {
    name: "",
    slug: "",
    description: "",
    is_active: true,
    is_public: true,
};

