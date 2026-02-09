
import { useState, useEffect, lazy, Suspense } from "react";
import { Settings } from "lucide-react";
import { realEstateApi } from "@/api/real-estate";
import { MultiSelector } from "@/components/shared/MultiSelector";
import type { PropertyFeature } from "@/types/real_estate/feature/realEstateFeature";

const RealEstateCreateDialog = lazy(() =>
    import("../dialogs/RealEstateCreateDialog").then(module => ({ default: module.RealEstateCreateDialog }))
);

interface RealEstateFeaturesProps {
    selectedFeatures: PropertyFeature[];
    onToggle: (feature: PropertyFeature) => void;
    onRemove: (featureId: number) => void;
    editMode: boolean;
}

export function RealEstateFeatures({ selectedFeatures, onToggle, onRemove, editMode }: RealEstateFeaturesProps) {
    const [features, setFeatures] = useState<PropertyFeature[]>([]);
    const [loadingFeatures, setLoadingFeatures] = useState(true);
    const [showAddDialog, setShowAddDialog] = useState(false);

    const fetchFeatures = async () => {
        try {
            const featuresResponse = await realEstateApi.getFeatures({ page: 1, size: 100, is_active: true });
            setFeatures(featuresResponse.data || []);
        } finally {
            setLoadingFeatures(false);
        }
    };

    useEffect(() => {
        fetchFeatures();
    }, []);

    return (
        <>
            <MultiSelector
                label="ویژگی‌ها"
                icon={<Settings className="w-4 h-4 stroke-teal-2" />}
                items={features}
                selectedItems={selectedFeatures}
                onToggle={onToggle}
                onRemove={(id) => onRemove(Number(id))}
                onAdd={() => setShowAddDialog(true)}
                loading={loadingFeatures}
                disabled={!editMode}
                placeholder="ویژگی‌ها را انتخاب کنید"
                colorTheme="teal"
            />

            {showAddDialog && (
                <Suspense fallback={null}>
                    <RealEstateCreateDialog
                        open={showAddDialog}
                        onOpenChange={setShowAddDialog}
                        type="feature"
                        onSubmit={async (data) => await realEstateApi.createFeature(data)}
                        onSuccess={(created) => {
                            setFeatures(prev => [...prev, created]);
                            onToggle(created);
                        }}
                        refetchList={fetchFeatures}
                    />
                </Suspense>
            )}
        </>
    );
}
