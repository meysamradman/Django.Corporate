
import { Suspense, lazy, useState } from "react";
import { Settings, AlertCircle } from "lucide-react";
import { MultiSelector } from "@/components/shared/MultiSelector";
import { portfolioApi } from "@/api/portfolios/portfolios";
import type { PortfolioOption } from "@/types/portfolio/options/portfolioOption";

const PortfolioOptionSide = lazy(() =>
    import("../../../options/PortfolioOptionSide").then(module => ({ default: module.PortfolioOptionSide }))
);

interface PortfolioOptionsProps {
    options: PortfolioOption[];
    setOptions: React.Dispatch<React.SetStateAction<PortfolioOption[]>>;
    loadingOptions: boolean;
    selectedOptions: PortfolioOption[];
    editMode: boolean;
    errors: any;
    onToggle: (option: PortfolioOption) => void;
}

export function PortfolioOptions({
    options,
    setOptions,
    loadingOptions,
    selectedOptions,
    editMode,
    errors,
    onToggle,
}: PortfolioOptionsProps) {
    const [showOptionDialog, setShowOptionDialog] = useState(false);

    return (
        <div className="space-y-4">
            <MultiSelector
                label="گزینه‌ها"
                icon={<Settings className="w-4 h-4 stroke-teal-2" />}
                items={options.map(o => ({ ...o, title: o.name }))}
                selectedItems={selectedOptions.map((o: any) => ({ ...o, title: o.name }))}
                onToggle={(item) => onToggle(item as any)}
                onRemove={(id) => onToggle({ id: Number(id) } as any)}
                onAdd={() => setShowOptionDialog(true)}
                loading={loadingOptions}
                disabled={!editMode}
                placeholder="گزینه‌ها را انتخاب کنید"
                colorTheme="teal"
            />
            {errors?.selectedOptions?.message && (
                <div className="flex items-start gap-2 text-red-2 text-xs mt-1">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errors.selectedOptions?.message}</span>
                </div>
            )}

            <Suspense fallback={null}>
                <PortfolioOptionSide
                    isOpen={showOptionDialog}
                    onClose={() => setShowOptionDialog(false)}
                    onSuccess={() => {
                        portfolioApi.getOptions({ page: 1, size: 100 }).then(res => {
                            setOptions(res.data || []);
                        });
                    }}
                />
            </Suspense>
        </div>
    );
}
