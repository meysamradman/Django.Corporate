import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { realEstateApi } from "@/api/real-estate";
import { generateSlug, formatSlug } from '@/core/slug/generate';
import { showError, showSuccess, extractFieldErrors, hasFieldErrors } from '@/core/toast';
import { msg } from '@/core/messages';
import { propertyFormSchema, propertyFormDefaults, type PropertyFormValues } from '@/components/real-estate/validations/propertySchema';
import type { PropertyLabel } from "@/types/real_estate/label/realEstateLabel";
import type { PropertyFeature } from "@/types/real_estate/feature/realEstateFeature";
import type { PropertyTag } from "@/types/real_estate/tags/realEstateTag";
import type { PropertyMedia } from "@/types/real_estate/realEstateMedia";
import {
    collectMediaFilesAndIds,
    collectMediaIds,
    collectMediaCovers,
    parsePropertyMedia
} from "@/components/real-estate/utils/propertyMediaUtils";
import type { Media } from "@/types/shared/media";

interface UsePropertyFormProps {
    id?: string;
    isEditMode: boolean;
}

export function usePropertyForm({ id, isEditMode }: UsePropertyFormProps) {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<string>("account");
    const [tempFloorPlans, setTempFloorPlans] = useState<any[]>([]);

    // Taxonomies
    const [selectedLabels, setSelectedLabels] = useState<PropertyLabel[]>([]);
    const [selectedTags, setSelectedTags] = useState<PropertyTag[]>([]);
    const [selectedFeatures, setSelectedFeatures] = useState<PropertyFeature[]>([]);

    // Media
    const [propertyMedia, setPropertyMedia] = useState<PropertyMedia>({
        featuredImage: null,
        imageGallery: [],
        videoGallery: [],
        audioGallery: [],
        pdfDocuments: []
    });

    const form = useForm<PropertyFormValues>({
        resolver: zodResolver(propertyFormSchema),
        defaultValues: propertyFormDefaults,
        mode: "onSubmit",
    });

    const { data: property, isLoading } = useQuery({
        queryKey: ['property', id],
        queryFn: () => realEstateApi.getPropertyById(Number(id!)),
        enabled: !!id && isEditMode,
    });

    // Handle Initial Data Loading
    useEffect(() => {
        if (property && isEditMode) {
            const parsedMedia = (property.property_media || property.media)
                ? parsePropertyMedia(property.property_media || property.media || [])
                : {
                    featuredImage: null,
                    imageGallery: [],
                    videoGallery: [],
                    audioGallery: [],
                    pdfDocuments: []
                };

            setPropertyMedia(parsedMedia);
            if (property.labels) setSelectedLabels(property.labels);
            if (property.tags) setSelectedTags(property.tags);
            if (property.features) setSelectedFeatures(property.features);

            form.reset({
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
                property_type: property.property_type?.id || undefined,
                state: property.state?.id || undefined,
                agent: property.agent?.id || null,
                agency: property.agency?.id || null,
                province: (property.province as any)?.id || property.province || null,
                city: (property.city as any)?.id || property.city || null,
                district: (property.district as any)?.id || property.district || null,
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

    // Auto-generate slug from title
    const titleValue = form.watch("title");
    useEffect(() => {
        if (titleValue && !isEditMode) {
            const generatedSlug = generateSlug(titleValue);
            form.setValue("slug", generatedSlug, { shouldValidate: false });
        }
    }, [titleValue, form, isEditMode]);

    // Taxonomies Handlers
    const handleLabelToggle = useCallback((label: PropertyLabel) => {
        setSelectedLabels(prev => {
            const newLabels = prev.find(l => l.id === label.id)
                ? prev.filter(l => l.id !== label.id)
                : [...prev, label];
            form.setValue("labels_ids", newLabels.map(l => l.id), { shouldValidate: false });
            return newLabels;
        });
    }, [form]);

    const handleLabelRemove = useCallback((labelId: number) => {
        setSelectedLabels(prev => {
            const newLabels = prev.filter(l => l.id !== labelId);
            form.setValue("labels_ids", newLabels.map(l => l.id), { shouldValidate: false });
            return newLabels;
        });
    }, [form]);

    const handleTagToggle = useCallback((tag: PropertyTag) => {
        setSelectedTags(prev => {
            const newTags = prev.find(t => t.id === tag.id)
                ? prev.filter(t => t.id !== tag.id)
                : [...prev, tag];
            form.setValue("tags_ids", newTags.map(t => t.id), { shouldValidate: false });
            return newTags;
        });
    }, [form]);

    const handleTagRemove = useCallback((tagId: number) => {
        setSelectedTags(prev => {
            const newTags = prev.filter(t => t.id !== tagId);
            form.setValue("tags_ids", newTags.map(t => t.id), { shouldValidate: false });
            return newTags;
        });
    }, [form]);

    const handleFeatureToggle = useCallback((feature: PropertyFeature) => {
        setSelectedFeatures(prev => {
            const newFeatures = prev.find(f => f.id === feature.id)
                ? prev.filter(f => f.id !== feature.id)
                : [...prev, feature];
            form.setValue("features_ids", newFeatures.map(f => f.id), { shouldValidate: false });
            return newFeatures;
        });
    }, [form]);

    const handleFeatureRemove = useCallback((featureId: number) => {
        setSelectedFeatures(prev => {
            const newFeatures = prev.filter(f => f.id !== featureId);
            form.setValue("features_ids", newFeatures.map(f => f.id), { shouldValidate: false });
            return newFeatures;
        });
    }, [form]);

    // Media Handlers
    const handleFeaturedImageChange = useCallback((media: Media | null) => {
        setPropertyMedia(prev => ({ ...prev, featuredImage: media }));
        form.setValue("main_image_id", media?.id || null, { shouldValidate: false });
    }, [form]);

    const handleLocationChange = useCallback((latitude: number | null, longitude: number | null) => {
        form.setValue("latitude", latitude, { shouldValidate: false });
        form.setValue("longitude", longitude, { shouldValidate: false });
    }, [form]);

    const handleInputChange = useCallback((field: string, value: any) => {
        form.setValue(field as keyof PropertyFormValues, value, { shouldValidate: false });
    }, [form]);

    // Mutations
    const mutation = useMutation({
        mutationFn: async (data: PropertyFormValues) => {
            const validatedData = propertyFormSchema.parse(data);
            if (isEditMode) {
                const allMediaIds = collectMediaIds(propertyMedia);
                const mainImageId = propertyMedia.featuredImage?.id || null;
                const mediaCovers = collectMediaCovers(propertyMedia);

                const updateData: any = {
                    ...validatedData,
                    slug: formatSlug(validatedData.slug),
                    media_ids: allMediaIds,
                    main_image_id: mainImageId,
                    media_covers: Object.keys(mediaCovers).length > 0 ? mediaCovers : undefined,
                    og_image: validatedData.og_image_id || undefined,
                    region: validatedData.district || undefined,
                    province: undefined,
                    price: validatedData.price ?? undefined,
                    mortgage_amount: validatedData.mortgage_amount ?? undefined,
                    rent_amount: validatedData.rent_amount ?? undefined,
                };
                delete updateData.og_image_id;
                delete updateData.district;

                return await realEstateApi.partialUpdateProperty(Number(id), updateData);
            } else {
                const { allMediaFiles, allMediaIds } = collectMediaFilesAndIds(propertyMedia, validatedData.og_image);
                const createData: any = {
                    ...validatedData,
                    slug: formatSlug(validatedData.slug),
                    og_image: validatedData.og_image_id || undefined,
                    region: validatedData.district || undefined,
                    price: validatedData.price ?? 0,
                    mortgage_amount: validatedData.mortgage_amount ?? 0,
                    rent_amount: validatedData.rent_amount ?? 0,
                };
                if (allMediaIds.length > 0) createData.media_ids = allMediaIds;

                if (allMediaFiles.length > 0) {
                    return await realEstateApi.createPropertyWithMedia(createData, allMediaFiles);
                } else {
                    return await realEstateApi.createProperty(createData);
                }
            }
        },
        onSuccess: (property) => {
            queryClient.invalidateQueries({ queryKey: ["properties"] });
            if (isEditMode) queryClient.invalidateQueries({ queryKey: ["property", id] });
            showSuccess(msg.crud(isEditMode ? "updated" : "created", { item: "ملک" }));
            navigate(isEditMode ? "/real-estate/properties" : `/real-estate/properties/${property.id}/view`);
        },
        onError: (error: any) => {
            if (hasFieldErrors(error)) {
                const fieldErrors = extractFieldErrors(error);
                Object.entries(fieldErrors).forEach(([field, message]) => {
                    form.setError(field as keyof PropertyFormValues, { type: "server", message: message as string });
                    // Tab switching logic
                    if (["title", "slug", "property_type", "state", "status"].includes(field)) setActiveTab("account");
                    else if (["province", "city", "address", "latitude", "longitude", "postal_code", "neighborhood"].includes(field)) setActiveTab("location");
                    else if (["land_area", "built_area", "bedrooms", "bathrooms", "price"].includes(field)) setActiveTab("details");
                });
                showError(error, { customMessage: msg.error("checkForm") });
            } else {
                showError(error);
            }
        },
    });

    const handleSubmit = form.handleSubmit(
        (data) => mutation.mutate(data),
        (errors) => {
            const firstErrorField = Object.keys(errors)[0];
            if (firstErrorField) {
                if (["title", "slug", "property_type", "state", "status"].includes(firstErrorField)) setActiveTab("account");
                else if (["province", "city", "address", "latitude", "longitude", "neighborhood"].includes(firstErrorField)) setActiveTab("location");
                else if (["land_area", "built_area", "bedrooms", "bathrooms", "price"].includes(firstErrorField)) setActiveTab("details");
                showError(null, { customMessage: msg.error("checkForm") });
            }
        }
    );

    const handleSaveDraft = form.handleSubmit(async (data) => {
        if (!isEditMode) return;
        const validatedData = propertyFormSchema.parse(data);
        const allMediaIds = collectMediaIds(propertyMedia);
        const mainImageId = propertyMedia.featuredImage?.id || null;
        const mediaCovers = collectMediaCovers(propertyMedia);

        const updateData: any = {
            ...validatedData,
            slug: formatSlug(validatedData.slug),
            media_ids: allMediaIds,
            main_image_id: mainImageId,
            media_covers: Object.keys(mediaCovers).length > 0 ? mediaCovers : undefined,
            is_published: false,
        };

        try {
            await realEstateApi.partialUpdateProperty(Number(id), updateData);
            queryClient.invalidateQueries({ queryKey: ["properties"] });
            queryClient.invalidateQueries({ queryKey: ["property", id] });
            showSuccess(msg.crud("saved", { item: "پیش‌نویس ملک" }));
            navigate("/real-estate/properties");
        } catch (error: any) {
            showError(error);
        }
    });

    return {
        form,
        activeTab,
        setActiveTab,
        tempFloorPlans,
        setTempFloorPlans,
        selectedLabels,
        selectedTags,
        selectedFeatures,
        propertyMedia,
        setPropertyMedia,
        isLoading,
        handleSubmit,
        handleSaveDraft,
        handleFeaturedImageChange,
        handleLabelToggle,
        handleLabelRemove,
        handleTagToggle,
        handleTagRemove,
        handleFeatureToggle,
        handleFeatureRemove,
        handleLocationChange,
        handleInputChange,
        isPending: mutation.isPending,
        property,
    };
}
