import { z } from "zod";
import { msg } from "@/core/messages";
import { validateSlug } from "@/core/slug/validate";

export const blogFormSchema = z.object({
  name: z
    .string()
    .min(1, { message: msg.blog("nameRequired") })
    .min(3, { message: msg.blog("nameMinLength") })
    .max(200, { message: msg.blog("nameMaxLength") }),

  slug: z
    .string()
    .superRefine((val, ctx) => {
      const result = validateSlug(val, true);
      if (!result.isValid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: result.error || msg.blog("slugInvalid"),
        });
      }
    }),

  short_description: z
    .string()
    .max(300, { message: msg.blog("shortDescMaxLength") })
    .optional(),

  description: z
    .string()
    .optional(),

  selectedCategories: z
    .array(z.any())
    .min(1, { message: msg.blog("categoryRequired") }),

  selectedTags: z
    .array(z.any())
    .default([]),

  featuredImage: z
    .any()
    .nullable()
    .optional(),

  meta_title: z
    .string()
    .max(70, { message: msg.validation("metaTitleMaxLength") })
    .optional(),

  meta_description: z
    .string()
    .max(160, { message: msg.validation("metaDescMaxLength") })
    .optional(),

  og_title: z
    .string()
    .max(70, { message: msg.validation("ogTitleMaxLength") })
    .optional(),

  og_description: z
    .string()
    .max(160, { message: msg.validation("ogDescMaxLength") })
    .optional(),

  og_image: z
    .any()
    .nullable()
    .optional(),

  canonical_url: z
    .string()
    .url({ message: msg.validation("urlInvalid") })
    .optional()
    .or(z.literal("")),

  robots_meta: z
    .string()
    .optional(),

  is_public: z
    .boolean()
    .default(true),

  is_active: z
    .boolean()
    .default(true),

  is_featured: z
    .boolean()
    .default(false),
});

export type BlogFormValues = z.input<typeof blogFormSchema>;

export const blogFormDefaults: BlogFormValues = {
  name: "",
  slug: "",
  selectedCategories: [],
  selectedTags: [],
  is_public: true,
  is_active: true,
  is_featured: false,
  short_description: "",
  description: "",
  featuredImage: null,
  meta_title: "",
  meta_description: "",
  og_title: "",
  og_description: "",
  og_image: null,
  canonical_url: "",
  robots_meta: "",
} as BlogFormValues;
