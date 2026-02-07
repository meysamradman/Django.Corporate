import { useState, useCallback } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { PropertyLabel } from "@/types/real_estate/label/realEstateLabel";
import type { PropertyTag } from "@/types/real_estate/tags/realEstateTag";
import type { PropertyFeature } from "@/types/real_estate/feature/realEstateFeature";
import type { PropertyFormValues } from "../validations/propertySchema";



interface UseRealEstateTaxonomyProps {
    form: UseFormReturn<PropertyFormValues>;
}

export function useRealEstateTaxonomy({ form }: UseRealEstateTaxonomyProps) {
    const [selectedLabels, setSelectedLabels] = useState<PropertyLabel[]>([]);
    const [selectedTags, setSelectedTags] = useState<PropertyTag[]>([]);
    const [selectedFeatures, setSelectedFeatures] = useState<PropertyFeature[]>([]);

    const handleLabelToggle = useCallback((label: PropertyLabel) => {
        setSelectedLabels(prev => {
            const newLabels = prev.find(l => l.id === label.id)
                ? prev.filter(l => l.id !== label.id)
                : [...prev, label];
            form.setValue("labels_ids", newLabels.map(l => l.id), { shouldValidate: false, shouldDirty: true });
            return newLabels;
        });
    }, [form]);

    const handleLabelRemove = useCallback((labelId: number) => {
        setSelectedLabels(prev => {
            const newLabels = prev.filter(l => l.id !== labelId);
            form.setValue("labels_ids", newLabels.map(l => l.id), { shouldValidate: false, shouldDirty: true });
            return newLabels;
        });
    }, [form]);

    const handleTagToggle = useCallback((tag: PropertyTag) => {
        setSelectedTags(prev => {
            const newTags = prev.find(t => t.id === tag.id)
                ? prev.filter(t => t.id !== tag.id)
                : [...prev, tag];
            form.setValue("tags_ids", newTags.map(t => t.id), { shouldValidate: false, shouldDirty: true });
            return newTags;
        });
    }, [form]);

    const handleTagRemove = useCallback((tagId: number) => {
        setSelectedTags(prev => {
            const newTags = prev.filter(t => t.id !== tagId);
            form.setValue("tags_ids", newTags.map(t => t.id), { shouldValidate: false, shouldDirty: true });
            return newTags;
        });
    }, [form]);

    const handleFeatureToggle = useCallback((feature: PropertyFeature) => {
        setSelectedFeatures(prev => {
            const newFeatures = prev.find(f => f.id === feature.id)
                ? prev.filter(f => f.id !== feature.id)
                : [...prev, feature];
            form.setValue("features_ids", newFeatures.map(f => f.id), { shouldValidate: false, shouldDirty: true });
            return newFeatures;
        });
    }, [form]);

    const handleFeatureRemove = useCallback((featureId: number) => {
        setSelectedFeatures(prev => {
            const newFeatures = prev.filter(f => f.id !== featureId);
            form.setValue("features_ids", newFeatures.map(f => f.id), { shouldValidate: false, shouldDirty: true });
            return newFeatures;
        });
    }, [form]);

    return {
        selectedLabels,
        setSelectedLabels,
        selectedTags,
        setSelectedTags,
        selectedFeatures,
        setSelectedFeatures,
        handleLabelToggle,
        handleLabelRemove,
        handleTagToggle,
        handleTagRemove,
        handleFeatureToggle,
        handleFeatureRemove
    };
}
