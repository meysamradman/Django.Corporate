import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { settingsApi } from "@/api/settings/settings";
import { TaxonomyDrawer } from "@/components/templates/TaxonomyDrawer";
import { FormFieldInput } from "@/components/shared/FormField";
import { socialMediaSchema, type SocialMediaFormValues } from "./validations/settingsSchemas";
import { showSuccess, showError } from "@/core/toast";
import { msg } from "@/core/messages";
import { ImageSelector } from "@/components/media/selectors/ImageSelector";
import type { Media } from "@/types/shared/media";
import { Label } from "@/components/elements/Label";

interface SocialMediaSideProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    editId?: number | null;
}

export const SocialMediaSide: React.FC<SocialMediaSideProps> = ({
    isOpen,
    onClose,
    onSuccess,
    editId,
}) => {
    const queryClient = useQueryClient();
    const isEditMode = !!editId;
    const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm<SocialMediaFormValues>({
        resolver: zodResolver(socialMediaSchema) as any,
        defaultValues: {
            name: "",
            url: "",
            order: 0,
            icon_id: null,
        },
    });

    const { data: socialMediaData, isLoading: isFetching } = useQuery({
        queryKey: ["social-media", editId],
        queryFn: () => settingsApi.getSocialMedias().then(items => items.find(i => i.id === editId)),
        enabled: isOpen && isEditMode,
    });

    useEffect(() => {
        if (isEditMode && socialMediaData) {
            reset({
                name: socialMediaData.name,
                url: socialMediaData.url,
                order: socialMediaData.order,
                icon_id: socialMediaData.icon || null,
            });
            setSelectedMedia(socialMediaData.icon_data);
        } else if (!isEditMode && isOpen) {
            reset({
                name: "",
                url: "",
                order: 0,
                icon_id: null,
            });
            setSelectedMedia(null);
        }
    }, [isEditMode, socialMediaData, reset, isOpen]);

    const mutation = useMutation({
        mutationFn: async (data: SocialMediaFormValues) => {
            const payload = {
                ...data,
                icon: data.icon_id,
            };
            if (isEditMode && editId) {
                return await settingsApi.updateSocialMedia(editId, payload);
            } else {
                return await settingsApi.createSocialMedia(payload);
            }
        },
        onSuccess: () => {
            showSuccess(msg.crud(isEditMode ? "updated" : "created", { item: "شبکه اجتماعی" }));
            queryClient.invalidateQueries({ queryKey: ["social-medias"] });
            if (onSuccess) onSuccess();
            onClose();
        },
        onError: (error) => {
            showError(error);
        },
    });

    const handleMediaSelect = (media: Media | Media[] | null) => {
        const item = Array.isArray(media) ? media[0] : media;
        setSelectedMedia(item);
        setValue("icon_id", item?.id || null);
    };

    const onSubmit = (data: SocialMediaFormValues) => {
        mutation.mutate(data);
    };

    return (
        <TaxonomyDrawer
            isOpen={isOpen}
            onClose={onClose}
            title={isEditMode ? "ویرایش شبکه اجتماعی" : "افزودن شبکه اجتماعی"}
            onSubmit={handleSubmit(onSubmit) as any}
            isPending={isFetching}
            isSubmitting={mutation.isPending || isSubmitting}
            formId="social-media-drawer-form"
            submitButtonText={isEditMode ? "بروزرسانی" : "ایجاد"}
        >
            <div className="space-y-6">
                <div className="flex flex-col items-center gap-3">
                    <Label className="text-font-s font-medium self-start">آیکون</Label>
                    <ImageSelector
                        selectedMedia={selectedMedia}
                        onMediaSelect={handleMediaSelect}
                        size="sm"
                        context="media_library"
                        alt="آیکون شبکه اجتماعی"
                    />
                </div>

                <div className="grid gap-5">
                    <FormFieldInput
                        label="نام شبکه اجتماعی"
                        id="name"
                        required
                        error={errors.name?.message}
                        placeholder="اینستاگرام، تلگرام و ..."
                        {...register("name")}
                    />

                    <FormFieldInput
                        label="لینک"
                        id="url"
                        required
                        error={errors.url?.message}
                        placeholder="https://..."
                        {...register("url")}
                    />

                    <FormFieldInput
                        label="ترتیب نمایش"
                        id="order"
                        type="number"
                        error={errors.order?.message}
                        placeholder="0"
                        {...register("order", { valueAsNumber: true })}
                    />
                </div>
            </div>
        </TaxonomyDrawer>
    );
};
