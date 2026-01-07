import { z } from "zod";
import { msg } from "@/core/messages";
import { validateSlug } from "@/core/slug/validate";

export const propertyFormSchema = z.object({
    title: z
        .string()
        .min(1, { message: msg.realEstate().validation.titleRequired })
        .min(3, { message: msg.realEstate().validation.titleMinLength })
        .max(200, { message: msg.realEstate().validation.titleMaxLength }),

    slug: z
        .string()
        .min(1, { message: msg.realEstate().validation.slugRequired })
        .superRefine((val, ctx) => {
            const result = validateSlug(val, true);
            if (!result.isValid) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: result.error || msg.realEstate().validation.slugInvalid,
                });
            }
        }),

    short_description: z
        .string()
        .max(300, { message: msg.realEstate().validation.shortDescMaxLength })
        .optional(),

    description: z
        .string()
        .optional(),

    property_type: z
        .number({ message: msg.realEstate().validation.propertyTypeRequired })
        .int({ message: msg.realEstate().validation.propertyTypeRequired })
        .positive({ message: msg.realEstate().validation.propertyTypeRequired }),

    state: z
        .number({ message: msg.realEstate().validation.stateRequired })
        .int({ message: msg.realEstate().validation.stateRequired })
        .positive({ message: msg.realEstate().validation.stateRequired }),

    status: z
        .string()
        .min(1, { message: msg.realEstate().validation.statusRequired })
        .refine(
            (val) => ["active", "pending", "sold", "rented", "archived"].includes(val),
            { message: msg.realEstate().validation.statusInvalid }
        )
        .default("active"),

    agent: z
        .number()
        .int()
        .positive()
        .nullable()
        .optional(),

    agency: z
        .number()
        .int()
        .positive()
        .nullable()
        .optional(),

    province: z
        .number({ message: msg.realEstate().validation.provinceRequired })
        .int()
        .positive({ message: msg.realEstate().validation.provinceRequired })
        .nullable(),

    city: z
        .number({ message: msg.realEstate().validation.cityRequired })
        .int()
        .positive({ message: msg.realEstate().validation.cityRequired })
        .nullable(),

    district: z
        .number()
        .int()
        .positive()
        .nullable()
        .optional(),

    address: z
        .string()
        .min(5, { message: msg.realEstate().validation.addressMinLength }),

    postal_code: z
        .string()
        .refine(
            (val) => !val || val === "" || /^\d{10}$/.test(val),
            { message: msg.realEstate().validation.postalCodeInvalid }
        )
        .optional(),

    neighborhood: z
        .string()
        .max(120, { message: msg.realEstate().validation.neighborhoodMaxLength })
        .optional(),

    latitude: z
        .number()
        .min(-90, { message: msg.realEstate().validation.latitudeInvalid })
        .max(90, { message: msg.realEstate().validation.latitudeInvalid })
        .nullable()
        .optional(),

    longitude: z
        .number()
        .min(-180, { message: msg.realEstate().validation.longitudeInvalid })
        .max(180, { message: msg.realEstate().validation.longitudeInvalid })
        .nullable()
        .optional(),

    land_area: z
        .number()
        .min(0, { message: msg.realEstate().validation.landAreaMin })
        .max(100000, { message: msg.realEstate().validation.landAreaMax })
        .nullable()
        .optional(),

    built_area: z
        .number()
        .min(0, { message: msg.realEstate().validation.builtAreaMin })
        .max(100000, { message: msg.realEstate().validation.builtAreaMax })
        .nullable()
        .optional(),

    bedrooms: z
        .number()
        .int()
        .min(0, { message: msg.realEstate().validation.bedroomsMin })
        .max(20, { message: msg.realEstate().validation.bedroomsMax })
        .nullable()
        .optional(),

    bathrooms: z
        .number()
        .int()
        .min(0, { message: msg.realEstate().validation.bathroomsMin })
        .max(20, { message: msg.realEstate().validation.bathroomsMax })
        .nullable()
        .optional(),

    kitchens: z
        .number()
        .int()
        .min(0, { message: msg.realEstate().validation.kitchensMin })
        .max(10, { message: msg.realEstate().validation.kitchensMax })
        .nullable()
        .optional(),

    living_rooms: z
        .number()
        .int()
        .min(0, { message: msg.realEstate().validation.livingRoomsMin })
        .max(10, { message: msg.realEstate().validation.livingRoomsMax })
        .nullable()
        .optional(),

    year_built: z
        .number()
        .int()
        .min(1300, { message: msg.realEstate().validation.yearBuiltMin })
        .max(new Date().getFullYear() - 621, { message: msg.realEstate().validation.yearBuiltMax })
        .nullable()
        .optional(),

    build_years: z
        .number()
        .int()
        .min(0)
        .nullable()
        .optional(),

    floors_in_building: z
        .number()
        .int()
        .min(1, { message: msg.realEstate().validation.floorsInBuildingMin })
        .max(100, { message: msg.realEstate().validation.floorsInBuildingMax })
        .nullable()
        .optional(),

    floor_number: z
        .number()
        .int()
        .min(-2)
        .max(50)
        .nullable()
        .optional(),

    parking_spaces: z
        .number()
        .int()
        .min(0, { message: msg.realEstate().validation.parkingSpacesMin })
        .max(20, { message: msg.realEstate().validation.parkingSpacesMax })
        .nullable()
        .optional(),

    storage_rooms: z
        .number()
        .int()
        .min(0, { message: msg.realEstate().validation.storageRoomsMin })
        .max(10, { message: msg.realEstate().validation.storageRoomsMax })
        .nullable()
        .optional(),

    document_type: z
        .string()
        .refine(
            (val) => !val || val === "" || ["official", "contract", "cooperative", "endowment", "other"].includes(val),
            { message: msg.realEstate().validation.documentTypeInvalid }
        )
        .nullable()
        .optional(),

    price: z
        .number()
        .int()
        .min(0, { message: msg.realEstate().validation.priceMin })
        .max(999999999999, { message: msg.realEstate().validation.priceMax })
        .nullable()
        .optional(),

    sale_price: z
        .number()
        .int()
        .min(0, { message: msg.realEstate().validation.salePriceMin })
        .max(999999999999, { message: msg.realEstate().validation.salePriceMax })
        .nullable()
        .optional(),

    pre_sale_price: z
        .number()
        .int()
        .min(0, { message: msg.realEstate().validation.preSalePriceMin })
        .max(999999999999, { message: msg.realEstate().validation.preSalePriceMax })
        .nullable()
        .optional(),

    monthly_rent: z
        .number()
        .int()
        .min(0, { message: msg.realEstate().validation.monthlyRentMin })
        .max(999999999999, { message: msg.realEstate().validation.monthlyRentMax })
        .nullable()
        .optional(),

    mortgage_amount: z
        .number()
        .int()
        .min(0, { message: msg.realEstate().validation.mortgageAmountMin })
        .max(999999999999, { message: msg.realEstate().validation.mortgageAmountMax })
        .nullable()
        .optional(),

    rent_amount: z
        .number()
        .int()
        .min(0, { message: msg.realEstate().validation.rentAmountMin })
        .max(999999999999, { message: msg.realEstate().validation.rentAmountMax })
        .nullable()
        .optional(),

    security_deposit: z
        .number()
        .int()
        .min(0, { message: msg.realEstate().validation.securityDepositMin })
        .max(999999999999, { message: msg.realEstate().validation.securityDepositMax })
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

    is_published: z
        .boolean()
        .default(false),

    extra_attributes: z
        .record(z.string(), z.any())
        .default({}),

    labels_ids: z
        .array(z.number())
        .default([]),

    tags_ids: z
        .array(z.number())
        .default([]),

    features_ids: z
        .array(z.number())
        .default([]),

    main_image_id: z
        .number()
        .nullable()
        .optional(),

    og_image_id: z
        .number()
        .nullable()
        .optional(),
});

