import { useState, useEffect } from "react";
import type { UseFormReturn } from "react-hook-form";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Settings } from "lucide-react";
import { blogApi } from "@/api/blogs/blogs";
import type { BlogCategory } from "@/types/blog/category/blogCategory";
import type { BlogTag } from "@/types/blog/tags/blogTag";
import type { BlogFormValues } from "@/components/blogs/validations/blogSchema";
import { BlogSidebarTaxonomy } from "./BlogSidebarTaxonomy";
import { BlogSidebarSettings } from "./BlogSidebarSettings";

interface BlogSidebarProps {
    form?: UseFormReturn<BlogFormValues>;
    formData?: any;
    handleInputChange?: (field: string, value: any) => void;
    editMode: boolean;
    isFormApproach: boolean;
    selectedCategories: BlogCategory[];
    selectedTags: BlogTag[];
    onCategoryToggle?: (category: BlogCategory) => void;
    onCategoryRemove?: (categoryId: number) => void;
    onTagToggle?: (tag: BlogTag) => void;
    onTagRemove?: (tagId: number) => void;
    blogId?: number | string;
}

export function BlogSidebar({
    form,
    formData,
    handleInputChange,
    editMode,
    isFormApproach,
    selectedCategories: manualCategories,
    selectedTags: manualTags,
    onCategoryToggle,
    onCategoryRemove,
    onTagToggle,
    onTagRemove,
    blogId
}: BlogSidebarProps) {
    const { formState: { errors }, watch, setValue } = isFormApproach && form
        ? form
        : { formState: { errors: {} as any }, watch: null, setValue: null };

    const [categories, setCategories] = useState<BlogCategory[]>([]);
    const [tags, setTags] = useState<BlogTag[]>([]);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [loadingTags, setLoadingTags] = useState(true);
    const [showCategoryDialog, setShowCategoryDialog] = useState(false);
    const [showTagDialog, setShowTagDialog] = useState(false);

    const formSelectedCategories = isFormApproach ? (watch?.("selectedCategories" as any) || []) : manualCategories || [];
    const formSelectedTags = isFormApproach ? watch?.("selectedTags") || [] : manualTags || [];

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await blogApi.getCategories({ page: 1, size: 100 });
                setCategories(response.data || []);
            } finally {
                setLoadingCategories(false);
            }
        };

        const fetchTags = async () => {
            try {
                const response = await blogApi.getTags({ page: 1, size: 100 });
                setTags(response.data || []);
            } finally {
                setLoadingTags(false);
            }
        };

        fetchCategories();
        fetchTags();
    }, []);

    const handleCategoryToggleFn = (category: BlogCategory) => {
        if (isFormApproach && setValue) {
            const current = watch?.("selectedCategories" as any) || [];
            if (!current.some((c: BlogCategory) => c.id === category.id)) {
                setValue("selectedCategories" as any, [...current, category]);
            }
        } else {
            onCategoryToggle?.(category);
        }
    };

    const handleCategoryRemoveFn = (categoryId: number) => {
        if (isFormApproach && setValue) {
            const current = watch?.("selectedCategories" as any) || [];
            setValue("selectedCategories" as any, current.filter((c: BlogCategory) => c.id !== categoryId));
        } else {
            onCategoryRemove?.(categoryId);
        }
    };

    const handleTagToggleFn = (tag: BlogTag) => {
        if (isFormApproach && setValue) {
            const currentTags = watch?.("selectedTags") || [];
            if (currentTags.some((t: BlogTag) => t.id === tag.id)) {
                setValue("selectedTags", currentTags.filter((t: BlogTag) => t.id !== tag.id));
            } else {
                setValue("selectedTags", [...currentTags, tag]);
            }
        } else {
            onTagToggle?.(tag);
        }
    };

    const handleTagRemoveFn = (tagId: number) => {
        if (isFormApproach && setValue) {
            const currentTags = watch?.("selectedTags") || [];
            setValue("selectedTags", currentTags.filter((tag: BlogTag) => tag.id !== tagId));
        } else {
            onTagRemove?.(tagId);
        }
    };

    const handleSettingChange = (field: string, value: boolean) => {
        if (isFormApproach && setValue) {
            setValue(field as any, value);
        } else {
            handleInputChange?.(field, value);
        }
    };

    return (
        <CardWithIcon
            icon={Settings}
            title="تنظیمات"
            iconBgColor="bg-blue"
            iconColor="stroke-blue-2"
            cardBorderColor="border-b-blue-1"
            className="lg:sticky lg:top-20"
        >
            <div className="space-y-8">
                <BlogSidebarTaxonomy
                    categories={categories}
                    setCategories={setCategories}
                    tags={tags}
                    setTags={setTags}
                    loadingCategories={loadingCategories}
                    loadingTags={loadingTags}
                    selectedCategories={formSelectedCategories}
                    selectedTags={formSelectedTags}
                    editMode={editMode}
                    isFormApproach={isFormApproach}
                    errors={errors}
                    blogId={blogId}
                    showCategoryDialog={showCategoryDialog}
                    setShowCategoryDialog={setShowCategoryDialog}
                    showTagDialog={showTagDialog}
                    setShowTagDialog={setShowTagDialog}
                    onCategoryToggle={handleCategoryToggleFn}
                    onCategoryRemove={handleCategoryRemoveFn}
                    onTagToggle={handleTagToggleFn}
                    onTagRemove={handleTagRemoveFn}
                />

                <BlogSidebarSettings
                    isPublic={isFormApproach ? (watch?.("is_public" as any) ?? true) as boolean : (formData?.is_public ?? true)}
                    isActive={isFormApproach ? (watch?.("is_active" as any) ?? true) as boolean : (formData?.is_active ?? true)}
                    isFeatured={isFormApproach ? (watch?.("is_featured" as any) ?? false) as boolean : (formData?.is_featured ?? false)}
                    editMode={editMode}
                    handleSettingChange={handleSettingChange}
                />
            </div>
        </CardWithIcon>
    );
}
