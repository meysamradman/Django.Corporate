
import { Suspense, lazy, useState } from "react";
import { FolderOpen, AlertCircle } from "lucide-react";
import { MultiSelector } from "@/components/shared/MultiSelector";
import { blogApi } from "@/api/blogs/blogs";
import type { BlogCategory } from "@/types/blog/category/blogCategory";

const BlogCategorySide = lazy(() =>
    import("../../../categories/BlogCategorySide").then(module => ({ default: module.BlogCategorySide }))
);

interface BlogCategoriesProps {
    categories: BlogCategory[];
    setCategories: React.Dispatch<React.SetStateAction<BlogCategory[]>>;
    loadingCategories: boolean;
    selectedCategories: BlogCategory[];
    editMode: boolean;
    errors: any;
    onCategoryToggle: (category: BlogCategory) => void;
    onCategoryRemove: (categoryId: number) => void;
}

export function BlogCategories({
    categories,
    setCategories,
    loadingCategories,
    selectedCategories,
    editMode,
    errors,
    onCategoryToggle,
    onCategoryRemove,
}: BlogCategoriesProps) {
    const [showCategoryDialog, setShowCategoryDialog] = useState(false);

    return (
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
            {errors?.selectedCategories?.message && (
                <div className="flex items-start gap-2 text-red-2 text-xs mt-1">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errors.selectedCategories?.message}</span>
                </div>
            )}

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
            </Suspense>
        </div>
    );
}
