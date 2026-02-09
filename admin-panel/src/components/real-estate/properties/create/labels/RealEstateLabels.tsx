
import { useState, useEffect, lazy, Suspense } from "react";
import { FolderOpen } from "lucide-react";
import { realEstateApi } from "@/api/real-estate";
import { MultiSelector } from "@/components/shared/MultiSelector";
import type { PropertyLabel } from "@/types/real_estate/label/realEstateLabel";

const PropertyLabelSide = lazy(() =>
    import("../../../labels/PropertyLabelSide").then(module => ({ default: module.PropertyLabelSide }))
);

interface RealEstateLabelsProps {
    selectedLabels: PropertyLabel[];
    onToggle: (label: PropertyLabel) => void;
    onRemove: (labelId: number) => void;
    editMode: boolean;
}

export function RealEstateLabels({ selectedLabels, onToggle, onRemove, editMode }: RealEstateLabelsProps) {
    const [labels, setLabels] = useState<PropertyLabel[]>([]);
    const [loadingLabels, setLoadingLabels] = useState(true);
    const [showAddDialog, setShowAddDialog] = useState(false);

    const fetchLabels = async () => {
        try {
            const labelsResponse = await realEstateApi.getLabels({ page: 1, size: 100, is_active: true });
            setLabels(labelsResponse.data || []);
        } finally {
            setLoadingLabels(false);
        }
    };

    useEffect(() => {
        fetchLabels();
    }, []);

    return (
        <>
            <MultiSelector
                label="برچسب‌ها"
                icon={<FolderOpen className="w-4 h-4 stroke-purple-2" />}
                items={labels}
                selectedItems={selectedLabels}
                onToggle={onToggle}
                onRemove={(id) => onRemove(Number(id))}
                onAdd={() => setShowAddDialog(true)}
                loading={loadingLabels}
                disabled={!editMode}
                placeholder="برچسب‌ها را انتخاب کنید"
                colorTheme="purple"
            />

            <Suspense fallback={null}>
                <PropertyLabelSide
                    isOpen={showAddDialog}
                    onClose={() => setShowAddDialog(false)}
                    onSuccess={() => {
                        fetchLabels();
                    }}
                />
            </Suspense>
        </>
    );
}
