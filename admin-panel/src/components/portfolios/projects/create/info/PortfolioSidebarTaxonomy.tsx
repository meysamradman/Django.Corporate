import { useState, useEffect, lazy, Suspense } from "react";
import type { UseFormReturn } from "react-hook-form";
import { FolderOpen, Tag, Settings, AlertCircle } from "lucide-react";
import { MultiSelector } from "@/components/shared/MultiSelector";
import { portfolioApi } from "@/api/portfolios/portfolios";
import type { PortfolioCategory } from "@/types/portfolio/category/portfolioCategory";
import type { PortfolioTag } from "@/types/portfolio/tags/portfolioTag";
import type { PortfolioOption } from "@/types/portfolio/options/portfolioOption";
import type { PortfolioFormValues } from "@/components/portfolios/validations/portfolioSchema";

const PortfolioCreateDialog = lazy(() =>
    import("../PortfolioCreateDialog").then(module => ({ default: module.PortfolioCreateDialog }))
);

interface PortfolioSidebarTaxonomyProps {
    form?: UseFormReturn<PortfolioFormValues>;
    editMode: boolean;
    isFormApproach: boolean;
    portfolioId?: number | string;
    onCategoryToggle?: (category: PortfolioCategory) => void;
    onTagToggle?: (tag: PortfolioTag) => void;
    onOptionToggle?: (option: PortfolioOption) => void;
}

