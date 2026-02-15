import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, type FieldValues, type DefaultValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { showError, showSuccess, hasFieldErrors, extractFieldErrors } from "@/core/toast";
import { msg } from "@/core/messages";
import { generateSlug } from '@/core/slug/generate';
import type { Media } from "@/types/shared/media";

interface UseTaxonomyFormProps<T extends FieldValues> {
    id?: string;
    isEditMode: boolean;
    schema: z.ZodType<T>;
    defaultValues: DefaultValues<T>;
    fetchQueryKey?: any[];
    fetchQueryFn?: () => Promise<any>;
    createMutationFn: (data: any) => Promise<any>;
    updateMutationFn: (id: number, data: any) => Promise<any>;
    invalidateQueryKeys: any[][];
    onSuccessRedirect: string;
    onSuccess?: () => void;
    itemLabel: string;
    autoSlug?: boolean;
    titleFieldName?: string;
    mapFieldErrorKey?: (field: string) => string;
    onValidationMessage?: (message: string | null) => void;
    showFieldErrorToast?: boolean;
    showClientValidationToast?: boolean;
}

export function useRealEstateTaxonomyForm<T extends FieldValues>({
    id,
    isEditMode,
    schema,
    defaultValues,
    fetchQueryKey,
    fetchQueryFn,
    createMutationFn,
    updateMutationFn,
    invalidateQueryKeys,
    onSuccessRedirect,
    onSuccess,
    itemLabel,
    autoSlug = true,
    titleFieldName = "title",
    mapFieldErrorKey,
    onValidationMessage,
    showFieldErrorToast = true,
    showClientValidationToast = true,
}: UseTaxonomyFormProps<T>) {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<string>("account");
    const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);

    const form = useForm<T>({
        resolver: zodResolver(schema as any),
        defaultValues,
        mode: "onSubmit",
    });

    const { watch, setValue, reset, setError } = form;
    const titleValue = watch(titleFieldName as any);

    const { data: item, isLoading } = useQuery({
        queryKey: fetchQueryKey || [],
        queryFn: fetchQueryFn || (async () => null),
        enabled: isEditMode && !!fetchQueryKey && !!fetchQueryFn,
    });

    useEffect(() => {
        if (isEditMode && item) {
            reset(item);
            if (item.image) {
                setSelectedMedia(item.image);
            }
        }
    }, [isEditMode, item, reset]);

    useEffect(() => {
        if (autoSlug && titleValue && !isEditMode) {
            const generatedSlug = generateSlug(titleValue);
            setValue("slug" as any, generatedSlug as any, { shouldValidate: false });
        }
    }, [autoSlug, titleValue, isEditMode, setValue]);

    const mutation = useMutation({
        mutationFn: async (data: T) => {
            if (isEditMode && id) {
                return await updateMutationFn(Number(id), data);
            } else {
                return await createMutationFn(data);
            }
        },
        onSuccess: () => {
            onValidationMessage?.(null);
            showSuccess(msg.crud(isEditMode ? "updated" : "created", { item: itemLabel }));
            invalidateQueryKeys.forEach(key => queryClient.invalidateQueries({ queryKey: key }));

            if (!isEditMode) {
                reset(defaultValues);
                setSelectedMedia(null);
                setActiveTab('account');
            }

            if (onSuccess) {
                onSuccess();
            } else {
                navigate(onSuccessRedirect);
            }
        },
        onError: (error: any) => {
            onValidationMessage?.(null);
            if (hasFieldErrors(error)) {
                const fieldErrors = extractFieldErrors(error);
                const nonFieldError = fieldErrors.non_field_errors;
                let hasMappedFieldErrors = false;

                Object.entries(fieldErrors).forEach(([field, message]) => {
                    if (field === 'non_field_errors') {
                        return;
                    }

                    const mappedField = mapFieldErrorKey ? mapFieldErrorKey(field) : field;
                    hasMappedFieldErrors = true;

                    setError(mappedField as any, {
                        type: 'server',
                        message: message as string
                    });
                });

                if (nonFieldError) {
                    onValidationMessage?.(nonFieldError);
                }

                if (hasMappedFieldErrors && showFieldErrorToast) {
                    showError(error, { customMessage: msg.error("checkForm") });
                }
            } else {
                showError(error);
            }
        },
    });

    const handleImageSelect = (media: Media | Media[] | null) => {
        const selected = Array.isArray(media) ? media[0] || null : media;
        setSelectedMedia(selected);
        setValue("image_id" as any, selected?.id as any || null, { shouldValidate: false });
    };

    const handleRemoveImage = () => {
        setSelectedMedia(null);
        setValue("image_id" as any, null as any, { shouldValidate: false });
    };

    const handleSubmit = form.handleSubmit(
        (data) => {
            onValidationMessage?.(null);
            mutation.mutate(data as T);
        },
        (errors) => {
            onValidationMessage?.(null);
            const errorFields = Object.keys(errors);
            if (errorFields.length > 0) {
                if (errorFields.some(field => field === 'image_id')) {
                    setActiveTab('media');
                }
                else if (errorFields.some(field => ['display_order', 'is_active', 'is_public'].includes(field))) {
                    setActiveTab('settings');
                }
                else {
                    setActiveTab('account');
                }
                if (showClientValidationToast) {
                    showError(null, { customMessage: msg.error("checkForm") });
                }
            }
        }
    );

    return {
        form,
        activeTab,
        setActiveTab,
        selectedMedia,
        setSelectedMedia,
        handleImageSelect,
        handleRemoveImage,
        handleSubmit,
        isLoading,
        isPending: mutation.isPending,
        isSubmitting: form.formState.isSubmitting,
        item,
    };
}
