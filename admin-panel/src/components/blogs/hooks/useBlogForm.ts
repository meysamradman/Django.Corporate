import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { blogApi } from "@/api/blogs/blogs";
import { blogFormSchema, blogFormDefaults, type BlogFormValues } from "@/components/blogs/validations/blogSchema";
import { collectModuleMediaIds as collectMediaIds, collectModuleMediaCovers as collectMediaCovers, parseModuleMedia as parseBlogMedia } from "@/components/media/utils/genericMediaUtils";
import { notifyApiError, showSuccess } from "@/core/toast";
import { msg } from "@/core/messages";
import { MEDIA_CONFIG } from "@/core/config/environment";
import { useMediaConfig } from "@/components/media/hooks/useMediaConfig";
import { formatSlug } from '@/core/slug/generate';
import type { BlogMedia } from "@/types/blog/blogMedia";
import { ApiError } from "@/types/api/apiError";
import { BLOG_FORM_FIELD_MAP, extractMappedBlogFieldErrors } from "@/components/blogs/validations/blogApiError";

interface UseBlogFormProps {
    id?: string;
    isEditMode: boolean;
}

export function useBlogForm({ id, isEditMode }: UseBlogFormProps) {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { data: mediaConfig } = useMediaConfig();
    const [activeTab, setActiveTab] = useState<string>("account");
    const [formAlert, setFormAlert] = useState<string | null>(null);
    const [blogMedia, setBlogMedia] = useState<BlogMedia>({
        featuredImage: null,
        imageGallery: [],
        videoGallery: [],
        audioGallery: [],
        pdfDocuments: []
    });

    const form = useForm<BlogFormValues>({
        resolver: zodResolver(blogFormSchema),
        defaultValues: blogFormDefaults,
        mode: "onSubmit",
    });

    const { reset, setError } = form;

    const BLOG_TAB_BY_FIELD: Record<string, string> = {
        name: 'account',
        slug: 'account',
        short_description: 'account',
        description: 'account',
        selectedCategories: 'account',
        selectedTags: 'account',
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
    };

    const resolveBlogErrorTab = (fieldKeys: Iterable<string>): string | null => {
        for (const key of fieldKeys) {
            const tab = BLOG_TAB_BY_FIELD[key];
            if (tab) return tab;
        }
        return null;
    };

    const { data: blog, isLoading } = useQuery({
        queryKey: ['blog', Number(id)],
        queryFn: () => blogApi.getBlogById(Number(id)),
        enabled: isEditMode && !!id,
    });

    useEffect(() => {
        if (isEditMode && blog) {
            reset({
                name: blog.title,
                slug: blog.slug,
                short_description: blog.short_description,
                description: blog.description,
                is_featured: blog.is_featured,
                is_public: blog.is_public,
                is_active: blog.is_active,
                meta_title: blog.meta_title ?? "",
                meta_description: blog.meta_description ?? "",
                og_title: blog.og_title ?? "",
                og_description: blog.og_description ?? "",
                canonical_url: blog.canonical_url ?? "",
                robots_meta: blog.robots_meta ?? "",
                selectedCategories: blog.categories || [],
                selectedTags: blog.tags || [],
                featuredImage: blog.main_image || null,
                og_image: blog.og_image || null,
            });

            if (blog.blog_media) {
                const parsedMedia = parseBlogMedia(blog.blog_media as any[]);
                console.log("📦 [Blog][Load] Parsed Media:", parsedMedia);
                setBlogMedia(parsedMedia);
            }
        }
    }, [isEditMode, blog, reset]);

    const mutation = useMutation({
        mutationFn: async (args: { data: BlogFormValues; status: "draft" | "published" }) => {
            const { data, status } = args;
            console.group("🚀 [Blog][Submit] Starting Submission");
            console.log("Raw Form Data:", data);
            console.log("Status:", status);

            const allMediaIds = collectMediaIds(blogMedia);
            if (data.featuredImage?.id && !allMediaIds.includes(data.featuredImage.id)) {
                allMediaIds.push(data.featuredImage.id);
            }
            const allMediaFiles: File[] = [];

            const uploadMax = mediaConfig?.BLOG_MEDIA_UPLOAD_MAX ?? MEDIA_CONFIG.BLOG_UPLOAD_MAX;
            const totalMedia = allMediaFiles.length + allMediaIds.length;
            if (totalMedia > uploadMax) {
                throw new Error(`حداکثر ${uploadMax} فایل مدیا در هر بار آپلود مجاز است. شما ${totalMedia} فایل انتخاب کرده‌اید.`);
            }

            const categoryIds = data.selectedCategories ? data.selectedCategories.map((cat: any) => typeof cat === 'number' ? cat : cat.id) : [];
            const tagIds = data.selectedTags ? data.selectedTags.map((tag: any) => typeof tag === 'number' ? tag : tag.id) : [];

            if (isEditMode && id) {
                const blogId = Number(id);
                const existingMediaIds = collectMediaIds(blogMedia);
                const mainImageId = data.featuredImage?.id || blogMedia.featuredImage?.id || null;
                const mediaCovers = collectMediaCovers(blogMedia);

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
                    media_ids: allMediaIds.length > 0 ? allMediaIds : existingMediaIds,
                    main_image_id: mainImageId,
                    media_covers: Object.keys(mediaCovers).length > 0 ? mediaCovers : undefined,
                };

                if (allMediaFiles.length > 0) {
                    await blogApi.updateBlog(blogId, updateData);
                    return await blogApi.addMediaToBlog(blogId, allMediaFiles, allMediaIds);
                } else {
                    return await blogApi.updateBlog(blogId, updateData);
                }
            } else {
                const blogData: any = {
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
                };

                if (allMediaIds.length > 0) {
                    blogData.media_ids = allMediaIds;
                }

                if (allMediaFiles.length > 0) {
                    return await blogApi.createBlogWithMedia(blogData, allMediaFiles);
                } else {
                    return await blogApi.createBlog(blogData);
                }
            }
        },
        onSuccess: (_data, variables) => {
            setFormAlert(null);
            console.log("✅ [Blog][Submit] Success:", _data);
            console.groupEnd();
            queryClient.invalidateQueries({ queryKey: ['blogs'] });
            if (isEditMode) {
                queryClient.invalidateQueries({ queryKey: ['blog', Number(id)] });
            }

            const successMessage = variables.status === "draft"
                ? msg.crud(isEditMode ? 'updated' : 'saved', { item: 'پیش‌نویس بلاگ' })
                : msg.crud(isEditMode ? 'updated' : 'created', { item: 'بلاگ' });

            showSuccess(successMessage);
            navigate("/blogs");
        },
        onError: (error: unknown) => {
            setFormAlert(null);

            const { fieldErrors, nonFieldError } = extractMappedBlogFieldErrors(
                error,
                BLOG_FORM_FIELD_MAP as unknown as Record<string, string>
            );

            const mappedFieldKeys = Object.keys(fieldErrors);
            if (mappedFieldKeys.length > 0) {
                mappedFieldKeys.forEach((field) => {
                    setError(field as any, {
                        type: 'server',
                        message: fieldErrors[field],
                    });
                });

                const tabWithError = resolveBlogErrorTab(mappedFieldKeys);
                if (tabWithError) {
                    setActiveTab(tabWithError);
                }

                if (nonFieldError) {
                    setFormAlert(nonFieldError);
                }
                console.groupEnd();
                return;
            }

            if (nonFieldError) {
                setFormAlert(nonFieldError);
                console.groupEnd();
                return;
            }

            if (error instanceof ApiError) {
                const statusCode = error.response.AppStatusCode;
                if (statusCode < 500) {
                    setFormAlert(error.response.message || msg.error('validation'));
                    console.groupEnd();
                    return;
                }
            }

            notifyApiError(error, {
                fallbackMessage: msg.error('serverError'),
                dedupeKey: 'blogs-form-system-error',
                preferBackendMessage: false,
            });
            console.groupEnd();
        },
    });

    const handleSubmit = (status: "draft" | "published") =>
        form.handleSubmit(
            (data) => {
                setFormAlert(null);
                mutation.mutate({ data, status });
            },
            (errors) => {
                setFormAlert(null);
                const errorFields = Object.keys(errors);
                if (errorFields.length > 0) {
                    const tabWithError = resolveBlogErrorTab(errorFields);
                    if (tabWithError) {
                        setActiveTab(tabWithError);
                    }
                    setFormAlert(msg.error("checkForm"));
                }
            }
        );

    return {
        form,
        activeTab,
        setActiveTab,
        formAlert,
        clearFormAlert: () => setFormAlert(null),
        blogMedia,
        setBlogMedia,
        handleSubmit,
        isLoading,
        isPending: mutation.isPending,
        item: blog,
    };
}
