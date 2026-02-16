import { z } from "zod";

export const contactPhoneSchema = z.object({
    phone_number: z.string().min(1, "شماره تماس الزامی است"),
    label: z.string().optional().nullable().transform(v => v === null ? undefined : v),
    order: z.preprocess((val) => Number(val), z.number().int().nonnegative().default(0)),
});

export type ContactPhoneFormValues = z.infer<typeof contactPhoneSchema>;

export const contactMobileSchema = z.object({
    mobile_number: z.string().min(1, "شماره موبایل الزامی است"),
    label: z.string().optional().nullable().transform(v => v === null ? undefined : v),
    order: z.preprocess((val) => Number(val), z.number().int().nonnegative().default(0)),
});

export type ContactMobileFormValues = z.infer<typeof contactMobileSchema>;

export const contactEmailSchema = z.object({
    email: z.string().email("ایمیل معتبر وارد کنید").min(1, "ایمیل الزامی است"),
    label: z.string().optional().nullable().transform(v => v === null ? undefined : v),
    order: z.preprocess((val) => Number(val), z.number().int().nonnegative().default(0)),
});

export type ContactEmailFormValues = z.infer<typeof contactEmailSchema>;

export const socialMediaSchema = z.object({
    name: z.string().min(1, "نام شبکه اجتماعی الزامی است"),
    url: z.string().url("لینک معتبر وارد کنید").min(1, "لینک الزامی است"),
    order: z.preprocess((val) => Number(val), z.number().int().nonnegative().default(0)),
    icon_id: z.number().nullable().optional(),
});

export type SocialMediaFormValues = z.infer<typeof socialMediaSchema>;

export const sliderSchema = z.object({
    title: z.string().min(1, "عنوان اسلایدر الزامی است"),
    description: z.string().optional().nullable().transform(v => v === null ? undefined : v),
    link: z.string().url("لینک معتبر وارد کنید").or(z.literal("")).optional().nullable().transform(v => v === null ? undefined : v),
    order: z.preprocess((val) => Number(val), z.number().int().nonnegative().default(0)),
    image_id: z.number().nullable(),
    video_id: z.number().nullable().optional(),
    is_active: z.boolean().default(true),
});

export type SliderFormValues = z.infer<typeof sliderSchema>;

export const generalSettingsSchema = z.object({
    site_name: z.string().min(1, "عنوان سایت الزامی است"),
    copyright_text: z.string().optional().nullable().transform(v => v === null ? undefined : v),
    copyright_link: z.string().url("لینک معتبر وارد کنید").or(z.literal("")).optional().nullable().transform(v => v === null ? undefined : v),
    logo_image: z.number().nullable().optional(),
    favicon_image: z.number().nullable().optional(),
    enamad_image: z.number().nullable().optional(),
});

export type GeneralSettingsFormValues = z.infer<typeof generalSettingsSchema>;

export const faqSchema = z.object({
    question: z.string().min(1, "سوال الزامی است").max(500, "سوال نمی‌تواند بیشتر از 500 کاراکتر باشد"),
    answer: z.string().min(1, "پاسخ الزامی است"),
    keywords: z.string().optional().nullable().transform(v => v === null ? undefined : v),
    patterns: z.string().optional().nullable().transform(v => v === null ? undefined : v),
    order: z.preprocess((val) => Number(val), z.number().int().nonnegative().default(0)),
    is_active: z.boolean().default(true),
});

export type FAQFormValues = z.infer<typeof faqSchema>;

export const formFieldSchema = z.object({
    field_key: z.string().min(1, "کلید فیلد الزامی است").regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, "کلید فیلد نامعتبر است"),
    field_type: z.enum(['text', 'email', 'phone', 'textarea', 'select', 'checkbox', 'radio', 'number', 'date', 'url']),
    label: z.string().min(1, "برچسب الزامی است"),
    placeholder: z.string().optional().nullable().transform(v => v === null ? undefined : v),
    required: z.boolean().default(true),
    platforms: z.array(z.string()).min(1, "حداقل یک پلتفرم الزامی است"),
    options: z.array(z.object({
        value: z.string().min(1),
        label: z.string().min(1)
    })).optional().nullable(),
    order: z.preprocess((val) => Number(val), z.number().int().nonnegative().default(0)),
    is_active: z.boolean().default(true),
});

export type FormFieldFormValues = z.infer<typeof formFieldSchema>;

export const mapSettingsSchema = z.object({
    provider: z.enum(['leaflet', 'google_maps', 'neshan']),
    configs: z.object({
        google_maps: z.object({
            api_key: z.string().optional().nullable().transform(v => v === "" ? null : v),
            map_id: z.string().optional().nullable().transform(v => v === "" ? null : v),
        }).optional(),
        neshan: z.object({
            map_key: z.string().optional().nullable().transform(v => v === "" ? null : v),
        }).optional(),
    }),
});

export type MapSettingsFormValues = z.infer<typeof mapSettingsSchema>;

export const footerSectionSchema = z.object({
    title: z.string().min(1, "عنوان ستون فوتر الزامی است"),
    order: z.preprocess((val) => Number(val), z.number().int().nonnegative().default(0)),
    is_active: z.boolean().default(true),
});

export type FooterSectionFormValues = z.infer<typeof footerSectionSchema>;

export const footerLinkSchema = z.object({
    section: z.preprocess((val) => Number(val), z.number().int().positive("ستون فوتر الزامی است")),
    title: z.string().min(1, "عنوان لینک الزامی است"),
    href: z.string().min(1, "آدرس لینک الزامی است"),
    order: z.preprocess((val) => Number(val), z.number().int().nonnegative().default(0)),
    is_active: z.boolean().default(true),
});

export type FooterLinkFormValues = z.infer<typeof footerLinkSchema>;

export const footerAboutSchema = z.object({
    title: z.string().min(1, "عنوان درباره فوتر الزامی است"),
    text: z.string().min(1, "متن درباره فوتر الزامی است"),
    is_active: z.boolean().default(true),
});

export type FooterAboutFormValues = z.infer<typeof footerAboutSchema>;
