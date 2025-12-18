import { useState, useMemo } from 'react';

const MODELS_PER_PAGE = 24;
const PAGINATION_THRESHOLD = 24;

export function useModelPagination(models: any[]) {
    const [currentPage, setCurrentPage] = useState<Record<string, number>>({});
    const [expandedModels, setExpandedModels] = useState<Set<number | string>>(new Set());

    const groupedModels = useMemo(() => {
        const groups: Record<string, any[]> = {};
        models.forEach((model) => {
            const providerName = model.provider_name || model.provider?.name || 'نامشخص';
            if (!groups[providerName]) {
                groups[providerName] = [];
            }
            groups[providerName].push(model);
        });
        return groups;
    }, [models]);

    const paginatedGroups = useMemo(() => {
        const result: Record<string, { 
            models: any[]; 
            totalPages: number; 
            currentPage: number; 
            needsPagination: boolean;
        }> = {};
        
        Object.entries(groupedModels).forEach(([providerName, providerModels]) => {
            const needsPagination = providerModels.length > PAGINATION_THRESHOLD;
            
            if (needsPagination) {
                const page = currentPage[providerName] || 1;
                const totalPages = Math.ceil(providerModels.length / MODELS_PER_PAGE);
                const startIndex = (page - 1) * MODELS_PER_PAGE;
                const endIndex = startIndex + MODELS_PER_PAGE;
                const paginatedModels = providerModels.slice(startIndex, endIndex);
                
                result[providerName] = {
                    models: paginatedModels,
                    totalPages,
                    currentPage: page,
                    needsPagination: true,
                };
            } else {
                result[providerName] = {
                    models: providerModels,
                    totalPages: 1,
                    currentPage: 1,
                    needsPagination: false,
                };
            }
        });
        
        return result;
    }, [groupedModels, currentPage]);

    const handlePageChange = (providerName: string, page: number) => {
        setCurrentPage((prev) => ({
            ...prev,
            [providerName]: page,
        }));
        const element = document.getElementById(`provider-${providerName}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const toggleExpand = (modelId: number | string) => {
        setExpandedModels((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(modelId)) {
                newSet.delete(modelId);
            } else {
                newSet.add(modelId);
            }
            return newSet;
        });
    };

    return {
        groupedModels,
        paginatedGroups,
        expandedModels,
        handlePageChange,
        toggleExpand,
    };
}
