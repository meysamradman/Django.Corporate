import { z } from "zod";
import { msg } from "@/core/messages";
import { validateSlug } from "@/core/slug/validate";

export const blogCategoryFormSchema = z.object({
    name: z
        .string()
        .min(1, { message: msg.blog("categoryNameRequired") })
        .min(2, { message: msg.blog("categoryNameMinLength") })
        .max(200, { message: msg.blog("nameMaxLength") }),

    slug: z
        .string()
        .min(1, { message: msg.blog("categorySlugRequired") })
        .superRefine((val, ctx) => {
            const result = validateSlug(val, true);
            if (!result.isValid) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: result.error || msg.blog("slugInvalid"),
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

export type BlogCategoryFormValues = z.infer<typeof blogCategoryFormSchema>;

export const blogCategoryFormDefaults: Partial<BlogCategoryFormValues> = {
    name: "",
    slug: "",
    parent_id: null,
    description: "",
    is_active: true,
    is_public: true,
    image_id: null,
};

