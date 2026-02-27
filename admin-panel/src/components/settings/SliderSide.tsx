import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { settingsApi } from "@/api/settings/settings";
import { TaxonomyDrawer } from "@/components/templates/TaxonomyDrawer";
import { FormFieldInput, FormFieldSwitch, FormFieldTextarea } from "@/components/shared/FormField";
import { sliderSchema, type SliderFormValues } from "./validations/settingsSchemas";
import { showSuccess, showError } from "@/core/toast";
import { msg } from "@/core/messages";
import { getValidation } from "@/core/messages/validation";
import { ImageSelector } from "@/components/media/selectors/ImageSelector";
import { MediaSelector } from "@/components/media/selectors/MediaSelector";
import { mediaService } from "@/components/media/services";
import type { Media } from "@/types/shared/media";
import { Label } from "@/components/elements/Label";
import { useGlobalDrawerStore } from "@/components/shared/drawer/store";
import { DRAWER_IDS } from "@/components/shared/drawer/types";

export const SliderSide = () => {
    const isOpen = useGlobalDrawerStore(state => state.activeDrawer === DRAWER_IDS.SETTINGS_SLIDER_FORM);
    const close = useGlobalDrawerStore(state => state.close);
    const props = useGlobalDrawerStore(state => state.drawerProps as { editId?: number | null; onSuccess?: () => void });
    const { editId, onSuccess } = props || {};
    const queryClient = useQueryClient();
    const isEditMode = !!editId;
    const [selectedImage, setSelectedImage] = useState<Media | null>(null);
    const [selectedVideo, setSelectedVideo] = useState<Media | null>(null);
    const [selectedCustomVideoCover, setSelectedCustomVideoCover] = useState<Media | null>(null);

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors, isSubmitting },
    } = useForm<SliderFormValues>({
        resolver: zodResolver(sliderSchema) as any,
        defaultValues: {
            title: "",
            description: "",
            link: "",
            order: 0,
            image_id: null,
            video_id: null,
            video_cover_id: null,
            is_active: true,
        },
    });

    const isActive = watch("is_active");
    const selectedVideoCover = selectedCustomVideoCover
        ? mediaService.getMediaUrlFromObject(selectedCustomVideoCover)
        : (selectedVideo ? mediaService.getMediaCoverUrl(selectedVideo) : "");
    const hasVideoCover = Boolean(selectedVideoCover);

    const { data: sliderData, isLoading: isFetching } = useQuery({
        queryKey: ["slider", editId],
        queryFn: () => settingsApi.getSliders().then(items => items.find(i => i.id === editId)),
        enabled: isOpen && isEditMode,
    });

    useEffect(() => {
        if (isEditMode && sliderData) {
            const imageId = typeof sliderData.image === "object" ? sliderData.image?.id : sliderData.image;
            const videoId = typeof sliderData.video === "object" ? sliderData.video?.id : sliderData.video;
            const videoCoverId = typeof sliderData.video_cover === "object" ? sliderData.video_cover?.id : sliderData.video_cover;

            reset({
                title: sliderData.title,
                description: sliderData.description || "",
                link: sliderData.link || "",
                order: sliderData.order,
                image_id: imageId || null,
                video_id: videoId || null,
                video_cover_id: videoCoverId || null,
                is_active: sliderData.is_active,
            } as any);
            setSelectedImage((typeof sliderData.image === "object" ? sliderData.image : null) as any);
            setSelectedVideo((typeof sliderData.video === "object" ? sliderData.video : null) as any);
            setSelectedCustomVideoCover((typeof sliderData.video_cover === "object" ? sliderData.video_cover : null) as any);
        } else if (!isEditMode && isOpen) {
            reset({
                title: "",
                description: "",
                link: "",
                order: 0,
                image_id: null,
                video_id: null,
                video_cover_id: null,
                is_active: true,
            });
            setSelectedImage(null);
            setSelectedVideo(null);
            setSelectedCustomVideoCover(null);
        }
    }, [isEditMode, sliderData, reset, isOpen]);

    const mutation = useMutation({
        mutationFn: async (data: SliderFormValues) => {
            const payload = { ...data };
            if (isEditMode && editId) {
                return await settingsApi.updateSlider(editId, payload);
            }
            return await settingsApi.createSlider(payload);
        },
        onSuccess: () => {
            showSuccess(msg.crud(isEditMode ? "updated" : "created", { item: "اسلایدر" }));
            queryClient.invalidateQueries({ queryKey: ["sliders"] });
            if (onSuccess) onSuccess();
            close();
        },
        onError: (error) => {
            showError(error);
        },
    });

    const handleImageSelect = (media: Media | null) => {
        setSelectedImage(media);
        setValue("image_id", media?.id || null);
    };

    const handleVideoSelect = (media: Media | null) => {
        const currentVideoId = selectedVideo?.id ?? null;
        const nextVideoId = media?.id ?? null;
        setSelectedVideo(media);
        setValue("video_id", media?.id || null);
        if (!media || currentVideoId !== nextVideoId) {
            setSelectedCustomVideoCover(null);
            setValue("video_cover_id", null);
        }
    };

    const handleVideoCoverSelect = (media: Media | null) => {
        setSelectedCustomVideoCover(media);
        setValue("video_cover_id", media?.id || null);
    };

    const onSubmit = (data: SliderFormValues) => {
        if (!data.image_id && !data.video_id) {
            showError(getValidation("required", { field: "انتخاب تصویر یا ویدئو برای اسلایدر" }));
            return;
        }
        const payload = {
            ...data,
            video_cover_id: data.video_id ? (data.video_cover_id ?? null) : null,
        };
        mutation.mutate(payload);
    };

    return (
        <TaxonomyDrawer
            isOpen={isOpen}
            onClose={close}
            title={isEditMode ? "ویرایش اسلایدر" : "افزودن اسلایدر"}
            onSubmit={handleSubmit(onSubmit) as any}
            isPending={isFetching}
            isSubmitting={mutation.isPending || isSubmitting}
            formId="slider-drawer-form"
            submitButtonText={isEditMode ? "بروزرسانی" : "ایجاد"}
        >
            <div className="space-y-6">
                <div className="space-y-4">
                    <div className="rounded-xl border border-muted/50 bg-bg/30 p-4 space-y-3">
                        <div className="flex items-center justify-between gap-3">
                            <Label className="text-font-s font-medium self-start">تصویر اسلایدر (اختیاری)</Label>
                            <span className="text-[11px] text-font-s">برای اسلاید تصویری</span>
                        </div>
                        <ImageSelector
                            selectedMedia={selectedImage}
                            onMediaSelect={handleImageSelect}
                            size="lg"
                            context="media_library"
                            alt="تصویر اسلایدر"
                        />
                    </div>

                    <div className="rounded-xl border border-muted/50 bg-bg/30 p-4 space-y-3">
                        <div className="flex items-center justify-between gap-3">
                            <Label className="text-font-s font-medium self-start">ویدئو (اختیاری)</Label>
                            <span className="text-[11px] text-font-s">انتخاب از مدیا سنتر</span>
                        </div>
                        <MediaSelector
                            selectedMedia={selectedVideo}
                            onMediaSelect={handleVideoSelect}
                            size="lg"
                            context="media_library"
                            initialFileType="video"
                            showLabel={false}
                            label="ویدئو اسلایدر"
                        />
                        {selectedVideo && (
                            <div className="pt-2 border-t border-muted/30 space-y-3">
                                <div className="flex items-center justify-between gap-3">
                                    <Label className="text-font-s font-medium self-start">کاور اختصاصی ویدئو (اختیاری)</Label>
                                    <span className="text-[11px] text-font-s">فقط برای همین اسلایدر</span>
                                </div>
                                <ImageSelector
                                    selectedMedia={selectedCustomVideoCover}
                                    onMediaSelect={handleVideoCoverSelect}
                                    size="md"
                                    context="media_library"
                                    alt="کاور اختصاصی ویدئو"
                                />
                            </div>
                        )}
                        <div className="flex items-center gap-2 text-xs text-font-s">
                            {hasVideoCover ? (
                                <>
                                    <CheckCircle2 className="h-3.5 w-3.5 text-green-1 shrink-0" />
                                    <span>{selectedCustomVideoCover ? "کاور اختصاصی ویدئو فعال است." : "کاور پیش فرض ویدئو از مدیا سنتر شناسایی شد."}</span>
                                </>
                            ) : (
                                <>
                                    <AlertCircle className="h-3.5 w-3.5 text-amber-1 shrink-0" />
                                    <span>
                                        {selectedVideo
                                            ? "این ویدئو کاور ندارد؛ یا کاور اختصاصی همین اسلایدر را انتخاب کنید یا در مدیا سنتر کاور بگذارید."
                                            : "در صورت انتخاب ویدئو، کاور همان رسانه از مدیا سنتر نمایش داده می شود."}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid gap-5">
                    <FormFieldInput
                        label="عنوان اسلایدر"
                        id="title"
                        required
                        error={errors.title?.message}
                        placeholder="عنوان جذاب برای اسلایدر"
                        {...register("title")}
                    />

                    <FormFieldTextarea
                        label="توضیحات"
                        id="description"
                        error={errors.description?.message}
                        placeholder="توضیحات تکمیلی..."
                        {...register("description")}
                    />

                    <FormFieldInput
                        label="لینک (URL)"
                        id="link"
                        error={errors.link?.message}
                        placeholder="https://..."
                        {...register("link")}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <FormFieldInput
                            label="ترتیب نمایش"
                            id="order"
                            type="number"
                            error={errors.order?.message}
                            placeholder="0"
                            {...register("order", { valueAsNumber: true })}
                        />

                        <FormFieldSwitch
                            label="وضعیت فعال"
                            checked={isActive}
                            onCheckedChange={(checked) => setValue("is_active", checked)}
                        />
                    </div>
                </div>
            </div>
        </TaxonomyDrawer>
    );
};
