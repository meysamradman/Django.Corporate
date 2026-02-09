
import { Suspense, lazy, useState } from "react";
import { Tag, AlertCircle } from "lucide-react";
import { MultiSelector } from "@/components/shared/MultiSelector";
import { blogApi } from "@/api/blogs/blogs";
import type { BlogTag } from "@/types/blog/tags/blogTag";

const BlogTagSide = lazy(() =>
    import("../../../tags/BlogTagSide").then(module => ({ default: module.BlogTagSide }))
);

interface BlogTagsProps {
    tags: BlogTag[];
    setTags: React.Dispatch<React.SetStateAction<BlogTag[]>>;
    loadingTags: boolean;
    selectedTags: BlogTag[];
    editMode: boolean;
    errors: any;
    onTagToggle: (tag: BlogTag) => void;
    onTagRemove: (tagId: number) => void;
}

export function BlogTags({
    tags,
    setTags,
    loadingTags,
    selectedTags,
    editMode,
    errors,
    onTagToggle,
    onTagRemove,
}: BlogTagsProps) {
    const [showTagDialog, setShowTagDialog] = useState(false);

    return (
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
            {errors?.selectedTags?.message && (
                <div className="flex items-start gap-2 text-red-2 text-xs mt-1">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errors.selectedTags?.message}</span>
                </div>
            )}

            <Suspense fallback={null}>
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
