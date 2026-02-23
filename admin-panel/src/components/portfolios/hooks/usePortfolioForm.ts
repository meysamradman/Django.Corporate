import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { portfolioApi } from "@/api/portfolios/portfolios";
import { portfolioFormSchema, portfolioFormDefaults, type PortfolioFormValues } from "@/components/portfolios/validations/portfolioSchema";
import {
    collectModuleMediaIds as collectMediaIds,
    parseModuleMedia as parsePortfolioMedia,
    collectSegmentedMediaIds,
    collectSegmentedMediaCovers
} from "@/components/media/utils/genericMediaUtils";
import { notifyApiError, showError, showSuccess } from "@/core/toast";
import { msg } from "@/core/messages";
import { MEDIA_CONFIG } from "@/core/config/environment";
import { useMediaConfig } from "@/components/media/hooks/useMediaConfig";
import { formatSlug } from '@/core/slug/generate';
import type { PortfolioMedia } from "@/types/portfolio/portfolioMedia";
import { ApiError } from "@/types/api/apiError";
import { extractMappedPortfolioFieldErrors, PORTFOLIO_FORM_FIELD_MAP } from "@/components/portfolios/validations/portfolioApiError";

interface UsePortfolioFormProps {
    id?: string;
    isEditMode: boolean;
}

