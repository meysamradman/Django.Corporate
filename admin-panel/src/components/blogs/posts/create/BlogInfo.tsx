
import { useEffect, useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { FileText, Settings } from "lucide-react";
import { blogApi } from "@/api/blogs/blogs";
import type { BlogCategory } from "@/types/blog/category/blogCategory";
import type { BlogTag } from "@/types/blog/tags/blogTag";
import type { BlogFormValues } from "@/components/blogs/validations/blogSchema";

import { BlogTitle } from "./title/BlogTitle";
import { BlogShortDesc } from "./descriptions/BlogShortDesc";
import { BlogDescription } from "./descriptions/BlogDescription";
import { BlogCategories } from "./categories/BlogCategories";
import { BlogTags } from "./tags/BlogTags";
import { BlogStatus } from "./status/BlogStatus";

interface BaseInfoTabFormProps {
    form: UseFormReturn<BlogFormValues>;
    editMode: boolean;
    blogId?: number | string;
}

interface BaseInfoTabManualProps {
    formData: any;
    handleInputChange: (field: string, value: any) => void;
    editMode: boolean;
    selectedCategories: BlogCategory[];
    selectedTags: BlogTag[];
    onCategoryToggle: (category: BlogCategory) => void;
    onCategoryRemove: (categoryId: number) => void;
    onTagToggle: (tag: BlogTag) => void;
    onTagRemove: (tagId: number) => void;
    blogId?: number | string;
    errors?: Record<string, string>;
}

type BaseInfoTabProps = BaseInfoTabFormProps | BaseInfoTabManualProps;

export default function BlogInfo(props: BaseInfoTabProps) {
    const isFormApproach = 'form' in props;
    const form = isFormApproach ? (props as BaseInfoTabFormProps).form : undefined;
    const formData = isFormApproach ? null : (props as any).formData;
    const handleInputChange = isFormApproach ? null : (props as any).handleInputChange;
    const editMode = props.editMode;
    const blogId = props.blogId;

    const [categories, setCategories] = useState<BlogCategory[]>([]);
    const [tags, setTags] = useState<BlogTag[]>([]);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [loadingTags, setLoadingTags] = useState(true);

    const { watch, setValue } = isFormApproach && form
        ? form
        : { watch: null, setValue: null };

    const commonProps = {
        form,
        formData,
        handleInputChange,
        editMode,
        isFormApproach,
        errors: isFormApproach ? undefined : (props as BaseInfoTabManualProps).errors
    };

    const formSelectedCategories = isFormApproach ? (watch?.("selectedCategories" as any) || []) : (props as any).selectedCategories || [];
    const formSelectedTags = isFormApproach ? watch?.("selectedTags") || [] : (props as any).selectedTags || [];

    useEffect(() => {
        const fetchTaxonomy = async () => {
            try {
                const [catsRes, tagsRes] = await Promise.all([
                    blogApi.getCategories({ page: 1, size: 100 }),
                    blogApi.getTags({ page: 1, size: 100 })
                ]);
                setCategories(catsRes.data || []);
                setTags(tagsRes.data || []);
            } finally {
                setLoadingCategories(false);
                setLoadingTags(false);
            }
        };
        fetchTaxonomy();
    }, []);

    const handleCategoryToggle = (category: BlogCategory) => {
        if (isFormApproach && setValue) {
            const current = watch?.("selectedCategories" as any) || [];
            if (!current.some((c: BlogCategory) => c.id === category.id)) {
                setValue("selectedCategories" as any, [...current, category], { shouldValidate: true });
            }
        } else {
            (props as BaseInfoTabManualProps).onCategoryToggle?.(category);
        }
    };

    const handleCategoryRemove = (categoryId: number) => {
        if (isFormApproach && setValue) {
            const current = watch?.("selectedCategories" as any) || [];
            setValue("selectedCategories" as any, current.filter((c: BlogCategory) => c.id !== categoryId), { shouldValidate: true });
        } else {
            (props as BaseInfoTabManualProps).onCategoryRemove?.(categoryId);
        }
    };

    const handleTagToggle = (tag: BlogTag) => {
        if (isFormApproach && setValue) {
            const currentTags = watch?.("selectedTags") || [];
            if (currentTags.some((t: BlogTag) => t.id === tag.id)) {
                setValue("selectedTags", currentTags.filter((t: BlogTag) => t.id !== tag.id), { shouldValidate: true });
            } else {
                setValue("selectedTags", [...currentTags, tag], { shouldValidate: true });
            }
        } else {
            (props as BaseInfoTabManualProps).onTagToggle?.(tag);
        }
    };

    const handleTagRemove = (tagId: number) => {
        if (isFormApproach && setValue) {
            const currentTags = watch?.("selectedTags") || [];
            setValue("selectedTags", currentTags.filter((tag: BlogTag) => tag.id !== tagId), { shouldValidate: true });
        } else {
            (props as BaseInfoTabManualProps).onTagRemove?.(tagId);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col lg:flex-row gap-6 items-start">
                <div className="flex-1 min-w-0 flex flex-col gap-6">
                    <CardWithIcon
                        icon={FileText}
                        title="محتوا و توضیحات"
                        iconBgColor="bg-blue"
                        iconColor="stroke-blue-2"
                        cardBorderColor="border-b-blue-1"
                    >
                        <div className="space-y-6">
                            <BlogTitle {...commonProps} />
                            <BlogShortDesc {...commonProps} />
                            <BlogDescription {...commonProps} />
                        </div>
                    </CardWithIcon>
                </div>

                <div className="w-full lg:w-80 xl:w-96 lg:shrink-0 lg:sticky lg:top-6 self-start z-10">
                    <div className="flex flex-col gap-6">
                        <CardWithIcon
                            icon={Settings}
                            title="دسته‌بندی و برچسب‌ها"
                            iconBgColor="bg-purple"
                            iconColor="stroke-purple-2"
                            cardBorderColor="border-b-purple-1"
                        >
                            <div className="space-y-8">
                                <BlogCategories
                                    categories={categories}
                                    setCategories={setCategories}
                                    loadingCategories={loadingCategories}
                                    selectedCategories={formSelectedCategories}
                                    onCategoryToggle={handleCategoryToggle}
                                    onCategoryRemove={handleCategoryRemove}
                                    editMode={editMode}
                                    errors={isFormApproach ? form?.formState.errors : (props as any).errors}
                                />
                                <BlogTags
                                    tags={tags}
                                    setTags={setTags}
                                    loadingTags={loadingTags}
                                    selectedTags={formSelectedTags}
                                    onTagToggle={handleTagToggle}
                                    onTagRemove={handleTagRemove}
                                    editMode={editMode}
                                    errors={isFormApproach ? form?.formState.errors : (props as any).errors}
                                />
                            </div>
                        </CardWithIcon>

                        <CardWithIcon
                            icon={Settings}
                            title="وضعیت نمایش و فعال‌سازی"
                            iconBgColor="bg-blue"
                            iconColor="stroke-blue-2"
                            cardBorderColor="border-b-blue-1"
                            showHeaderBorder={false}
                        >
                            <BlogStatus {...commonProps} />
                        </CardWithIcon>
                    </div>
                </div>
            </div>
        </div>
    );
}