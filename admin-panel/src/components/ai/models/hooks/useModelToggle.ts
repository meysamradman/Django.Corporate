import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { aiApi } from '@/api/ai/ai';
import { showSuccess, showError } from '@/core/toast';

interface ConfirmDialog {
    open: boolean;
    activeModelName: string;
    newModelName: string;
    onConfirm: () => void;
}

export function useModelToggle(capability: 'chat' | 'content' | 'image' | 'audio') {
    const queryClient = useQueryClient();
    const [confirmDialog, setConfirmDialog] = useState<ConfirmDialog>({
        open: false,
        activeModelName: '',
        newModelName: '',
        onConfirm: () => {},
    });

    const toggleModelMutation = useMutation({
        mutationFn: async ({ 
            modelId, 
            isActive, 
            isOpenRouter
        }: { 
            modelId: number | string; 
            isActive: boolean; 
            isOpenRouter?: boolean; 
        }) => {
            if (isOpenRouter) {
                throw new Error('مدل‌های OpenRouter از API می‌آیند و قابل فعال/غیرفعال کردن نیستند');
            }
            
            const response = await aiApi.models.update(modelId as number, { is_active: isActive } as any);
            if (response.metaData.status !== 'success') {
                throw new Error(response.metaData.message || 'خطا در به‌روزرسانی مدل');
            }
            return response.data;
        },
        onMutate: async ({ modelId, isActive }) => {
            await queryClient.cancelQueries({ queryKey: ['ai-models', capability] });
            const previousModels = queryClient.getQueryData(['ai-models', capability]);

            queryClient.setQueryData(['ai-models', capability], (old: any) => {
                if (!old) return old;
                return old.map((model: any) =>
                    model.id === modelId ? { ...model, is_active: isActive } : model
                );
            });

            return { previousModels };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ai-models', capability] });
            showSuccess('وضعیت مدل با موفقیت تغییر کرد');
        },
        onError: (error: any, variables, context) => {
            if (context?.previousModels) {
                queryClient.setQueryData(['ai-models', capability], context.previousModels);
            }
            showError(error?.message || 'خطا در تغییر وضعیت مدل');
        },
    });

    const handleToggleModel = async (
        modelId: number | string, 
        currentStatus: boolean, 
        isOpenRouter?: boolean, 
        providerSlug?: string, 
        modelName?: string
    ) => {
        if (isOpenRouter) {
            showError('مدل‌های OpenRouter از API می‌آیند و قابل فعال/غیرفعال کردن نیستند');
            return;
        }
        
        const isActivating = !currentStatus;
        
        if (isActivating && providerSlug) {
            try {
                const activeModelResponse = await aiApi.models.getActiveModel(providerSlug, capability);
                if (activeModelResponse.data && activeModelResponse.data.id !== modelId) {
                    const activeModelName = activeModelResponse.data.display_name || activeModelResponse.data.name;
                    setConfirmDialog({
                        open: true,
                        activeModelName,
                        newModelName: modelName || 'مدل جدید',
                        onConfirm: () => {
                            setConfirmDialog(prev => ({ ...prev, open: false }));
                            toggleModelMutation.mutate({
                                modelId,
                                isActive: isActivating,
                                isOpenRouter,
                                providerSlug,
                            });
                        },
                    });
                    return;
                }
            } catch {
              // Silently handle error - continue with mutation
            }
        }
        
        toggleModelMutation.mutate({
            modelId,
            isActive: isActivating,
            isOpenRouter,
            providerSlug,
        });
    };

    const closeConfirmDialog = () => {
        setConfirmDialog(prev => ({ ...prev, open: false }));
    };

    return {
        confirmDialog,
        closeConfirmDialog,
        handleToggleModel,
        isSaving: toggleModelMutation.isPending,
    };
}
