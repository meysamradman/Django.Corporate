import { Suspense, lazy } from "react";
import { FolderOpen, Tag, AlertCircle } from "lucide-react";
import { MultiSelector } from "@/components/shared/MultiSelector";
import { blogApi } from "@/api/blogs/blogs";
import type { BlogCategory } from "@/types/blog/category/blogCategory";
import type { BlogTag } from "@/types/blog/tags/blogTag";

const BlogCategorySide = lazy(() =>
    import("../../../categories/BlogCategorySide").then(module => ({ default: module.BlogCategorySide }))
);

const BlogTagSide = lazy(() =>
    import("../../../tags/BlogTagSide").then(module => ({ default: module.BlogTagSide }))
);

interface BlogSidebarTaxonomyProps {
    categories: BlogCategory[];
    setCategories: React.Dispatch<React.SetStateAction<BlogCategory[]>>;
    tags: BlogTag[];
    setTags: React.Dispatch<React.SetStateAction<BlogTag[]>>;
    loadingCategories: boolean;
    loadingTags: boolean;
    selectedCategories: BlogCategory[];
    selectedTags: BlogTag[];
    editMode: boolean;
    isFormApproach: boolean;
    errors: any;
    blogId?: number | string;
    showCategoryDialog: boolean;
    setShowCategoryDialog: (show: boolean) => void;
    showTagDialog: boolean;
    setShowTagDialog: (show: boolean) => void;
    onCategoryToggle: (category: BlogCategory) => void;
    onCategoryRemove: (categoryId: number) => void;
    onTagToggle: (tag: BlogTag) => void;
    onTagRemove: (tagId: number) => void;
}

export function BlogSidebarTaxonomy({
    categories,
    setCategories,
    tags,
    setTags,
    loadingCategories,
    loadingTags,
    selectedCategories,
    selectedTags,
    editMode,
    errors,
    showCategoryDialog,
    setShowCategoryDialog,
    showTagDialog,
    setShowTagDialog,
    onCategoryToggle,
    onCategoryRemove,
    onTagToggle,
    onTagRemove
}: BlogSidebarTaxonomyProps) {
    return (
        <div className="space-y-8">
            <div className="space-y-4">
                <MultiSelector
                    label="دسته‌بندی‌ها"
                    icon={<FolderOpen className="w-4 h-4 stroke-purple-2" />}
                    items={categories.map(c => ({ ...c, title: c.name }))}
                    selectedItems={selectedCategories.map((c: any) => ({ ...c, title: c.name }))}
                    onToggle={(item) => {
                        const { title, ...rest } = item as any;
                        onCategoryToggle(rest as BlogCategory);
                    }}
                    onRemove={(id) => onCategoryRemove(Number(id))}
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
            </div>

            <div className="space-y-4">
                <MultiSelector
                    label="تگ‌ها"
                    icon={<Tag className="w-4 h-4 stroke-indigo-2" />}
                    items={tags.map(t => ({ ...t, title: t.name }))}
                    selectedItems={selectedTags.map((t: any) => ({ ...t, title: t.name }))}
                    onToggle={(item) => {
                        const { title, ...rest } = item as any;
                        onTagToggle(rest as BlogTag);
                    }}
                    onRemove={(id) => onTagRemove(Number(id))}
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
            </div>

            <Suspense fallback={null}>
                <BlogCategorySide
                    isOpen={showCategoryDialog}
                    onClose={() => setShowCategoryDialog(false)}
                    onSuccess={() => {
                        blogApi.getCategories({ page: 1, size: 100 }).then(response => {
                            setCategories(response.data || []);
                        });
                    }}
                />
                <BlogTagSide
                    isOpen={showTagDialog}
                    onClose={() => setShowTagDialog(false)}
                    onSuccess={() => {
                        blogApi.getTags({ page: 1, size: 100 }).then(response => {
                            setTags(response.data || []);
                        });
                    }}
                />
            </Suspense>
        </div>
    );
}
