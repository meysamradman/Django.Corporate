
import { Suspense, lazy, useState } from "react";
import { FolderOpen, AlertCircle } from "lucide-react";
import { MultiSelector } from "@/components/shared/MultiSelector";
import { portfolioApi } from "@/api/portfolios/portfolios";
import type { PortfolioCategory } from "@/types/portfolio/category/portfolioCategory";

const PortfolioCategorySide = lazy(() =>
    import("../../../categories/PortfolioCategorySide").then(module => ({ default: module.PortfolioCategorySide }))
);

interface PortfolioCategoriesProps {
    categories: PortfolioCategory[];
    setCategories: React.Dispatch<React.SetStateAction<PortfolioCategory[]>>;
    loadingCategories: boolean;
    selectedCategories: PortfolioCategory[];
    editMode: boolean;
    errors: any;
    onToggle: (category: PortfolioCategory) => void;
}

export function PortfolioCategories({
    categories,
    setCategories,
    loadingCategories,
    selectedCategories,
    editMode,
    errors,
    onToggle,
}: PortfolioCategoriesProps) {
    const [showCategoryDialog, setShowCategoryDialog] = useState(false);

    return (
        <div className="space-y-4">
            <MultiSelector
                label="دسته‌بندی‌ها"
                icon={<FolderOpen className="w-4 h-4 stroke-purple-2" />}
                items={categories.map(c => ({ ...c, title: c.name }))}
                selectedItems={selectedCategories.map((c: any) => ({ ...c, title: c.name }))}
                onToggle={(item) => onToggle(item as any)}
                onRemove={(id) => onToggle({ id: Number(id) } as any)}
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
                <PortfolioCategorySide
                    isOpen={showCategoryDialog}
                    onClose={() => setShowCategoryDialog(false)}
                    onSuccess={() => {
                        portfolioApi.getCategories({ page: 1, size: 100 }).then(res => {
                            setCategories(res.data || []);
                        });
                    }}
                />
            </Suspense>
        </div>
    );
}
