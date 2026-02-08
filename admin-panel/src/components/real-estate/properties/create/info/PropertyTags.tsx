
import { useState, useEffect } from "react";
import { Tag } from "lucide-react";
import { realEstateApi } from "@/api/real-estate";
import { MultiSelector } from "@/components/shared/MultiSelector";
import type { PropertyTag } from "@/types/real_estate/tags/realEstateTag";

interface PropertyTagsProps {
    selectedTags: PropertyTag[];
    onToggle: (tag: PropertyTag) => void;
    onRemove: (tagId: number) => void;
    editMode: boolean;
}

export function PropertyTags({ selectedTags, onToggle, onRemove, editMode }: PropertyTagsProps) {
    const [tags, setTags] = useState<PropertyTag[]>([]);
    const [loadingTags, setLoadingTags] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const tagsResponse = await realEstateApi.getTags({ page: 1, size: 100, is_active: true, is_public: true });
                setTags(tagsResponse.data || []);
            } finally {
                setLoadingTags(false);
            }
        };
        fetchData();
    }, []);

    return (
        <MultiSelector
            label="تگ‌ها"
            icon={<Tag className="w-4 h-4 stroke-indigo-2" />}
            items={tags}
            selectedItems={selectedTags}
            onToggle={onToggle}
            onRemove={(id) => onRemove(Number(id))}
            loading={loadingTags}
            disabled={!editMode}
            placeholder="تگ‌ها را انتخاب کنید"
            colorTheme="indigo"
        />
    );
}
