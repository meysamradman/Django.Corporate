import { z } from "zod";
import { msg } from "@/core/messages";

export const propertyFeatureFormSchema = z.object({
    title: z
        .string()
        .min(1, { message: msg.realEstate().validation.featureTitleRequired })
        .min(3, { message: msg.realEstate().validation.featureTitleMinLength })
        .max(200, { message: msg.realEstate().validation.featureTitleMaxLength }),

    group: z
        .string()
        .max(100, { message: msg.realEstate().validation.featureGroupMaxLength })
        .optional()
        .or(z.literal("")),

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

export type PropertyFeatureFormValues = z.infer<typeof propertyFeatureFormSchema>;

export const propertyFeatureFormDefaults: Partial<PropertyFeatureFormValues> = {
    title: "",
    group: "",
    is_active: true,
    image_id: null,
};

