import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { settingsApi } from "@/api/settings/settings";
import { TaxonomyDrawer } from "@/components/templates/TaxonomyDrawer";
import { FormFieldInput, FormFieldSwitch, FormFieldTextarea } from "@/components/shared/FormField";
import { footerAboutSchema, type FooterAboutFormValues } from "./validations/settingsSchemas";
import { showSuccess, showError } from "@/core/toast";
import { msg } from "@/core/messages";
import { useGlobalDrawerStore } from "@/components/shared/drawer/store";
import { DRAWER_IDS } from "@/components/shared/drawer/types";

export const FooterAboutSide = () => {
    const isOpen = useGlobalDrawerStore(state => state.activeDrawer === DRAWER_IDS.SETTINGS_FOOTER_ABOUT_FORM);
    const close = useGlobalDrawerStore(state => state.close);
    const props = useGlobalDrawerStore(state => state.drawerProps as { editId?: number | null; onSuccess?: () => void });
    const { editId, onSuccess } = props || {};

    const queryClient = useQueryClient();
    const isEditMode = !!editId;

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors, isSubmitting },
    } = useForm<FooterAboutFormValues>({
        resolver: zodResolver(footerAboutSchema) as any,
        defaultValues: {
            title: "",
            text: "",
            is_active: true,
        },
    });

    const isActive = watch("is_active");

    const { data: aboutData, isLoading: isFetching } = useQuery({
        queryKey: ["footer-about-item", editId],
        queryFn: () => settingsApi.getFooterAbout().then(items => items.find(i => i.id === editId)),
        enabled: isOpen && isEditMode,
    });

    useEffect(() => {
        if (isEditMode && aboutData) {
            reset({
                title: aboutData.title,
                text: aboutData.text,
                is_active: aboutData.is_active,
            } as any);
        } else if (!isEditMode && isOpen) {
            reset({
                title: "",
                text: "",
                is_active: true,
            });
        }
    }, [isEditMode, aboutData, reset, isOpen]);

    const mutation = useMutation({
        mutationFn: async (data: FooterAboutFormValues) => {
            const payload = { ...data };
            if (isEditMode && editId) {
                return await settingsApi.updateFooterAbout(editId, payload);
            }
            return await settingsApi.createFooterAbout(payload);
        },
        onSuccess: () => {
            showSuccess(msg.crud(isEditMode ? "updated" : "created", { item: "درباره فوتر" }));
            queryClient.invalidateQueries({ queryKey: ["footer-about"] });
            if (onSuccess) onSuccess();
            close();
        },
        onError: (error) => {
            showError(error);
        },
    });

    const onSubmit = (data: FooterAboutFormValues) => {
        mutation.mutate(data);
    };

    return (
        <TaxonomyDrawer
            isOpen={isOpen}
            onClose={close}
            title={isEditMode ? "ویرایش درباره فوتر" : "ایجاد درباره فوتر"}
            onSubmit={handleSubmit(onSubmit) as any}
            isPending={isFetching}
            isSubmitting={mutation.isPending || isSubmitting}
            formId="footer-about-drawer-form"
            submitButtonText={isEditMode ? "بروزرسانی" : "ایجاد"}
        >
            <div className="space-y-6">
                <div className="grid gap-5">
                    <FormFieldInput
                        label="عنوان"
                        id="title"
                        required
                        error={errors.title?.message}
                        placeholder="مثلاً درباره ما"
                        {...register("title")}
                    />

                    <FormFieldTextarea
                        label="متن"
                        id="text"
                        required
                        error={errors.text?.message}
                        placeholder="متن درباره ما برای نمایش در فوتر..."
                        {...register("text")}
                    />

                    <FormFieldSwitch
                        label="وضعیت فعال"
                        checked={isActive}
                        onCheckedChange={(checked) => setValue("is_active", checked)}
                    />
                </div>
            </div>
        </TaxonomyDrawer>
    );
};
