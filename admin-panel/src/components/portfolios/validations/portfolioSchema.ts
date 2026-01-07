import { z } from "zod";
import { msg } from "@/core/messages";
import { validateSlug } from "@/core/slug/validate";

export const portfolioFormSchema = z.object({
  name: z
    .string()
    .min(1, { message: msg.portfolio("nameRequired") })
    .min(3, { message: msg.portfolio("nameMinLength") })
    .max(200, { message: msg.portfolio("nameMaxLength") }),
  
  slug: z
    .string()
    .superRefine((val, ctx) => {
      const result = validateSlug(val, true);
      if (!result.isValid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: result.error || msg.portfolio("slugInvalid"),
        });
      }
    }),
  
  short_description: z
    .string()
    .max(300, { message: msg.portfolio("shortDescMaxLength") })
    .optional(),
  
  description: z
    .string()
    .optional(),
  
  selectedCategories: z
    .array(z.any())
    .min(1, { message: msg.portfolio("categoryRequired") }),
  
  selectedTags: z
    .array(z.any())
    .default([]),
  
  selectedOptions: z
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
  
  status: z
    .enum(["draft", "published"])
    .default("draft"),
  
  extra_attributes: z
    .record(z.string(), z.any())
    .default({}),
});

export type PortfolioFormValues = z.input<typeof portfolioFormSchema>;

export const portfolioFormDefaults: PortfolioFormValues = {
  name: "",
  slug: "",
  selectedCategories: [],
  selectedTags: [],
  selectedOptions: [],
  is_public: true,
  is_active: true,
  is_featured: false,
  status: "draft",
  extra_attributes: {},
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
} as PortfolioFormValues;
