import { z } from "zod";
import { msg } from "@/core/messages/message";

export const portfolioFormSchema = z.object({
  name: z
    .string()
    .min(1, { message: msg.validation("portfolioNameRequired") })
    .min(3, { message: msg.validation("portfolioNameMinLength") })
    .max(200, { message: msg.validation("portfolioNameMaxLength") }),
  
  slug: z
    .string()
    .min(1, { message: msg.validation("portfolioSlugRequired") })
    .max(60, { message: msg.validation("portfolioSlugMaxLength") })
    .regex(/^[\u0600-\u06FFa-z0-9]+(?:-[\u0600-\u06FFa-z0-9]+)*$/, { 
      message: msg.validation("portfolioSlugInvalid") 
    }),
  
  short_description: z
    .string()
    .max(300, { message: msg.validation("portfolioShortDescMaxLength") })
    .optional()
    .or(z.literal("")),
  
  description: z
    .string()
    .optional()
    .or(z.literal("")),
  
  selectedCategories: z
    .array(z.any())
    .min(1, { message: msg.validation("portfolioCategoryRequired") }),
  
  selectedTags: z
    .array(z.any())
    .default([]),
  
  selectedOptions: z
    .array(z.any())
    .default([]),
  
  featuredImage: z
    .any()
    .nullable()
    .refine((val) => val !== null, {
      message: msg.validation("portfolioFeaturedImageRequired")
    }),
  
  meta_title: z
    .string()
    .max(70, { message: msg.validation("metaTitleMaxLength") })
    .optional()
    .or(z.literal("")),
  
  meta_description: z
    .string()
    .max(160, { message: msg.validation("metaDescMaxLength") })
    .optional()
    .or(z.literal("")),
  
  og_title: z
    .string()
    .max(70, { message: msg.validation("ogTitleMaxLength") })
    .optional()
    .or(z.literal("")),
  
  og_description: z
    .string()
    .max(160, { message: msg.validation("ogDescMaxLength") })
    .optional()
    .or(z.literal("")),
  
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
    .optional()
    .or(z.literal("")),
});

/**
 * TypeScript Type از Zod Schema
 */
export type PortfolioFormValues = z.infer<typeof portfolioFormSchema>;

/**
 * Default Values برای فرم
 */
export const portfolioFormDefaults: Partial<PortfolioFormValues> = {
  name: "",
  slug: "",
  short_description: "",
  description: "",
  selectedCategories: [],
  selectedTags: [],
  selectedOptions: [],
  featuredImage: null,
  meta_title: "",
  meta_description: "",
  og_title: "",
  og_description: "",
  og_image: null,
  canonical_url: "",
  robots_meta: "",
};

