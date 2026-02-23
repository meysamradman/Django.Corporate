
import { Suspense, lazy, useState } from "react";
import { Tag, AlertCircle } from "lucide-react";
import { MultiSelector } from "@/components/shared/MultiSelector";
import { portfolioApi } from "@/api/portfolios/portfolios";
import type { PortfolioTag } from "@/types/portfolio/tags/portfolioTag";

const PortfolioTagSide = lazy(() =>
    import("../../../tags/PortfolioTagSide").then(module => ({ default: module.PortfolioTagSide }))
);

interface PortfolioTagsProps {
    tags: PortfolioTag[];
    setTags: React.Dispatch<React.SetStateAction<PortfolioTag[]>>;
    loadingTags: boolean;
    selectedTags: PortfolioTag[];
    editMode: boolean;
    errors: any;
    onToggle: (tag: PortfolioTag) => void;
}

export function PortfolioTags({
    tags,
    setTags,
    loadingTags,
    selectedTags,
    editMode,
    errors,
    onToggle,
}: PortfolioTagsProps) {
    const [showTagDialog, setShowTagDialog] = useState(false);

    return (
        <div className="space-y-4">
            <MultiSelector
                label="تگ‌ها"
                icon={<Tag className="w-4 h-4 stroke-indigo-2" />}
                items={tags.map(t => ({ ...t, title: t.name }))}
                selectedItems={selectedTags.map((t: any) => ({ ...t, title: t.name }))}
                onToggle={(item) => onToggle(item as any)}
                onRemove={(id) => onToggle({ id: Number(id) } as any)}
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
                <PortfolioTagSide
                    isOpen={showTagDialog}
                    onClose={() => setShowTagDialog(false)}
                    onSuccess={() => {
                        portfolioApi.getTags({ page: 1, size: 100 }).then(res => {
                            setTags(res.data || []);
                        });
                    }}
                />
            </Suspense>
        </div>
    );
}
