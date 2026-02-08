
import { useState, useEffect } from "react";
import { FolderOpen } from "lucide-react";
import { realEstateApi } from "@/api/real-estate";
import { MultiSelector } from "@/components/shared/MultiSelector";
import type { PropertyLabel } from "@/types/real_estate/label/realEstateLabel";

interface PropertyLabelsProps {
    selectedLabels: PropertyLabel[];
    onToggle: (label: PropertyLabel) => void;
    onRemove: (labelId: number) => void;
    editMode: boolean;
}

export function PropertyLabels({ selectedLabels, onToggle, onRemove, editMode }: PropertyLabelsProps) {
    const [labels, setLabels] = useState<PropertyLabel[]>([]);
    const [loadingLabels, setLoadingLabels] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const labelsResponse = await realEstateApi.getLabels({ page: 1, size: 100, is_active: true });
                setLabels(labelsResponse.data || []);
            } finally {
                setLoadingLabels(false);
            }
        };
        fetchData();
    }, []);

    return (
        <MultiSelector
            label="برچسب‌ها"
            icon={<FolderOpen className="w-4 h-4 stroke-purple-2" />}
            items={labels}
            selectedItems={selectedLabels}
            onToggle={onToggle}
            onRemove={(id) => onRemove(Number(id))}
            loading={loadingLabels}
            disabled={!editMode}
            placeholder="برچسب‌ها را انتخاب کنید"
            colorTheme="purple"
        />
    );
}