export function usePortfolioForm({ id, isEditMode }: UsePortfolioFormProps) {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { data: mediaConfig } = useMediaConfig();
    const [activeTab, setActiveTab] = useState<string>("account");
    const [formAlert, setFormAlert] = useState<string | null>(null);
    const [portfolioMedia, setPortfolioMedia] = useState<PortfolioMedia>({
        featuredImage: null,
        imageGallery: [],
        videoGallery: [],
        audioGallery: [],
        pdfDocuments: []
    });

    const form = useForm<PortfolioFormValues>({
        resolver: zodResolver(portfolioFormSchema),
        defaultValues: portfolioFormDefaults,
        mode: "onSubmit",
    });

    const { reset, setError } = form;

    const PORTFOLIO_TAB_BY_FIELD: Record<string, string> = {
        name: 'account',
        slug: 'account',
        short_description: 'account',
        description: 'account',
        selectedCategories: 'account',
        selectedTags: 'account',
        selectedOptions: 'account',
        is_featured: 'account',
        is_public: 'account',
        is_active: 'account',
        featuredImage: 'media',
        media_ids: 'media',
        main_image_id: 'media',
        meta_title: 'seo',
        meta_description: 'seo',
        og_title: 'seo',
        og_description: 'seo',
        og_image: 'seo',
        canonical_url: 'seo',
        robots_meta: 'seo',
        extra_attributes: 'extra',
    };

    const resolvePortfolioErrorTab = (fieldKeys: Iterable<string>): string | null => {
        for (const key of fieldKeys) {
            const tab = PORTFOLIO_TAB_BY_FIELD[key];
            if (tab) return tab;
        }
        return null;
    };

    const { data: portfolio, isLoading } = useQuery({
        queryKey: ['portfolio', Number(id)],
        queryFn: () => portfolioApi.getPortfolioById(Number(id)),
        enabled: isEditMode && !!id,
    });

    useEffect(() => {
        if (isEditMode && portfolio) {
            reset({
                name: portfolio.title,
                slug: portfolio.slug,
                short_description: portfolio.short_description,
                description: portfolio.description,
                is_featured: portfolio.is_featured,
                is_public: portfolio.is_public,
                is_active: portfolio.is_active,
                meta_title: portfolio.meta_title ?? "",
                meta_description: portfolio.meta_description ?? "",
                og_title: portfolio.og_title ?? "",
                og_description: portfolio.og_description ?? "",
                canonical_url: portfolio.canonical_url ?? "",
                robots_meta: portfolio.robots_meta ?? "",
                selectedCategories: portfolio.categories || [],
                selectedTags: portfolio.tags || [],
                selectedOptions: portfolio.options || [],
                extra_attributes: portfolio.extra_attributes || {},
                featuredImage: portfolio.main_image || null,
                og_image: portfolio.og_image || null,
            });

            if (portfolio.portfolio_media) {
                const parsedMedia = parsePortfolioMedia(portfolio.portfolio_media as any[]);
                console.log("📦 [Portfolio][Load] Parsed Media:", parsedMedia);
                setPortfolioMedia(parsedMedia);
            }
        }
    }, [isEditMode, portfolio, reset]);

    const mutation = useMutation({
        mutationFn: async (args: { data: PortfolioFormValues; status: "draft" | "published" }) => {
            const { data, status } = args;
            console.group("🚀 [Portfolio][Submit] Starting Submission");
            console.log("Raw Form Data:", data);
            console.log("Status:", status);

            const allMediaIds = collectMediaIds(portfolioMedia);
            if (data.featuredImage?.id && !allMediaIds.includes(data.featuredImage.id)) {
                allMediaIds.push(data.featuredImage.id);
            }
            const allMediaFiles: File[] = [];

            const uploadMax = mediaConfig?.PORTFOLIO_MEDIA_UPLOAD_MAX ?? MEDIA_CONFIG.PORTFOLIO_UPLOAD_MAX;
            const totalMedia = allMediaFiles.length + allMediaIds.length;
            if (totalMedia > uploadMax) {
                throw new Error(`حداکثر ${uploadMax} فایل مدیا در هر بار آپلود مجاز است. شما ${totalMedia} فایل انتخاب کرده‌اید.`);
            }

            const categoryIds = data.selectedCategories ? data.selectedCategories.map((cat: any) => typeof cat === 'number' ? cat : cat.id) : [];
            const tagIds = data.selectedTags ? data.selectedTags.map((tag: any) => typeof tag === 'number' ? tag : tag.id) : [];
            const optionIds = data.selectedOptions ? data.selectedOptions.map((opt: any) => typeof opt === 'number' ? opt : opt.id) : [];

            if (isEditMode && id) {
                const portfolioId = Number(id);
                const mainImageId = data.featuredImage?.id || portfolioMedia.featuredImage?.id || null;
                const segmentedCovers = collectSegmentedMediaCovers(portfolioMedia);
                const segmentedMediaIds = collectSegmentedMediaIds(portfolioMedia);

                console.log("📝 [Portfolio][Update] Sync Analysis:", {
                    portfolioId,
                    segmentedMediaIds,
                    segmentedCovers,
                    mainImageId
                });

                const updateData: any = {
                    title: data.name,
                    slug: formatSlug(data.slug),
                    short_description: data.short_description || "",
                    description: data.description || "",
                    status: status,
                    is_featured: data.is_featured ?? false,
                    is_public: data.is_public ?? true,
                    is_active: data.is_active ?? true,
                    meta_title: data.meta_title || undefined,
                    meta_description: data.meta_description || undefined,
                    og_title: data.og_title || undefined,
                    og_description: data.og_description || undefined,
                    og_image_id: data.og_image?.id || undefined,
                    canonical_url: data.canonical_url || undefined,
                    robots_meta: data.robots_meta || undefined,
                    categories: categoryIds,
                    tags: tagIds,
                    options: optionIds,
                    extra_attributes: data.extra_attributes || {},
                    ...segmentedMediaIds,
                    ...segmentedCovers,
                    main_image_id: mainImageId,
                };

                if (allMediaFiles.length > 0) {
                    await portfolioApi.updatePortfolio(portfolioId, updateData);
                    return await portfolioApi.addMediaToPortfolio(portfolioId, allMediaFiles, allMediaIds);
                } else {
                    return await portfolioApi.updatePortfolio(portfolioId, updateData);
                }
            } else {
                const portfolioData: any = {
                    title: data.name,
                    slug: data.slug,
                    short_description: data.short_description || "",
                    description: data.description || "",
                    status: status,
                    is_featured: data.is_featured ?? false,
                    is_public: data.is_public ?? true,
                    is_active: data.is_active ?? true,
                    meta_title: data.meta_title || undefined,
                    meta_description: data.meta_description || undefined,
                    og_title: data.og_title || undefined,
                    og_description: data.og_description || undefined,
                    og_image: data.og_image?.id || undefined,
                    canonical_url: data.canonical_url || undefined,
                    robots_meta: data.robots_meta || undefined,
                    categories: categoryIds,
                    tags: tagIds,
                    options: optionIds,
                    extra_attributes: data.extra_attributes || {},
                };

                const segmentedMediaIds = collectSegmentedMediaIds(portfolioMedia);
                Object.assign(portfolioData, segmentedMediaIds);

                console.log("📝 [Portfolio][Create] Final Payload Media:", {
                    segmentedMediaIds,
                    featuredImageId: data.featuredImage?.id
                });

                if (allMediaFiles.length > 0) {
                    return await portfolioApi.createPortfolioWithMedia(portfolioData, allMediaFiles);
                } else {
                    return await portfolioApi.createPortfolio(portfolioData);
                }
            }
        },
        onSuccess: (_data, variables) => {
            setFormAlert(null);
            console.log("✅ [Portfolio][Submit] Success:", _data);
            queryClient.invalidateQueries({ queryKey: ['portfolios'] });
            if (isEditMode) {
                queryClient.invalidateQueries({ queryKey: ['portfolio', Number(id)] });
            }

            const successMessage = variables.status === "draft"
                ? msg.crud(isEditMode ? 'updated' : 'saved', { item: 'پیش‌نویس نمونه‌کار' })
                : msg.crud(isEditMode ? 'updated' : 'created', { item: 'نمونه‌کار' });

            showSuccess(successMessage);
            navigate("/portfolios");
        },
        onError: (error: unknown) => {
            setFormAlert(null);

            const { fieldErrors, nonFieldError } = extractMappedPortfolioFieldErrors(
                error,
                PORTFOLIO_FORM_FIELD_MAP as unknown as Record<string, string>
            );

            const mappedFieldKeys = Object.keys(fieldErrors);
            if (mappedFieldKeys.length > 0) {
                mappedFieldKeys.forEach((field) => {
                    setError(field as any, {
                        type: 'server',
                        message: fieldErrors[field],
                    });
                });

                const tabWithError = resolvePortfolioErrorTab(mappedFieldKeys);
                if (tabWithError) {
                    setActiveTab(tabWithError);
                }

                if (nonFieldError) {
                    setFormAlert(nonFieldError);
                }

                showError(error, { customMessage: msg.error("checkForm") });
                return;
            }

            if (nonFieldError) {
                setFormAlert(nonFieldError);
                return;
            }

            if (error instanceof ApiError) {
                const statusCode = error.response.AppStatusCode;
                if (statusCode < 500) {
                    setFormAlert(error.response.message || msg.error('validation'));
                    return;
                }
            }

            notifyApiError(error, {
                fallbackMessage: msg.error('serverError'),
                dedupeKey: 'portfolio-form-system-error',
                preferBackendMessage: false,
            });
        },
    });

    const handleSubmit = (status: "draft" | "published") =>
        form.handleSubmit(
            (data) => {
                setFormAlert(null);
                mutation.mutate({ data, status });
            },
            (errors) => {
                const errorFields = Object.keys(errors);
                if (errorFields.length > 0) {
                    const tabWithError = resolvePortfolioErrorTab(errorFields);
                    if (tabWithError) {
                        setActiveTab(tabWithError);
                    }
                    showError(null, { customMessage: msg.error("checkForm") });
                }
            }
        );

    return {
        form,
        activeTab,
        setActiveTab,
        formAlert,
        clearFormAlert: () => setFormAlert(null),
        portfolioMedia,
        setPortfolioMedia,
        handleSubmit,
        isLoading,
        isPending: mutation.isPending,
        item: portfolio,
    };
}
