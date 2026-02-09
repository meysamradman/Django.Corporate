
import { useState, useEffect, lazy, Suspense } from "react";
import { Tag } from "lucide-react";
import { realEstateApi } from "@/api/real-estate";
import { MultiSelector } from "@/components/shared/MultiSelector";
import type { PropertyTag } from "@/types/real_estate/tags/realEstateTag";

const RealEstateCreateDialog = lazy(() =>
    import("../dialogs/RealEstateCreateDialog").then(module => ({ default: module.RealEstateCreateDialog }))
);

interface RealEstateTagsProps {
    selectedTags: PropertyTag[];
    onToggle: (tag: PropertyTag) => void;
    onRemove: (tagId: number) => void;
    editMode: boolean;
}

export function RealEstateTags({ selectedTags, onToggle, onRemove, editMode }: RealEstateTagsProps) {
    const [tags, setTags] = useState<PropertyTag[]>([]);
    const [loadingTags, setLoadingTags] = useState(true);
    const [showAddDialog, setShowAddDialog] = useState(false);

    const fetchTags = async () => {
        try {
            const tagsResponse = await realEstateApi.getTags({ page: 1, size: 100, is_active: true, is_public: true });
            setTags(tagsResponse.data || []);
        } finally {
            setLoadingTags(false);
        }
    };

    useEffect(() => {
        fetchTags();
    }, []);

    return (
        <>
            <MultiSelector
                label="تگ‌ها"
                icon={<Tag className="w-4 h-4 stroke-indigo-2" />}
                items={tags}
                selectedItems={selectedTags}
                onToggle={onToggle}
                onRemove={(id) => onRemove(Number(id))}
                onAdd={() => setShowAddDialog(true)}
                loading={loadingTags}
                disabled={!editMode}
                placeholder="تگ‌ها را انتخاب کنید"
                colorTheme="indigo"
            />

            {showAddDialog && (
                <Suspense fallback={null}>
                    <RealEstateCreateDialog
                        open={showAddDialog}
                        onOpenChange={setShowAddDialog}
                        type="tag"
                        onSubmit={async (data) => await realEstateApi.createTag(data)}
                        onSuccess={(created) => {
                            setTags(prev => [...prev, created]);
                            onToggle(created);
                        }}
                        refetchList={fetchTags}
                    />
                </Suspense>
            )}
        </>
    );
}
