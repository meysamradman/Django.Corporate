import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { realEstateApi } from "@/api/real-estate";
import { generateSlug, formatSlug } from '@/core/slug/generate';
import { showError, showSuccess, extractFieldErrors, hasFieldErrors } from '@/core/toast';
import { msg } from '@/core/messages';
import { MEDIA_CONFIG } from '@/core/config/environment';
import { useMediaConfig } from "@/components/media/hooks/useMediaConfig";
import { propertyFormSchema, propertyFormDefaults, type PropertyFormValues } from '@/components/real-estate/validations/propertySchema';
import {
    collectModuleMediaIds as collectMediaIds,
    collectModuleMediaCovers as collectMediaCovers,
    collectSegmentedMediaIds,
    parseModuleMedia
} from "@/components/media/utils/genericMediaUtils";

// Import sub-hooks
import { useRealEstateMedia } from "./useRealEstateMedia";
import { useRealEstateTaxonomy } from "./useRealEstateTaxonomy";

interface UsePropertyFormProps {
    id?: string;
    isEditMode: boolean;
}

export function useRealEstateForm({ id, isEditMode }: UsePropertyFormProps) {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { data: mediaConfig } = useMediaConfig();
    const [activeTab, setActiveTab] = useState<string>("account");
    const [tempFloorPlans, setTempFloorPlans] = useState<any[]>([]);

    const form = useForm<PropertyFormValues>({
        resolver: zodResolver(propertyFormSchema),
        defaultValues: propertyFormDefaults,
        mode: "onSubmit",
    });

    // Initialize sub-hooks
    const mediaManager = useRealEstateMedia({ form });
    const taxonomyManager = useRealEstateTaxonomy({ form });

    const { data: property, isLoading } = useQuery({
        queryKey: ['property', id],
        queryFn: () => realEstateApi.getPropertyById(Number(id!)),
        enabled: !!id && isEditMode,
    });

    useEffect(() => {
        if (property && isEditMode) {
            const parsedMedia = (property.property_media || property.media)
                ? parseModuleMedia(property.property_media || property.media || [])
                : {
                    featuredImage: null,
                    imageGallery: [],
                    videoGallery: [],
                    audioGallery: [],
                    pdfDocuments: []
                };

            mediaManager.setPropertyMedia(parsedMedia);
            if (property.labels) taxonomyManager.setSelectedLabels(property.labels);
            if (property.tags) taxonomyManager.setSelectedTags(property.tags);
            if (property.features) taxonomyManager.setSelectedFeatures(property.features);

            form.reset({
                ...propertyFormDefaults,
                title: property.title || "",
                slug: property.slug || "",
                short_description: property.short_description || "",
                description: property.description || "",
                meta_title: property.meta_title || "",
                meta_description: property.meta_description || "",
                og_title: property.og_title || "",
                og_description: property.og_description || "",
                og_image: property.og_image || null,
                og_image_id: property.og_image?.id || null,
                canonical_url: property.canonical_url || "",
                robots_meta: property.robots_meta || "",
                is_public: property.is_public ?? true,
                is_active: property.is_active ?? true,
                is_published: property.is_published ?? false,
                is_featured: property.is_featured ?? false,
                property_type: property.property_type?.id ?? undefined,
                state: property.state?.id ?? undefined,
                agent: property.agent?.id || null,
                agency: property.agency?.id || null,
                province: (property.province as any)?.id ?? property.province ?? undefined,
                city: (property.city as any)?.id ?? property.city ?? undefined,
                region: (property.region as any)?.id || property.region || null,
                address: property.address || "",
                postal_code: (property as any).postal_code || "",
                neighborhood: property.neighborhood || "",
                latitude: property.latitude ? Number(property.latitude) : null,
                longitude: property.longitude ? Number(property.longitude) : null,
                land_area: property.land_area ? Number(property.land_area) : null,
                built_area: property.built_area ? Number(property.built_area) : null,
                bedrooms: property.bedrooms || null,
                bathrooms: property.bathrooms || null,
                kitchens: (property as any).kitchens || null,
                living_rooms: (property as any).living_rooms || null,
                year_built: property.year_built ? Number(property.year_built) : null,
                build_years: (property as any).build_years || null,
                floors_in_building: property.floors_in_building ? Number(property.floors_in_building) : null,
                floor_number: (property as any).floor_number || null,
                parking_spaces: property.parking_spaces ? Number(property.parking_spaces) : null,
                storage_rooms: property.storage_rooms ? Number(property.storage_rooms) : null,
                document_type: (property as any).document_type || null,
                price: property.price ? Number(property.price) : null,
                sale_price: (property as any).sale_price ? Number((property as any).sale_price) : null,
                pre_sale_price: (property as any).pre_sale_price ? Number((property as any).pre_sale_price) : null,
                monthly_rent: (property as any).monthly_rent ? Number((property as any).monthly_rent) : null,
                mortgage_amount: property.mortgage_amount ? Number(property.mortgage_amount) : null,
                rent_amount: property.rent_amount ? Number(property.rent_amount) : null,
                security_deposit: (property as any).security_deposit ? Number((property as any).security_deposit) : null,
                status: typeof property.status === 'object' ? (property.status as any)?.value : (property.status || "active"),
                extra_attributes: property.extra_attributes || {},
                labels_ids: property.labels?.map((l: any) => l.id) || [],
                tags_ids: property.tags?.map((t: any) => t.id) || [],
                features_ids: property.features?.map((f: any) => f.id) || [],
                main_image_id: property.main_image?.id || null,
            });
        }
    }, [property, isEditMode, form]);

    const titleValue = form.watch("title");
    useEffect(() => {
        if (titleValue && !isEditMode) {
            form.setValue("slug", generateSlug(titleValue), { shouldValidate: false });
        }
    }, [titleValue, form, isEditMode]);

    const handleInputChange = useCallback((field: string, value: any) => {
        form.setValue(field as keyof PropertyFormValues, value, { shouldValidate: false, shouldDirty: true });
    }, [form]);

    const handleLocationChange = useCallback((latitude: number | null, longitude: number | null) => {
        form.setValue("latitude", latitude, { shouldValidate: false, shouldDirty: true });
        form.setValue("longitude", longitude, { shouldValidate: false, shouldDirty: true });
    }, [form]);

    const mutation = useMutation({
        mutationFn: async (args: { data: PropertyFormValues; status: "draft" | "published" }) => {
            const { data, status } = args;
            const validatedData = propertyFormSchema.parse(data);

            const allMediaIds = collectMediaIds(mediaManager.propertyMedia);
            if (validatedData.og_image_id && !allMediaIds.includes(validatedData.og_image_id)) {
                allMediaIds.push(validatedData.og_image_id);
            }

            const uploadMax = mediaConfig?.REAL_ESTATE_MEDIA_UPLOAD_MAX ?? MEDIA_CONFIG.REAL_ESTATE_UPLOAD_MAX;
            if (allMediaIds.length > uploadMax) {
                throw new Error(msg.realEstate().validation.mediaLimitExceeded.replace("{max}", uploadMax.toString()));
            }


            const isPublished = status === "published";
            const segmented = collectSegmentedMediaIds(mediaManager.propertyMedia);
            const mediaCovers = collectMediaCovers(mediaManager.propertyMedia);

            const payload: any = {
                ...validatedData,
                slug: formatSlug(validatedData.slug),
                media_ids: allMediaIds,
                image_ids: segmented.image_ids,
                video_ids: segmented.video_ids,
                audio_ids: segmented.audio_ids,
                document_ids: segmented.document_ids,
                main_image_id: mediaManager.propertyMedia.featuredImage?.id || data.main_image_id || null,
                media_covers: Object.keys(mediaCovers).length > 0 ? mediaCovers : undefined,
                og_image: validatedData.og_image_id || undefined,
                is_published: isPublished,
                labels: validatedData.labels_ids,
                tags: validatedData.tags_ids,
                features: validatedData.features_ids,
            };

            // Cleanup payload
            delete payload.og_image_id;
            delete payload.province;
            delete payload.city;
            delete payload.labels_ids;
            delete payload.tags_ids;
            delete payload.features_ids;

            if (isEditMode && id) {
                return await realEstateApi.updateProperty(Number(id), payload);
            } else {
                const createdProperty = await realEstateApi.createProperty(payload);
                if (tempFloorPlans.length > 0) {
                    for (const plan of tempFloorPlans) {
                        await realEstateApi.createFloorPlan({
                            ...plan,
                            property_obj: createdProperty.id,
                            image_ids: plan.images?.map((img: any) => img.id) || []
                        });
                    }
                }
                return createdProperty;
            }
        },
        onSuccess: (property, variables) => {
            queryClient.invalidateQueries({ queryKey: ["properties"] });
            if (isEditMode) queryClient.invalidateQueries({ queryKey: ["property", id] });

            const isDraft = variables.status === "draft";
            const itemType = isDraft ? "پیش‌نویس ملک" : "ملک";
            const action = isEditMode ? "updated" : (isDraft ? "saved" : "created");

            showSuccess(msg.crud(action, { item: itemType }));

            if (isDraft) {
                navigate("/real-estate/properties");
            } else {
                navigate(isEditMode ? "/real-estate/properties" : `/real-estate/properties/${property.id}/view`);
            }
        },
        onError: (error: any) => {
            if (hasFieldErrors(error)) {
                const fieldErrors = extractFieldErrors(error);
                Object.entries(fieldErrors).forEach(([field, message]) => {
                    form.setError(field as keyof PropertyFormValues, { type: "server", message: message as string });

                    // Switch to relevant tab on error - Comprehensive mapping
                    if (["title", "slug", "property_type", "state", "status", "agent", "agency", "short_description", "description"].includes(field))
                        setActiveTab("account");
                    else if (["province", "city", "region", "address", "postal_code", "neighborhood", "latitude", "longitude"].includes(field))
                        setActiveTab("location");
                    else if (["land_area", "built_area", "bedrooms", "bathrooms", "kitchens", "living_rooms", "year_built", "build_years", "floors_in_building", "floor_number", "parking_spaces", "storage_rooms", "document_type", "price", "sale_price", "pre_sale_price", "mortgage_amount", "rent_amount", "monthly_rent", "security_deposit"].includes(field))
                        setActiveTab("details");
                    else if (["extra_attributes", "labels_ids", "tags_ids", "features_ids"].includes(field))
                        setActiveTab("extra");
                    else if (["media_ids", "image_ids", "video_ids", "audio_ids", "document_ids", "main_image_id"].includes(field))
                        setActiveTab("media");
                    else if (["meta_title", "meta_description", "og_title", "og_description", "og_image_id", "canonical_url", "robots_meta", "is_public", "is_active", "is_published", "is_featured"].includes(field))
                        setActiveTab("seo");
                });
                showError(null, { customMessage: msg.error("checkForm") });
            } else {
                showError(error);
            }
        },
    });

    const handleSubmit = (status: "draft" | "published") =>
        form.handleSubmit(
            (data) => mutation.mutate({ data, status }),
            (errors) => {
                const firstField = Object.keys(errors)[0];
                if (firstField) {
                    if (["title", "slug", "property_type", "state", "status", "agent", "agency", "short_description", "description"].includes(firstField))
                        setActiveTab("account");
                    else if (["province", "city", "region", "address", "postal_code", "neighborhood", "latitude", "longitude"].includes(firstField))
                        setActiveTab("location");
                    else if (["land_area", "built_area", "bedrooms", "bathrooms", "kitchens", "living_rooms", "year_built", "build_years", "floors_in_building", "floor_number", "parking_spaces", "storage_rooms", "document_type", "price", "sale_price", "pre_sale_price", "mortgage_amount", "rent_amount", "monthly_rent", "security_deposit"].includes(firstField))
                        setActiveTab("details");
                    else if (["extra_attributes", "labels_ids", "tags_ids", "features_ids"].includes(firstField))
                        setActiveTab("extra");
                    else if (["media_ids", "image_ids", "video_ids", "audio_ids", "document_ids", "main_image_id"].includes(firstField))
                        setActiveTab("media");
                    else if (["meta_title", "meta_description", "og_title", "og_description", "og_image_id", "canonical_url", "robots_meta", "is_public", "is_active", "is_published", "is_featured"].includes(firstField))
                        setActiveTab("seo");

                    showError(null, { customMessage: msg.error("checkForm") });
                }
            }
        );


    return {
        form,
        activeTab,
        setActiveTab,
        tempFloorPlans,
        setTempFloorPlans,
        ...taxonomyManager,
        ...mediaManager,
        isLoading,
        handleSubmit: handleSubmit("published"),
        handleSaveDraft: handleSubmit("draft"),
        handleLocationChange,
        handleInputChange,
        isPending: mutation.isPending,
        property,
    };
}

