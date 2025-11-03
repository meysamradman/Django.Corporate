"use client";

import { useState, useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/elements/Card";
import { Input } from "@/components/elements/Input";
import { Textarea } from "@/components/elements/Textarea";
import { TabsContent } from "@/components/elements/Tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/elements/Select";
import { Button } from "@/components/elements/Button";
import { Label } from "@/components/elements/Label";
import { TipTapEditor } from "@/components/forms/TipTapEditor";
import { FormField, FormFieldInput, FormFieldTextarea } from "@/components/forms/FormField";
import { Plus, FolderOpen, Tag, X, Settings, AlertCircle, FileText } from "lucide-react";
import { portfolioApi } from "@/api/portfolios/route";
import { PortfolioCategory } from "@/types/portfolio/category/portfolioCategory";
import { PortfolioTag } from "@/types/portfolio/tags/portfolioTag";
import { PortfolioOption } from "@/types/portfolio/options/portfolioOption";
import { PortfolioFormValues } from "@/core/validations/portfolioSchema";
import { formatSlug, generateSlug } from '@/core/utils/slugUtils';
import { QuickCreateDialog } from "./QuickCreateDialog";

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
    selectedOptions: PortfolioOption[];
    onCategoryChange: (value: string) => void;
    onTagToggle: (tag: PortfolioTag) => void;
    onTagRemove: (tagId: number) => void;
    onOptionToggle: (option: PortfolioOption) => void;
    onOptionRemove: (optionId: number) => void;
}

// Union type for both approaches
type BaseInfoTabProps = BaseInfoTabFormProps | BaseInfoTabManualProps;