export function PortfolioSidebarTaxonomy({
    form,
    editMode,
    isFormApproach,
    portfolioId,
    onCategoryToggle,
    onTagToggle,
    onOptionToggle
}: PortfolioSidebarTaxonomyProps) {
    const { formState: { errors }, watch, setValue } = isFormApproach && form
        ? form
        : { formState: { errors: {} as any }, watch: null, setValue: null };

    const [categories, setCategories] = useState<PortfolioCategory[]>([]);
    const [tags, setTags] = useState<PortfolioTag[]>([]);
    const [options, setOptions] = useState<PortfolioOption[]>([]);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [loadingTags, setLoadingTags] = useState(true);
    const [loadingOptions, setLoadingOptions] = useState(true);
    const [showCategoryDialog, setShowCategoryDialog] = useState(false);
    const [showTagDialog, setShowTagDialog] = useState(false);
    const [showOptionDialog, setShowOptionDialog] = useState(false);

    const formSelectedCategories = isFormApproach ? (watch?.("selectedCategories" as any) || []) : [];
    const formSelectedTags = isFormApproach ? watch?.("selectedTags") || [] : [];
    const formSelectedOptions = isFormApproach ? watch?.("selectedOptions") || [] : [];

    useEffect(() => {
        portfolioApi.getCategories({ page: 1, size: 100 }).then(res => {
            setCategories(res.data || []);
            setLoadingCategories(false);
        });
        portfolioApi.getTags({ page: 1, size: 100 }).then(res => {
            setTags(res.data || []);
            setLoadingTags(false);
        });
        portfolioApi.getOptions({ page: 1, size: 100 }).then(res => {
            setOptions(res.data || []);
            setLoadingOptions(false);
        });
    }, []);

    const handleCategoryToggle = (category: PortfolioCategory) => {
        if (isFormApproach && setValue) {
            const current = watch?.("selectedCategories" as any) || [];
            if (current.some((c: PortfolioCategory) => c.id === category.id)) {
                setValue("selectedCategories" as any, current.filter((c: PortfolioCategory) => c.id !== category.id));
            } else {
                setValue("selectedCategories" as any, [...current, category]);
            }
        } else {
            onCategoryToggle?.(category);
        }
    };

    const handleTagToggle = (tag: PortfolioTag) => {
        if (isFormApproach && setValue) {
            const current = watch?.("selectedTags") || [];
            if (current.some((t: PortfolioTag) => t.id === tag.id)) {
                setValue("selectedTags", current.filter((t: PortfolioTag) => t.id !== tag.id));
            } else {
                setValue("selectedTags", [...current, tag]);
            }
        } else {
            onTagToggle?.(tag);
        }
    };

    const handleOptionToggle = (option: PortfolioOption) => {
        if (isFormApproach && setValue) {
            const current = watch?.("selectedOptions") || [];
            if (current.some((o: PortfolioOption) => o.id === option.id)) {
                setValue("selectedOptions", current.filter((o: PortfolioOption) => o.id !== option.id));
            } else {
                setValue("selectedOptions", [...current, option]);
            }
        } else {
            onOptionToggle?.(option);
        }
    };

    return (
        <div className="space-y-8">
            <MultiSelector
                label="دسته‌بندی‌ها"
                icon={<FolderOpen className="w-4 h-4 stroke-purple-2" />}
                items={categories.map(c => ({ ...c, title: c.name }))}
                selectedItems={formSelectedCategories.map((c: any) => ({ ...c, title: c.name }))}
                onToggle={(item) => handleCategoryToggle(item as any)}
                onRemove={(id) => handleCategoryToggle({ id: Number(id) } as any)}
                onAdd={() => setShowCategoryDialog(true)}
                loading={loadingCategories}
                disabled={!editMode}
                placeholder="دسته‌بندی‌ها را انتخاب کنید"
                colorTheme="purple"
            />
            {errors.selectedCategories?.message && (
                <div className="flex items-start gap-2 text-red-2 text-xs mt-1">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errors.selectedCategories?.message}</span>
                </div>
            )}

            <MultiSelector
                label="تگ‌ها"
                icon={<Tag className="w-4 h-4 stroke-indigo-2" />}
                items={tags.map(t => ({ ...t, title: t.name }))}
                selectedItems={formSelectedTags.map((t: any) => ({ ...t, title: t.name }))}
                onToggle={(item) => handleTagToggle(item as any)}
                onRemove={(id) => handleTagToggle({ id: Number(id) } as any)}
                onAdd={() => setShowTagDialog(true)}
                loading={loadingTags}
                disabled={!editMode}
                placeholder="تگ‌ها را انتخاب کنید"
                colorTheme="indigo"
            />
            {errors.selectedTags?.message && (
                <div className="flex items-start gap-2 text-red-2 text-xs mt-1">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errors.selectedTags?.message}</span>
                </div>
            )}

            <MultiSelector
                label="گزینه‌ها"
                icon={<Settings className="w-4 h-4 stroke-teal-2" />}
                items={options.map(o => ({ ...o, title: o.name }))}
                selectedItems={formSelectedOptions.map((o: any) => ({ ...o, title: o.name }))}
                onToggle={(item) => handleOptionToggle(item as any)}
                onRemove={(id) => handleOptionToggle({ id: Number(id) } as any)}
                onAdd={() => setShowOptionDialog(true)}
                loading={loadingOptions}
                disabled={!editMode}
                placeholder="گزینه‌ها را انتخاب کنید"
                colorTheme="teal"
            />
            {errors.selectedOptions?.message && (
                <div className="flex items-start gap-2 text-red-2 text-xs mt-1">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errors.selectedOptions?.message}</span>
                </div>
            )}

            {showCategoryDialog && (
                <Suspense fallback={null}>
                    <PortfolioCreateDialog
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
                            if (data.image_id) categoryData.image_id = data.image_id;
                            return await portfolioApi.createCategory(categoryData);
                        }}
                        onSuccess={(created) => {
                            setCategories(prev => [...prev, created]);
                            handleCategoryToggle(created);
                        }}
                        refetchList={() => portfolioApi.getCategories({ page: 1, size: 100 }).then(res => setCategories(res.data || []))}
                        context="portfolio"
                        contextId={portfolioId}
                    />
                </Suspense>
            )}

            {showTagDialog && (
                <Suspense fallback={null}>
                    <PortfolioCreateDialog
                        open={showTagDialog}
                        onOpenChange={setShowTagDialog}
                        type="tag"
                        onSubmit={async (data) => await portfolioApi.createTag({
                            name: data.name,
                            slug: data.slug,
                            is_public: data.is_public ?? true,
                            is_active: data.is_active ?? true
                        })}
                        onSuccess={(created) => {
                            setTags(prev => [...prev, created]);
                            handleTagToggle(created);
                        }}
                        refetchList={() => portfolioApi.getTags({ page: 1, size: 100 }).then(res => setTags(res.data || []))}
                        context="portfolio"
                        contextId={portfolioId}
                    />
                </Suspense>
            )}

            {showOptionDialog && (
                <Suspense fallback={null}>
                    <PortfolioCreateDialog
                        open={showOptionDialog}
                        onOpenChange={setShowOptionDialog}
                        type="option"
                        onSubmit={async (data) => await portfolioApi.createOption({
                            name: data.name,
                            slug: data.slug,
                        })}
                        onSuccess={(created) => {
                            setOptions(prev => [...prev, created]);
                            handleOptionToggle(created);
                        }}
                        refetchList={() => portfolioApi.getOptions({ page: 1, size: 100 }).then(res => setOptions(res.data || []))}
                        context="portfolio"
                        contextId={portfolioId}
                    />
                </Suspense>
            )}
        </div>
    );
}
