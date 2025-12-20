import { useState, useEffect, type ChangeEvent } from "react";
import type { UseFormReturn } from "react-hook-form";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { TabsContent } from "@/components/elements/Tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/elements/Select";
import { Button } from "@/components/elements/Button";
import { Label } from "@/components/elements/Label";
import { Switch } from "@/components/elements/Switch";
import { Item, ItemContent, ItemTitle, ItemDescription, ItemActions } from "@/components/elements/Item";
import { TipTapEditor } from "@/components/forms/TipTapEditor";
import { FormField, FormFieldInput, FormFieldTextarea } from "@/components/forms/FormField";
import { Plus, FolderOpen, Tag, X, Settings, AlertCircle, FileText } from "lucide-react";
import { blogApi } from "@/api/blogs/blogs";
import type { BlogCategory } from "@/types/blog/category/blogCategory";
import type { BlogTag } from "@/types/blog/tags/blogTag";
import type { BlogFormValues } from "@/components/blogs/validations/blogSchema";
import { formatSlug, generateSlug } from '@/core/slug/generate';
import { QuickCreateDialog } from "./QuickCreateDialog";

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
}

type BaseInfoTabProps = BaseInfoTabFormProps | BaseInfoTabManualProps;

export default function BaseInfoTab(props: BaseInfoTabProps) {
    const [categories, setCategories] = useState<BlogCategory[]>([]);
    const [tags, setTags] = useState<BlogTag[]>([]);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [loadingTags, setLoadingTags] = useState(true);
    const [showCategoryDialog, setShowCategoryDialog] = useState(false);
    const [showTagDialog, setShowTagDialog] = useState(false);
    
    const isFormApproach = 'form' in props;
    
    const { register, formState: { errors }, watch, setValue } = isFormApproach 
        ? props.form 
        : { register: null, formState: { errors: {} as any }, watch: null, setValue: null };
    
    const formData = isFormApproach ? null : (props as any).formData;
    const handleInputChange = isFormApproach ? null : (props as any).handleInputChange;
    const editMode = isFormApproach ? (props as any).editMode : (props as any).editMode;
    const selectedCategories = isFormApproach ? [] : (props as any).selectedCategories || [];
    const selectedTags = isFormApproach ? [] : (props as any).selectedTags || [];
    const onCategoryToggle = isFormApproach ? null : (props as any).onCategoryToggle;
    const onCategoryRemove = isFormApproach ? null : (props as any).onCategoryRemove;
    const onTagToggle = isFormApproach ? null : (props as any).onTagToggle;
    const onTagRemove = isFormApproach ? null : (props as any).onTagRemove;
    const blogId = isFormApproach ? props.blogId : props.blogId;
    
    const nameValue = isFormApproach ? watch?.("name") : formData?.name;
    const descriptionValue = isFormApproach ? watch?.("description") : formData?.description;
    const formSelectedCategories = isFormApproach ? (watch?.("selectedCategories" as any) || []) : selectedCategories || [];
    const formSelectedTags = isFormApproach ? watch?.("selectedTags") || [] : selectedTags || [];

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await blogApi.getCategories({ page: 1, size: 100 });
                setCategories(response.data || []);
            } catch (error) {
            } finally {
                setLoadingCategories(false);
            }
        };

        const fetchTags = async () => {
            try {
                const response = await blogApi.getTags({ page: 1, size: 100 });
                setTags(response.data || []);
            } catch (error) {
            } finally {
                setLoadingTags(false);
            }
        };

        fetchCategories();
        fetchTags();
    }, []);

    useEffect(() => {
        if (isFormApproach && nameValue) {
            const slug = generateSlug(nameValue);
            setValue?.("slug", slug);
        }
    }, [nameValue, setValue, isFormApproach]);

    const handleTagToggleFn = (tag: BlogTag) => {
        if (isFormApproach) {
            const currentTags = watch?.("selectedTags") || [];
            if (currentTags.some((t: BlogTag) => t.id === tag.id)) {
                setValue?.("selectedTags", currentTags.filter((t: BlogTag) => t.id !== tag.id));
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
            setValue?.("selectedTags", currentTags.filter((tag: BlogTag) => tag.id !== tagId));
        } else {
            onTagRemove?.(tagId);
        }
    };

    const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (isFormApproach) {
        } else {
            handleInputChange?.("name", value);
            if (value && !formData?.slug) {
                const slug = generateSlug(value);
                handleInputChange?.("slug", slug);
            }
        }
    };

    const handleSlugChange = (e: ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const formattedSlug = formatSlug(value);
        if (isFormApproach) {
            setValue?.("slug", formattedSlug);
        } else {
            handleInputChange?.("slug", formattedSlug);
        }
    };

    const handleShortDescriptionChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        if (isFormApproach) {
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
                        <CardWithIcon
                            icon={FileText}
                            title="اطلاعات پایه"
                            iconBgColor="bg-blue"
                            iconColor="stroke-blue-2"
                            borderColor="border-b-blue-1"
                        >
                                <div className="space-y-6">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {isFormApproach ? (
                                        <FormFieldInput
                                            label="نام"
                                            id="name"
                                            required
                                            error={errors.name?.message}
                                            placeholder="نام وبلاگ"
                                            disabled={!editMode}
                                            {...register!("name")}
                                        />
                                    ) : (
                                        <FormFieldInput
                                            label="نام"
                                            id="name"
                                            required
                                            error={errors.name?.message}
                                            placeholder="نام وبلاگ"
                                            disabled={!editMode}
                                            value={formData?.name || ""}
                                            onChange={handleNameChange}
                                        />
                                    )}
                                    
                                    {isFormApproach ? (
                                        <FormFieldInput
                                            label="لینک (نامک)"
                                            id="slug"
                                            required
                                            error={errors.slug?.message}
                                            placeholder="نامک"
                                            disabled={!editMode}
                                            {...register!("slug", {
                                                onChange: (e) => {
                                                    const formattedSlug = formatSlug(e.target.value);
                                                    e.target.value = formattedSlug;
                                                    setValue?.("slug", formattedSlug);
                                                }
                                            })}
                                        />
                                    ) : (
                                        <FormFieldInput
                                            label="لینک (نامک)"
                                            id="slug"
                                            required
                                            error={errors.slug?.message}
                                            placeholder="نامک"
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
                                        placeholder="یک توضیح کوتاه درباره وبلاگ... (حداکثر ۳۰۰ کاراکتر)"
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
                                        placeholder="یک توضیح کوتاه درباره وبلاگ... (حداکثر ۳۰۰ کاراکتر)"
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
                                        placeholder="توضیحات کامل وبلاگ را وارد کنید... (اختیاری)"
                                    />
                                </FormField>
                                </div>
                        </CardWithIcon>
                    </div>
                </div>

                <div className="w-full lg:w-[420px] lg:flex-shrink-0">
                    <CardWithIcon
                        icon={Settings}
                        title="تنظیمات"
                        iconBgColor="bg-blue"
                        iconColor="stroke-blue-2"
                        borderColor="border-b-blue-1"
                        className="lg:sticky lg:top-20"
                    >
                            <div className="space-y-8">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-purple rounded-lg">
                                        <FolderOpen className="w-4 h-4 stroke-purple-2" />
                                    </div>
                                    <Label>
                                        دسته‌بندی‌ها
                                        <span className="text-red-2">*</span>
                                    </Label>
                                </div>
                                <div className="space-y-2">
                                    {formSelectedCategories.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {formSelectedCategories.map((category: BlogCategory) => (
                                                <span 
                                                    key={category.id} 
                                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-purple text-purple-2 transition hover:shadow-sm"
                                                >
                                                    {category.name}
                                                    <button 
                                                        type="button" 
                                                        className="text-purple-2 hover:text-purple-2 cursor-pointer"
                                                        title="حذف"
                                                        onClick={() => {
                                                            if (isFormApproach) {
                                                                const currentCategories = watch?.("selectedCategories" as any) || [];
                                                                setValue?.("selectedCategories" as any, currentCategories.filter((c: BlogCategory) => c.id !== category.id));
                                                            } else {
                                                                onCategoryRemove?.(category.id);
                                                            }
                                                        }}
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    
                                    <div className="flex gap-4 w-full">
                                        <div className="flex-1">
                                            <Select 
                                                disabled={!editMode || loadingCategories}
                                                onValueChange={(value) => {
                                                    const category = categories.find(c => String(c.id) === value);
                                                    if (category) {
                                                        if (isFormApproach) {
                                                            const currentCategories = watch?.("selectedCategories" as any) || [];
                                                            if (!currentCategories.some((c: BlogCategory) => c.id === category.id)) {
                                                                setValue?.("selectedCategories" as any, [...currentCategories, category]);
                                                            }
                                                        } else {
                                                            onCategoryToggle?.(category);
                                                        }
                                                    }
                                                }}
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder={loadingCategories ? "در حال بارگذاری..." : "دسته‌بندی‌ها را انتخاب کنید"} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {categories.map((category) => {
                                                        const isSelected = formSelectedCategories.some((selected: BlogCategory) => selected.id === category.id);
                                                        return (
                                                            <SelectItem 
                                                                key={category.id} 
                                                                value={String(category.id)}
                                                                disabled={isSelected}
                                                                className={isSelected ? "opacity-60" : undefined}
                                                            >
                                                                <div className="flex items-center justify-between w-full gap-2">
                                                                    <span>{category.name}</span>
                                                                    {isSelected && (
                                                                        <span className="inline-flex items-center">
                                                                            <span className="w-1.5 h-1.5 rounded-full bg-purple-2 shadow-[0_0_5px_rgba(107,33,168,0.7)]"></span>
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </SelectItem>
                                                        );
                                                    })}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="bg-purple hover:bg-purple border-purple-1 text-purple-2"
                                            disabled={!editMode}
                                            onClick={() => setShowCategoryDialog(true)}
                                        >
                                            <Plus />
                                        </Button>
                                    </div>
                                </div>
                                {errors.selectedCategories?.message && (
                                    <div className="flex items-start gap-2 text-red-2">
                                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                        <span>{errors.selectedCategories?.message}</span>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-indigo rounded-lg">
                                        <Tag className="w-4 h-4 stroke-indigo-2" />
                                    </div>
                                    <Label>
                                        تگ‌ها
                                    </Label>
                                </div>
                                <div className="space-y-2">
                                    {formSelectedTags.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {formSelectedTags.map((tag: BlogTag) => (
                                                <span 
                                                    key={tag.id} 
                                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-indigo text-indigo-2 transition hover:shadow-sm"
                                                >
                                                    {tag.name}
                                                    <button 
                                                        type="button" 
                                                        className="text-indigo-2 hover:text-indigo-2 cursor-pointer"
                                                        title="حذف"
                                                        onClick={() => handleTagRemoveFn(tag.id)}
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    
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
                                                    {tags.map((tag) => {
                                                        const isSelected = formSelectedTags.some((selected: BlogTag) => selected.id === tag.id);
                                                        return (
                                                            <SelectItem 
                                                                key={tag.id} 
                                                                value={String(tag.id)}
                                                                disabled={isSelected}
                                                                className={isSelected ? "opacity-60" : undefined}
                                                            >
                                                                <div className="flex items-center justify-between w-full gap-2">
                                                                    <span>{tag.name}</span>
                                                                    {isSelected && (
                                                                        <span className="inline-flex items-center">
                                                                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-2 shadow-[0_0_5px_rgba(55,48,163,0.7)]"></span>
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </SelectItem>
                                                        );
                                                    })}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="bg-indigo hover:bg-indigo border-indigo-1 text-indigo-2"
                                            disabled={!editMode}
                                            onClick={() => setShowTagDialog(true)}
                                        >
                                            <Plus />
                                        </Button>
                            </div>

                            {!isFormApproach && (
                                <div className="mt-6 space-y-4">
                                    <div className="rounded-xl border border-blue-1/40 bg-blue-0/30 hover:border-blue-1/60 transition-colors overflow-hidden">
                                        <Item variant="default" size="default" className="py-5">
                                            <ItemContent>
                                                <ItemTitle className="text-blue-2">نمایش عمومی</ItemTitle>
                                                <ItemDescription>
                                                    اگر غیرفعال باشد بلاگ در سایت نمایش داده نمی‌شود.
                                                </ItemDescription>
                                            </ItemContent>
                                            <ItemActions>
                                                <Switch
                                                    checked={(formData?.is_public ?? true)}
                                                    disabled={!editMode}
                                                    onCheckedChange={(checked) => handleInputChange?.("is_public", checked)}
                                                />
                                            </ItemActions>
                                        </Item>
                                    </div>
                                    
                                    <div className="rounded-xl border border-green-1/40 bg-green-0/30 hover:border-green-1/60 transition-colors overflow-hidden">
                                        <Item variant="default" size="default" className="py-5">
                                            <ItemContent>
                                                <ItemTitle className="text-green-2">وضعیت فعال</ItemTitle>
                                                <ItemDescription>
                                                    با غیرفعال شدن، بلاگ از لیست مدیریت نیز مخفی می‌شود.
                                                </ItemDescription>
                                            </ItemContent>
                                            <ItemActions>
                                                <Switch
                                                    checked={(formData?.is_active ?? true)}
                                                    disabled={!editMode}
                                                    onCheckedChange={(checked) => handleInputChange?.("is_active", checked)}
                                                />
                                            </ItemActions>
                                        </Item>
                                    </div>
                                    
                                    <div className="rounded-xl border border-orange-1/40 bg-orange-0/30 hover:border-orange-1/60 transition-colors overflow-hidden">
                                        <Item variant="default" size="default" className="py-5">
                                            <ItemContent>
                                                <ItemTitle className="text-orange-2">وضعیت ویژه</ItemTitle>
                                                <ItemDescription>
                                                    بلاگ‌های ویژه در بخش‌های خاص سایت با اولویت نمایش داده می‌شوند.
                                                </ItemDescription>
                                            </ItemContent>
                                            <ItemActions>
                                                <Switch
                                                    checked={(formData?.is_featured ?? false)}
                                                    disabled={!editMode}
                                                    onCheckedChange={(checked) => handleInputChange?.("is_featured", checked)}
                                                />
                                            </ItemActions>
                                        </Item>
                                    </div>
                                </div>
                            )}
                                </div>
                                {errors.selectedTags?.message && (
                                    <div className="flex items-start gap-2 text-red-2">
                                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                        <span>{errors.selectedTags?.message}</span>
                                    </div>
                                )}
                            </div>

                            {/* مثال استفاده از Item با Switch برای formApproach */}
                            {isFormApproach && (
                                <div className="mt-6 space-y-4">
                                    <div className="rounded-xl border border-blue-1/40 bg-blue-0/30 hover:border-blue-1/60 transition-colors overflow-hidden">
                                        <Item variant="default" size="default" className="py-5">
                                            <ItemContent>
                                                <ItemTitle className="text-blue-2">نمایش عمومی</ItemTitle>
                                                <ItemDescription>
                                                    اگر غیرفعال باشد بلاگ در سایت نمایش داده نمی‌شود.
                                                </ItemDescription>
                                            </ItemContent>
                                            <ItemActions>
                                                <Switch
                                                    checked={(watch?.("is_public" as any) ?? true) as boolean}
                                                    disabled={!editMode}
                                                    onCheckedChange={(checked) => setValue?.("is_public" as any, checked)}
                                                />
                                            </ItemActions>
                                        </Item>
                                    </div>
                                    
                                    <div className="rounded-xl border border-green-1/40 bg-green-0/30 hover:border-green-1/60 transition-colors overflow-hidden">
                                        <Item variant="default" size="default" className="py-5">
                                            <ItemContent>
                                                <ItemTitle className="text-green-2">وضعیت فعال</ItemTitle>
                                                <ItemDescription>
                                                    با غیرفعال شدن، بلاگ از لیست مدیریت نیز مخفی می‌شود.
                                                </ItemDescription>
                                            </ItemContent>
                                            <ItemActions>
                                                <Switch
                                                    checked={(watch?.("is_active" as any) ?? true) as boolean}
                                                    disabled={!editMode}
                                                    onCheckedChange={(checked) => setValue?.("is_active" as any, checked)}
                                                />
                                            </ItemActions>
                                        </Item>
                                    </div>
                                    
                                    <div className="rounded-xl border border-orange-1/40 bg-orange-0/30 hover:border-orange-1/60 transition-colors overflow-hidden">
                                        <Item variant="default" size="default" className="py-5">
                                            <ItemContent>
                                                <ItemTitle className="text-orange-2">وضعیت ویژه</ItemTitle>
                                                <ItemDescription>
                                                    بلاگ‌های ویژه در بخش‌های خاص سایت با اولویت نمایش داده می‌شوند.
                                                </ItemDescription>
                                            </ItemContent>
                                            <ItemActions>
                                                <Switch
                                                    checked={(watch?.("is_featured" as any) ?? false) as boolean}
                                                    disabled={!editMode}
                                                    onCheckedChange={(checked) => setValue?.("is_featured" as any, checked)}
                                                />
                                            </ItemActions>
                                        </Item>
                                    </div>
                                </div>
                            )}

                            </div>
                    </CardWithIcon>
                </div>
            </div>

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
                    return await blogApi.createCategory(categoryData);
                }}
                onSuccess={(createdCategory) => {
                    setCategories(prev => prev.some(cat => cat.id === createdCategory.id) ? prev : [...prev, createdCategory]);
                    if (isFormApproach) {
                        const currentCategories = watch?.("selectedCategories" as any) || [];
                        setValue?.("selectedCategories" as any, [...currentCategories, createdCategory]);
                    } else {
                        onCategoryToggle?.(createdCategory);
                    }
                }}
                refetchList={() => {
                    blogApi.getCategories({ page: 1, size: 100 }).then(response => {
                        setCategories(response.data || []);
                    });
                }}
                context="blog"
                contextId={blogId}
            />

            <QuickCreateDialog
                open={showTagDialog}
                onOpenChange={setShowTagDialog}
                type="tag"
                onSubmit={async (data) => {
                    return await blogApi.createTag({ 
                        name: data.name, 
                        slug: data.slug, 
                        is_public: data.is_public ?? true, 
                        is_active: data.is_active ?? true 
                    });
                }}
                onSuccess={(createdTag) => {
                    setTags(prev => prev.some(tag => tag.id === createdTag.id) ? prev : [...prev, createdTag]);
                    if (isFormApproach) {
                        const currentTags = watch?.("selectedTags") || [];
                        setValue?.("selectedTags", [...currentTags, createdTag]);
                    } else {
                        onTagToggle?.(createdTag);
                    }
                }}
                refetchList={() => {
                    blogApi.getTags({ page: 1, size: 100 }).then(response => {
                        setTags(response.data || []);
                    });
                }}
                context="blog"
                contextId={blogId}
            />

        </TabsContent>
    );
}