export default function BaseInfoTab(props: BaseInfoTabProps) {
    const [categories, setCategories] = useState<PortfolioCategory[]>([]);
    const [tags, setTags] = useState<PortfolioTag[]>([]);
    const [options, setOptions] = useState<PortfolioOption[]>([]);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [loadingTags, setLoadingTags] = useState(true);
    const [loadingOptions, setLoadingOptions] = useState(true);
    const [showCategoryDialog, setShowCategoryDialog] = useState(false);
    const [showTagDialog, setShowTagDialog] = useState(false);
    const [showOptionDialog, setShowOptionDialog] = useState(false);
    
    // Check which approach is being used
    const isFormApproach = 'form' in props;
    
    // Get form state based on approach
    const { register, formState: { errors }, watch, setValue } = isFormApproach 
        ? props.form 
        : { register: null, formState: { errors: {} as any }, watch: null, setValue: null };
    
    // For manual approach, use props directly
    const formData = isFormApproach ? null : (props as any).formData;
    const handleInputChange = isFormApproach ? null : (props as any).handleInputChange;
    const editMode = isFormApproach ? (props as any).editMode : (props as any).editMode;
    const selectedCategory = isFormApproach ? undefined : (props as any).selectedCategory;
    const selectedTags = isFormApproach ? [] : (props as any).selectedTags || [];
    const selectedOptions = isFormApproach ? [] : (props as any).selectedOptions || [];
    const onCategoryChange = isFormApproach ? null : (props as any).onCategoryChange;
    const onTagToggle = isFormApproach ? null : (props as any).onTagToggle;
    const onTagRemove = isFormApproach ? null : (props as any).onTagRemove;
    const onOptionToggle = isFormApproach ? null : (props as any).onOptionToggle;
    const onOptionRemove = isFormApproach ? null : (props as any).onOptionRemove;
    
    // Watch values for form approach
    const nameValue = isFormApproach ? watch?.("name") : formData?.name;
    const slugValue = isFormApproach ? watch?.("slug") : formData?.slug;
    const shortDescriptionValue = isFormApproach ? watch?.("short_description") : formData?.short_description;
    const descriptionValue = isFormApproach ? watch?.("description") : formData?.description;
    const formSelectedCategory = isFormApproach ? watch?.("selectedCategory") : selectedCategory;
    const formSelectedTags = isFormApproach ? watch?.("selectedTags") || [] : selectedTags || [];
    const formSelectedOptions = isFormApproach ? watch?.("selectedOptions") || [] : selectedOptions || [];

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

        // Fetch options
        const fetchOptions = async () => {
            try {
                const response = await portfolioApi.getOptions({ page: 1, size: 100 });
                setOptions(response.data || []);
            } catch (error) {
                console.error("Error fetching options:", error);
            } finally {
                setLoadingOptions(false);
            }
        };

        fetchCategories();
        fetchTags();
        fetchOptions();
    }, []);

    // Auto-generate slug from name (form approach)
    useEffect(() => {
        if (isFormApproach && nameValue) {
            const slug = generateSlug(nameValue);
            setValue?.("slug", slug);
        }
    }, [nameValue, setValue, isFormApproach]);

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

    const handleOptionToggleFn = (option: PortfolioOption) => {
        if (isFormApproach) {
            const currentOptions = watch?.("selectedOptions") || [];
            if (currentOptions.some((o: PortfolioOption) => o.id === option.id)) {
                setValue?.("selectedOptions", currentOptions.filter((o: PortfolioOption) => o.id !== option.id));
            } else {
                setValue?.("selectedOptions", [...currentOptions, option]);
            }
        } else {
            onOptionToggle?.(option);
        }
    };

    const handleOptionRemoveFn = (optionId: number) => {
        if (isFormApproach) {
            const currentOptions = watch?.("selectedOptions") || [];
            setValue?.("selectedOptions", currentOptions.filter((option: PortfolioOption) => option.id !== optionId));
        } else {
            onOptionRemove?.(optionId);
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
        <TabsContent value="account" className="mt-0 space-y-6">
            <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1 min-w-0">
                    <div className="space-y-6">
                        <Card className="hover:shadow-lg transition-all duration-300 border-b-4 border-b-purple-500">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-3">
                                    <div className="p-2.5 bg-purple-100 rounded-xl shadow-sm">
                                        <FileText className="w-5 h-5 stroke-purple-600" />
                                    </div>
                                    <div>اطلاعات پایه</div>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-6">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {isFormApproach ? (
                                        <FormFieldInput
                                            label="نام"
                                            id="name"
                                            required
                                            error={errors.name?.message}
                                            placeholder="نام نمونه‌کار"
                                            disabled={!editMode}
                                            {...register!("name")}
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
                                            {...register!("slug")}
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
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <div className="w-full lg:w-[420px] lg:flex-shrink-0">
                    <Card className="lg:sticky lg:top-20 hover:shadow-lg transition-all duration-300 border-b-4 border-b-indigo-500">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3">
                                <div className="p-2.5 bg-indigo-100 rounded-xl shadow-sm">
                                    <Settings className="w-5 h-5 stroke-indigo-600" />
                                </div>
                                <div>تنظیمات</div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-8">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-teal-100 rounded-lg">
                                        <FolderOpen className="w-4 h-4 stroke-teal-600" />
                                    </div>
                                    <Label>
                                        دسته‌بندی
                                        <span className="text-destructive">*</span>
                                    </Label>
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
                                        className="bg-teal-50 hover:bg-teal-100 border-teal-200 text-teal-600"
                                        disabled={!editMode}
                                        onClick={() => setShowCategoryDialog(true)}
                                    >
                                        <Plus />
                                    </Button>
                                </div>
                                {errors.selectedCategory?.message && (
                                    <div className="flex items-start gap-2 text-destructive">
                                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                        <span>{errors.selectedCategory?.message}</span>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-fuchsia-100 rounded-lg">
                                        <Tag className="w-4 h-4 stroke-fuchsia-600" />
                                    </div>
                                    <Label>
                                        تگ‌ها
                                    </Label>
                                </div>
                                <div className="space-y-2">
                                    {/* Display selected tags */}
                                    {formSelectedTags.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {formSelectedTags.map((tag: PortfolioTag) => (
                                                <span 
                                                    key={tag.id} 
                                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-fuchsia-100 text-fuchsia-800"
                                                >
                                                    {tag.name}
                                                    <button 
                                                        type="button" 
                                                        className="text-fuchsia-800 hover:text-fuchsia-900"
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
                                                    <SelectValue placeholder={loadingTags ? "در حال بارگذاری..." : "تگ‌ها را انتخاب کنید"} />
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
                                            className="bg-fuchsia-50 hover:bg-fuchsia-100 border-fuchsia-200 text-fuchsia-600"
                                            disabled={!editMode}
                                            onClick={() => setShowTagDialog(true)}
                                        >
                                            <Plus />
                                        </Button>
                                    </div>
                                </div>
                                {errors.selectedTags?.message && (
                                    <div className="flex items-start gap-2 text-destructive">
                                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                        <span>{errors.selectedTags?.message}</span>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-amber-100 rounded-lg">
                                        <Settings className="w-4 h-4 stroke-amber-600" />
                                    </div>
                                    <Label>
                                        گزینه‌ها
                                    </Label>
                                </div>
                                <div className="space-y-2">
                                    {/* Display selected options */}
                                    {formSelectedOptions.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {formSelectedOptions.map((option: PortfolioOption) => (
                                                <span 
                                                    key={option.id} 
                                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-amber-100 text-amber-800"
                                                >
                                                    {option.name}
                                                    <button 
                                                        type="button" 
                                                        className="text-amber-800 hover:text-amber-900"
                                                        onClick={() => handleOptionRemoveFn(option.id)}
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    
                                    {/* Option selection dropdown */}
                                    <div className="flex gap-4 w-full">
                                        <div className="flex-1">
                                            <Select 
                                                disabled={!editMode || loadingOptions}
                                                onValueChange={(value) => {
                                                    const option = options.find(o => String(o.id) === value);
                                                    if (option) handleOptionToggleFn(option);
                                                }}
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder={loadingOptions ? "در حال بارگذاری..." : "گزینه‌ها را انتخاب کنید"} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {options
                                                        .filter(option => !formSelectedOptions.some((selected: PortfolioOption) => selected.id === option.id))
                                                        .map((option) => (
                                                            <SelectItem 
                                                                key={option.id} 
                                                                value={String(option.id)}
                                                            >
                                                                {option.name}
                                                            </SelectItem>
                                                        ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-600"
                                            disabled={!editMode}
                                            onClick={() => setShowOptionDialog(true)}
                                        >
                                            <Plus />
                                        </Button>
                                    </div>
                                </div>
                                {errors.selectedOptions?.message && (
                                    <div className="flex items-start gap-2 text-destructive">
                                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                        <span>{errors.selectedOptions?.message}</span>
                                    </div>
                                )}
                            </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Quick Create Dialogs */}
            <QuickCreateDialog
                open={showCategoryDialog}
                onOpenChange={setShowCategoryDialog}
                type="category"
                onSubmit={async (data) => {
                    const categoryData: any = { 
                        name: data.name, 
                        slug: data.slug, 
                        is_public: data.is_public ?? true, 
                        is_active: data.is_active ?? true 
                    };
                    if (data.image_id) {
                        categoryData.image_id = data.image_id;
                    }
                    return await portfolioApi.createCategory(categoryData);
                }}
                onSuccess={(createdCategory) => {
                    if (isFormApproach) {
                        setValue?.("selectedCategory", String(createdCategory.id));
                    } else {
                        onCategoryChange?.(String(createdCategory.id));
                    }
                }}
                refetchList={() => {
                    portfolioApi.getCategories({ page: 1, size: 100 }).then(response => {
                        setCategories(response.data || []);
                    });
                }}
            />

            <QuickCreateDialog
                open={showTagDialog}
                onOpenChange={setShowTagDialog}
                type="tag"
                onSubmit={async (data) => {
                    return await portfolioApi.createTag({ 
                        name: data.name, 
                        slug: data.slug, 
                        is_public: data.is_public ?? true, 
                        is_active: data.is_active ?? true 
                    });
                }}
                onSuccess={(createdTag) => {
                    if (isFormApproach) {
                        const currentTags = watch?.("selectedTags") || [];
                        setValue?.("selectedTags", [...currentTags, createdTag]);
                    } else {
                        onTagToggle?.(createdTag);
                    }
                }}
                refetchList={() => {
                    portfolioApi.getTags({ page: 1, size: 100 }).then(response => {
                        setTags(response.data || []);
                    });
                }}
            />

            <QuickCreateDialog
                open={showOptionDialog}
                onOpenChange={setShowOptionDialog}
                type="option"
                onSubmit={async (data) => {
                    return await portfolioApi.createOption({ 
                        name: data.name, 
                        slug: data.slug, 
                        is_public: data.is_public ?? true, 
                        is_active: data.is_active ?? true 
                    });
                }}
                onSuccess={(createdOption) => {
                    if (isFormApproach) {
                        const currentOptions = watch?.("selectedOptions") || [];
                        setValue?.("selectedOptions", [...currentOptions, createdOption]);
                    } else {
                        onOptionToggle?.(createdOption);
                    }
                }}
                refetchList={() => {
                    portfolioApi.getOptions({ page: 1, size: 100 }).then(response => {
                        setOptions(response.data || []);
                    });
                }}
            />
        </TabsContent>
    );
}