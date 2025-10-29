"use client";

import { useState, useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/elements/Card";
import { Input } from "@/components/elements/Input";
import { Textarea } from "@/components/elements/Textarea";
import { TabsContent } from "@/components/elements/Tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/elements/Select";
import { Button } from "@/components/elements/Button";
import { TipTapEditor } from "@/components/forms/TipTapEditor";
import { FormField, FormFieldInput, FormFieldTextarea } from "@/components/forms/FormField";
import { Plus, FolderOpen, Tag, X } from "lucide-react";
import { portfolioApi } from "@/api/portfolios/route";
import { PortfolioCategory } from "@/types/portfolio/category/portfolioCategory";
import { PortfolioTag } from "@/types/portfolio/tags/portfolioTag";
import { PortfolioFormValues } from "@/core/validations/portfolioSchema";
import { formatSlug } from '@/core/utils/slugUtils';

// Props interface for react-hook-form approach (create page)
interface BaseInfoTabFormProps {
    form: UseFormReturn<PortfolioFormValues>;
    editMode: boolean;
}

// Props interface for manual state approach (edit page)
interface BaseInfoTabManualProps {
    formData: any;
    handleInputChange: (field: string, value: any) => void;
    editMode: boolean;
    selectedCategory: string;
    selectedTags: PortfolioTag[];
    onCategoryChange: (value: string) => void;
    onTagToggle: (tag: PortfolioTag) => void;
    onTagRemove: (tagId: number) => void;
}

// Union type for both approaches
type BaseInfoTabProps = BaseInfoTabFormProps | BaseInfoTabManualProps;

export default function BaseInfoTab(props: BaseInfoTabProps) {
    const [categories, setCategories] = useState<PortfolioCategory[]>([]);
    const [tags, setTags] = useState<PortfolioTag[]>([]);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [loadingTags, setLoadingTags] = useState(true);
    
    // Check which approach is being used
    const isFormApproach = 'form' in props;
    
    // Get form state based on approach
    const { register, formState: { errors }, watch, setValue } = isFormApproach 
        ? props.form 
        : { register: null, formState: { errors: {} }, watch: null, setValue: null };
    
    // For manual approach, use props directly
    const {
        formData,
        handleInputChange,
        editMode,
        selectedCategory,
        selectedTags,
        onCategoryChange,
        onTagToggle,
        onTagRemove
    } = isFormApproach ? {} as any : props;
    
    // Watch values for form approach
    const nameValue = isFormApproach ? watch?.("name") : formData?.name;
    const slugValue = isFormApproach ? watch?.("slug") : formData?.slug;
    const shortDescriptionValue = isFormApproach ? watch?.("short_description") : formData?.short_description;
    const descriptionValue = isFormApproach ? watch?.("description") : formData?.description;
    const formSelectedCategory = isFormApproach ? watch?.("selectedCategory") : selectedCategory;
    const formSelectedTags = isFormApproach ? watch?.("selectedTags") || [] : selectedTags || [];

    useEffect(() => {
        // Fetch categories
        const fetchCategories = async () => {
            try {
                const response = await portfolioApi.getCategories({ page: 1, size: 100 });
                setCategories(response.data || []);
            } catch (error) {
                console.error("Error fetching categories:", error);
            } finally {
                setLoadingCategories(false);
            }
        };

        // Fetch tags
        const fetchTags = async () => {
            try {
                const response = await portfolioApi.getTags({ page: 1, size: 100 });
                setTags(response.data || []);
            } catch (error) {
                console.error("Error fetching tags:", error);
            } finally {
                setLoadingTags(false);
            }
        };

        fetchCategories();
        fetchTags();
    }, []);

    // Auto-generate slug from name (form approach)
    useEffect(() => {
        if (isFormApproach && nameValue && !watch?.("slug")) {
            const slug = nameValue
                .toLowerCase()
                .replace(/\s+/g, '-')
                .replace(/[^\u0600-\u06FFa-z0-9-]/g, '')
                .replace(/--+/g, '-')
                .replace(/^-+|-+$/g, '');
            setValue?.("slug", slug);
        }
    }, [nameValue, watch, setValue, isFormApproach]);

    const handleTagToggleFn = (tag: PortfolioTag) => {
        if (isFormApproach) {
            const currentTags = watch?.("selectedTags") || [];
            if (currentTags.some((t: PortfolioTag) => t.id === tag.id)) {
                setValue?.("selectedTags", currentTags.filter((t: PortfolioTag) => t.id !== tag.id));
            } else {
                setValue?.("selectedTags", [...currentTags, tag]);
            }
        } else {
            onTagToggle?.(tag);
        }
    };

    const handleTagRemoveFn = (tagId: number) => {
        if (isFormApproach) {
            const currentTags = watch?.("selectedTags") || [];
            setValue?.("selectedTags", currentTags.filter((tag: PortfolioTag) => tag.id !== tagId));
        } else {
            onTagRemove?.(tagId);
        }
    };

    // Handle input changes for manual approach
    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (isFormApproach) {
            // For form approach, let react-hook-form handle it
        } else {
            handleInputChange?.("name", value);
            // Auto-generate slug
            if (value && !formData?.slug) {
                const slug = value
                    .toLowerCase()
                    .replace(/\s+/g, '-')
                    .replace(/[^\u0600-\u06FFa-z0-9-]/g, '')
                    .replace(/--+/g, '-')
                    .replace(/^-+|-+$/g, '');
                handleInputChange?.("slug", slug);
            }
        }
    };

    const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const formattedSlug = formatSlug(value);
        if (isFormApproach) {
            // For form approach, let react-hook-form handle it
        } else {
            handleInputChange?.("slug", formattedSlug);
        }
    };

    const handleShortDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        if (isFormApproach) {
            // For form approach, let react-hook-form handle it
        } else {
            handleInputChange?.("short_description", value);
        }
    };

    const handleDescriptionChange = (content: string) => {
        if (isFormApproach) {
            setValue?.("description", content);
        } else {
            handleInputChange?.("description", content);
        }
    };

    return (
        <TabsContent value="account" className="mt-6">
            <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1 min-w-0">
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>اطلاعات پایه</CardTitle>
                                <CardDescription>اطلاعات اصلی نمونه‌کار</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {isFormApproach ? (
                                        <FormFieldInput
                                            label="نام"
                                            id="name"
                                            required
                                            error={errors.name?.message}
                                            placeholder="نام نمونه‌کار"
                                            disabled={!editMode}
                                            {...register!("name", {
                                                onChange: handleNameChange
                                            })}
                                        />
                                    ) : (
                                        <FormFieldInput
                                            label="نام"
                                            id="name"
                                            required
                                            error={errors.name?.message}
                                            placeholder="نام نمونه‌کار"
                                            disabled={!editMode}
                                            value={formData?.name || ""}
                                            onChange={handleNameChange}
                                        />
                                    )}
                                    
                                    {isFormApproach ? (
                                        <FormFieldInput
                                            label="لینک (اسلاگ)"
                                            id="slug"
                                            required
                                            error={errors.slug?.message}
                                            placeholder="نمونه-کار-من یا my-portfolio-item"
                                            disabled={!editMode}
                                            {...register!("slug", {
                                                onChange: handleSlugChange
                                            })}
                                        />
                                    ) : (
                                        <FormFieldInput
                                            label="لینک (اسلاگ)"
                                            id="slug"
                                            required
                                            error={errors.slug?.message}
                                            placeholder="نمونه-کار-من یا my-portfolio-item"
                                            disabled={!editMode}
                                            value={formData?.slug || ""}
                                            onChange={handleSlugChange}
                                        />
                                    )}
                                </div>

                                {isFormApproach ? (
                                    <FormFieldTextarea
                                        label="توضیحات کوتاه"
                                        id="short_description"
                                        error={errors.short_description?.message}
                                        placeholder="یک توضیح کوتاه درباره نمونه‌کار... (حداکثر ۳۰۰ کاراکتر)"
                                        rows={3}
                                        disabled={!editMode}
                                        maxLength={300}
                                        {...register!("short_description", {
                                            onChange: handleShortDescriptionChange
                                        })}
                                    />
                                ) : (
                                    <FormFieldTextarea
                                        label="توضیحات کوتاه"
                                        id="short_description"
                                        error={errors.short_description?.message}
                                        placeholder="یک توضیح کوتاه درباره نمونه‌کار... (حداکثر ۳۰۰ کاراکتر)"
                                        rows={3}
                                        disabled={!editMode}
                                        maxLength={300}
                                        value={formData?.short_description || ""}
                                        onChange={handleShortDescriptionChange}
                                    />
                                )}

                                <FormField
                                    label="توضیحات بلند"
                                    error={errors.description?.message}
                                >
                                    <TipTapEditor
                                        content={descriptionValue || ""}
                                        onChange={handleDescriptionChange}
                                        placeholder="توضیحات کامل نمونه‌کار را وارد کنید... (اختیاری)"
                                    />
                                </FormField>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <div className="w-full lg:w-[420px] lg:flex-shrink-0">
                    <Card className="lg:sticky lg:top-6">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm">تنظیمات</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-8">
                            <FormField
                                label="دسته‌بندی"
                                required
                                error={errors.selectedCategory?.message}
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <FolderOpen className="w-4 h-4 text-blue-500" />
                                </div>
                                <div className="flex gap-4 w-full">
                                    <div className="flex-1">
                                        <Select 
                                            disabled={!editMode || loadingCategories}
                                            value={formSelectedCategory || ""}
                                            onValueChange={(value) => {
                                                if (isFormApproach) {
                                                    setValue?.("selectedCategory", value);
                                                } else {
                                                    onCategoryChange?.(value);
                                                }
                                            }}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder={loadingCategories ? "در حال بارگذاری..." : "دسته‌بندی را انتخاب کنید"} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {categories.map((category) => (
                                                    <SelectItem key={category.id} value={String(category.id)}>
                                                        {category.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="p-0 bg-blue-50 hover:bg-blue-100 border-blue-200 flex-shrink-0"
                                        style={{ height: '34px', width: '34px' }}
                                        disabled={!editMode}
                                    >
                                        <Plus className="w-3 h-3 text-blue-600" />
                                    </Button>
                                </div>
                            </FormField>

                            <FormField
                                label="تگ‌ها (اختیاری)"
                                error={errors.selectedTags?.message}
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <Tag className="w-4 h-4 text-green-500" />
                                </div>
                                <div className="space-y-2">
                                    {/* Display selected tags */}
                                    {formSelectedTags.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {formSelectedTags.map((tag: PortfolioTag) => (
                                                <span 
                                                    key={tag.id} 
                                                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800"
                                                >
                                                    {tag.name}
                                                    <button 
                                                        type="button" 
                                                        className="ml-1 text-green-800 hover:text-green-900"
                                                        onClick={() => handleTagRemoveFn(tag.id)}
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    
                                    {/* Tag selection dropdown */}
                                    <div className="flex gap-4 w-full">
                                        <div className="flex-1">
                                            <Select 
                                                disabled={!editMode || loadingTags}
                                                onValueChange={(value) => {
                                                    const tag = tags.find(t => String(t.id) === value);
                                                    if (tag) handleTagToggleFn(tag);
                                                }}
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder={loadingTags ? "در حال بارگذاری..." : "تگ‌ها را انتخاب کنید (اختیاری)"} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {tags
                                                        .filter(tag => !formSelectedTags.some((selected: PortfolioTag) => selected.id === tag.id))
                                                        .map((tag) => (
                                                            <SelectItem 
                                                                key={tag.id} 
                                                                value={String(tag.id)}
                                                            >
                                                                {tag.name}
                                                            </SelectItem>
                                                        ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="p-0 bg-green-50 hover:bg-green-100 border-green-200 flex-shrink-0"
                                            style={{ height: '34px', width: '34px' }}
                                            disabled={!editMode}
                                        >
                                            <Plus className="w-3 h-3 text-green-600" />
                                        </Button>
                                    </div>
                                </div>
                            </FormField>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </TabsContent>
    );
}