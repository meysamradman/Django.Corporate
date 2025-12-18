"use client";

import React from 'react';
import { useModelToggle, useModelPagination } from './hooks';
import { ProviderSection, ConfirmationDialog } from './components';

interface ModelSelectorProps {
    models: any[];
    capability: 'chat' | 'content' | 'image' | 'audio';
}

export function ModelSelector({ models, capability }: ModelSelectorProps) {
    // Custom hooks
    const {
        confirmDialog,
        closeConfirmDialog,
        handleToggleModel,
        isSaving,
    } = useModelToggle(capability);

    const {
        groupedModels,
        paginatedGroups,
        expandedModels,
        handlePageChange,
        toggleExpand,
    } = useModelPagination(models);

    return (
        <div className="space-y-6">
            {Object.entries(groupedModels).map(([providerName, allProviderModels]) => {
                const { models: paginatedModels, totalPages, currentPage: page, needsPagination } = paginatedGroups[providerName] || { 
                    models: allProviderModels, 
                    totalPages: 1, 
                    currentPage: 1,
                    needsPagination: false
                };
                
                return (
                    <ProviderSection
                        key={providerName}
                        providerName={providerName}
                        allModels={allProviderModels}
                        paginatedModels={paginatedModels}
                        totalPages={totalPages}
                        currentPage={page}
                        needsPagination={needsPagination}
                        capability={capability}
                        expandedModels={expandedModels}
                        isSaving={isSaving}
                        onToggleModel={handleToggleModel}
                        onToggleExpand={toggleExpand}
                        onPageChange={handlePageChange}
                    />
                );
            })}
            
            {/* Confirmation Dialog */}
            <ConfirmationDialog
                open={confirmDialog.open}
                activeModelName={confirmDialog.activeModelName}
                newModelName={confirmDialog.newModelName}
                onConfirm={confirmDialog.onConfirm}
                onClose={closeConfirmDialog}
            />
        </div>
    );
}
