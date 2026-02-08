
import { useState, useEffect } from "react";
import { Settings } from "lucide-react";
import { realEstateApi } from "@/api/real-estate";
import { MultiSelector } from "@/components/shared/MultiSelector";
import type { PropertyFeature } from "@/types/real_estate/feature/realEstateFeature";

interface PropertyFeaturesProps {
    selectedFeatures: PropertyFeature[];
    onToggle: (feature: PropertyFeature) => void;
    onRemove: (featureId: number) => void;
    editMode: boolean;
}

export function PropertyFeatures({ selectedFeatures, onToggle, onRemove, editMode }: PropertyFeaturesProps) {
    const [features, setFeatures] = useState<PropertyFeature[]>([]);
    const [loadingFeatures, setLoadingFeatures] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const featuresResponse = await realEstateApi.getFeatures({ page: 1, size: 100, is_active: true });
                setFeatures(featuresResponse.data || []);
            } finally {
                setLoadingFeatures(false);
            }
        };
        fetchData();
    }, []);

    return (
        <MultiSelector
            label="ویژگی‌ها"
            icon={<Settings className="w-4 h-4 stroke-teal-2" />}
            items={features}
            selectedItems={selectedFeatures}
            onToggle={onToggle}
            onRemove={(id) => onRemove(Number(id))}
            loading={loadingFeatures}
            disabled={!editMode}
            placeholder="ویژگی‌ها را انتخاب کنید"
            colorTheme="teal"
        />
    );
}
