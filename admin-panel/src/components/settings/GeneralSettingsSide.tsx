import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { settingsApi } from "@/api/settings/settings";
import { TaxonomyDrawer } from "@/components/templates/TaxonomyDrawer";
import { FormFieldInput } from "@/components/shared/FormField";
import { generalSettingsSchema, type GeneralSettingsFormValues } from "./validations/settingsSchemas";
import { showSuccess, showError } from "@/core/toast";
import { msg } from "@/core/messages";
import { ImageSelector } from "@/components/media/selectors/ImageSelector";
import type { Media } from "@/types/shared/media";
import { Label } from "@/components/elements/Label";

interface GeneralSettingsSideProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export const GeneralSettingsSide: React.FC<GeneralSettingsSideProps> = ({
    isOpen,
    onClose,
    onSuccess,
}) => {
    const queryClient = useQueryClient();
    const [logoMedia, setLogoMedia] = useState<Media | null>(null);
    const [faviconMedia, setFaviconMedia] = useState<Media | null>(null);
    const [enamadMedia, setEnamadMedia] = useState<Media | null>(null);

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm<GeneralSettingsFormValues>({
        resolver: zodResolver(generalSettingsSchema) as any,
        defaultValues: {
            site_name: "",
            copyright_text: "",
            copyright_link: "",
            logo_image: null,
            favicon_image: null,
            enamad_image: null,
        },
    });

    const { data: settingsData, isLoading: isFetching } = useQuery({
        queryKey: ["general-settings"],
        queryFn: () => settingsApi.getGeneralSettings(),
        enabled: isOpen,
    });

    useEffect(() => {
        if (settingsData) {
            reset({
                site_name: settingsData.site_name,
                copyright_text: settingsData.copyright_text || "",
                copyright_link: settingsData.copyright_link || "",
                logo_image: settingsData.logo_image || null,
                favicon_image: settingsData.favicon_image || null,
                enamad_image: settingsData.enamad_image || null,
            });
            setLogoMedia(settingsData.logo_image_data);
            setFaviconMedia(settingsData.favicon_image_data);
            setEnamadMedia(settingsData.enamad_image_data);
        }
    }, [settingsData, reset, isOpen]);

    const mutation = useMutation({
        mutationFn: (data: GeneralSettingsFormValues) => settingsApi.updateGeneralSettings(data),
        onSuccess: () => {
            showSuccess(msg.crud("updated", { item: "تنظیمات عمومی" }));
            queryClient.invalidateQueries({ queryKey: ["general-settings"] });
            if (onSuccess) onSuccess();
            onClose();
        },
        onError: (error) => {
            showError(error);
        },
    });

    const handleMediaSelect = (type: "logo" | "favicon" | "enamad") => (media: Media | Media[] | null) => {
        const item = Array.isArray(media) ? media[0] : media;
        if (type === "logo") {
            setLogoMedia(item || null);
            setValue("logo_image", item?.id || null);
        } else if (type === "favicon") {
            setFaviconMedia(item || null);
            setValue("favicon_image", item?.id || null);
        } else if (type === "enamad") {
            setEnamadMedia(item || null);
            setValue("enamad_image", item?.id || null);
        }
    };

    const onSubmit = (data: GeneralSettingsFormValues) => {
        mutation.mutate(data);
    };

    return (
        <TaxonomyDrawer
            isOpen={isOpen}
            onClose={onClose}
            title="ویرایش تنظیمات عمومی"
            onSubmit={handleSubmit(onSubmit) as any}
            isPending={isFetching}
            isSubmitting={mutation.isPending || isSubmitting}
            formId="general-settings-drawer-form"
            submitButtonText="بروزرسانی"
        >
            <div className="space-y-8">
                <div className="grid grid-cols-3 gap-4">
                    <div className="flex flex-col items-center gap-2">
                        <Label className="text-[10px] font-medium text-font-s">لوگو</Label>
                        <ImageSelector
                            selectedMedia={logoMedia}
                            onMediaSelect={handleMediaSelect("logo")}
                            size="sm"
                            context="media_library"
                        />
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <Label className="text-[10px] font-medium text-font-s">فاوآیکون</Label>
                        <ImageSelector
                            selectedMedia={faviconMedia}
                            onMediaSelect={handleMediaSelect("favicon")}
                            size="sm"
                            context="media_library"
                        />
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <Label className="text-[10px] font-medium text-font-s">اینماد</Label>
                        <ImageSelector
                            selectedMedia={enamadMedia}
                            onMediaSelect={handleMediaSelect("enamad")}
                            size="sm"
                            context="media_library"
                        />
                    </div>
                </div>

                <div className="grid gap-5">
                    <FormFieldInput
                        label="عنوان سایت"
                        id="site_name"
                        required
                        error={errors.site_name?.message}
                        placeholder="نام وب‌سایت شما"
                        {...register("site_name")}
                    />

                    <FormFieldInput
                        label="متن کپی‌رایت"
                        id="copyright_text"
                        error={errors.copyright_text?.message}
                        placeholder="تمامی حقوق محفوظ است..."
                        {...register("copyright_text")}
                    />

                    <FormFieldInput
                        label="لینک کپی‌رایت"
                        id="copyright_link"
                        error={errors.copyright_link?.message}
                        placeholder="https://..."
                        {...register("copyright_link")}
                    />
                </div>
            </div>
        </TaxonomyDrawer>
    );
};
