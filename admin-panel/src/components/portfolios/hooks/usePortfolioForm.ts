import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { portfolioApi } from "@/api/portfolios/portfolios";
import { portfolioFormSchema, portfolioFormDefaults, type PortfolioFormValues } from "@/components/portfolios/validations/portfolioSchema";
import { collectMediaFilesAndIds, collectMediaIds, collectMediaCovers, parsePortfolioMedia } from "@/components/portfolios/utils/portfolioMediaUtils";
import { showError, showSuccess, hasFieldErrors, extractFieldErrors } from "@/core/toast";
import { msg } from "@/core/messages";
import { env } from "@/core/config/environment";
import { formatSlug } from '@/core/slug/generate';
import type { PortfolioMedia } from "@/types/portfolio/portfolioMedia";

interface UsePortfolioFormProps {
    id?: string;
    isEditMode: boolean;
}

export function usePortfolioForm({ id, isEditMode }: UsePortfolioFormProps) {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<string>("account");
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

    // Fetch data for edit mode
    const { data: portfolio, isLoading } = useQuery({
        queryKey: ['portfolio', Number(id)],
        queryFn: () => portfolioApi.getPortfolioById(Number(id)),
        enabled: isEditMode && !!id,
    });

    // Reset form and media when portfolio data is loaded
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
                // We need to cast because parsePortfolioMedia expects any[] but portfolio_media is PortfolioMedia[]?
                // Actually parsePortfolioMedia implementation showed it takes `any[]`.
                // portfolio.portfolio_media is PortfolioMedia[] ? No, let's check parsePortfolioMedia again if needed.
                // But generally the field name is portfolio_media as per type definition.
                const parsedMedia = parsePortfolioMedia(portfolio.portfolio_media as any[]);
                setPortfolioMedia(parsedMedia);
            }
        }
    }, [isEditMode, portfolio, reset]);

    const mutation = useMutation({
        mutationFn: async (args: { data: PortfolioFormValues; status: "draft" | "published" }) => {
            const { data, status } = args;
            const { allMediaFiles, allMediaIds } = collectMediaFilesAndIds(
                portfolioMedia,
                data.featuredImage
            );

            const uploadMax = env.PORTFOLIO_MEDIA_UPLOAD_MAX;
            const totalMedia = allMediaFiles.length + allMediaIds.length;
            if (totalMedia > uploadMax) {
                throw new Error(`حداکثر ${uploadMax} فایل مدیا در هر بار آپلود مجاز است. شما ${totalMedia} فایل انتخاب کرده‌اید.`);
            }

            const categoryIds = data.selectedCategories ? data.selectedCategories.map((cat: any) => typeof cat === 'number' ? cat : cat.id) : [];
            const tagIds = data.selectedTags ? data.selectedTags.map((tag: any) => typeof tag === 'number' ? tag : tag.id) : [];
            const optionIds = data.selectedOptions ? data.selectedOptions.map((opt: any) => typeof opt === 'number' ? opt : opt.id) : [];

            if (isEditMode && id) {
                const portfolioId = Number(id);
                const existingMediaIds = collectMediaIds(portfolioMedia);
                const mainImageId = data.featuredImage?.id || portfolioMedia.featuredImage?.id || null;
                const mediaCovers = collectMediaCovers(portfolioMedia);

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
                    categories_ids: categoryIds,
                    tags_ids: tagIds,
                    options_ids: optionIds,
                    extra_attributes: data.extra_attributes || {},
                    media_ids: allMediaIds.length > 0 ? allMediaIds : existingMediaIds,
                    main_image_id: mainImageId,
                    media_covers: Object.keys(mediaCovers).length > 0 ? mediaCovers : undefined,
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
                    categories_ids: categoryIds,
                    tags_ids: tagIds,
                    options_ids: optionIds,
                    extra_attributes: data.extra_attributes || {},
                };

                if (allMediaIds.length > 0) {
                    portfolioData.media_ids = allMediaIds;
                }

                if (allMediaFiles.length > 0) {
                    return await portfolioApi.createPortfolioWithMedia(portfolioData, allMediaFiles);
                } else {
                    return await portfolioApi.createPortfolio(portfolioData);
                }
            }
        },
        onSuccess: (_data, variables) => {
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
        onError: (error: any) => {
            if (hasFieldErrors(error)) {
                const fieldErrors = extractFieldErrors(error);
                Object.entries(fieldErrors).forEach(([field, message]) => {
                    const fieldMap: Record<string, string> = {
                        'title': 'name',
                        'categories_ids': 'selectedCategories',
                        'tags_ids': 'selectedTags',
                        'options_ids': 'selectedOptions',
                    };

                    const formField = fieldMap[field] || field;
                    setError(formField as any, {
                        type: 'server',
                        message: message as string
                    });
                });
                showError(error, { customMessage: msg.error("checkForm") });
            } else {
                showError(error);
            }
        },
    });

    const handleSubmit = (status: "draft" | "published") =>
        form.handleSubmit(
            (data) => mutation.mutate({ data, status }),
            (errors) => {
                const errorFields = Object.keys(errors);
                if (errorFields.length > 0) {
                    // Media tab fields
                    if (errorFields.some(field => ['featuredImage', 'images', 'videos', 'audios', 'documents'].includes(field))) {
                        setActiveTab('media');
                    }
                    // SEO tab fields
                    else if (errorFields.some(field => ['meta_title', 'meta_description', 'og_title', 'og_description', 'og_image', 'canonical_url', 'robots_meta'].includes(field))) {
                        setActiveTab('seo');
                    }
                    // Extra tab fields
                    else if (errorFields.some(field => ['selectedOptions', 'extra_attributes'].includes(field))) {
                        setActiveTab('extra');
                    }
                    // Account tab fields (default)
                    else {
                        setActiveTab('account');
                    }
                    showError(null, { customMessage: msg.error("checkForm") });
                }
            }
        );

    return {
        form,
        activeTab,
        setActiveTab,
        portfolioMedia,
        setPortfolioMedia,
        handleSubmit,
        isLoading,
        isPending: mutation.isPending,
        item: portfolio,
    };
}
