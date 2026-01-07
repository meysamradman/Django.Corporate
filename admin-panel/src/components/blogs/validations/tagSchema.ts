import { z } from "zod";
import { msg } from "@/core/messages";
import { validateSlug } from "@/core/slug/validate";

export const blogTagFormSchema = z.object({
    name: z
        .string()
        .min(1, { message: msg.blog("tagNameRequired") })
        .min(2, { message: msg.blog("tagNameMinLength") })
        .max(200, { message: msg.blog("nameMaxLength") }),

    slug: z
        .string()
        .min(1, { message: msg.blog("tagSlugRequired") })
        .superRefine((val, ctx) => {
            const result = validateSlug(val, true);
            if (!result.isValid) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: result.error || msg.blog("slugInvalid"),
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

export type BlogTagFormValues = z.input<typeof blogTagFormSchema>;

export const blogTagFormDefaults: BlogTagFormValues = {
    name: "",
    slug: "",
    description: "",
    is_active: true,
    is_public: true,
} as BlogTagFormValues;