export type PropertyFormValues = z.input<typeof propertyFormSchema>;

export const propertyFormDefaults: PropertyFormValues = {
    title: "",
    slug: "",
    short_description: "",
    description: "",
    property_type: undefined!, // Required field, will be set by user
    state: undefined!, // Required field, will be set by user
    status: "active",
    agent: null,
    agency: null,
    province: null,
    city: null,
    district: null,
    address: "",
    postal_code: "",
    neighborhood: "",
    latitude: null,
    longitude: null,
    land_area: null,
    built_area: null,
    bedrooms: null,
    bathrooms: null,
    kitchens: null,
    living_rooms: null,
    year_built: null,
    build_years: null,
    floors_in_building: null,
    floor_number: null,
    parking_spaces: null,
    storage_rooms: null,
    document_type: null,
    price: null,
    sale_price: null,
    pre_sale_price: null,
    monthly_rent: null,
    mortgage_amount: null,
    rent_amount: null,
    security_deposit: null,
    meta_title: "",
    meta_description: "",
    og_title: "",
    og_description: "",
    og_image: null,
    canonical_url: "",
    robots_meta: "",
    is_public: true,
    is_active: true,
    is_featured: false,
    is_published: false,
    extra_attributes: {},
    labels_ids: [],
    tags_ids: [],
    features_ids: [],
    main_image_id: null,
    og_image_id: null,
} as PropertyFormValues;
