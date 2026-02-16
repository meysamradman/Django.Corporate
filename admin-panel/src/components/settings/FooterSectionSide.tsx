import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { settingsApi } from "@/api/settings/settings";
import { TaxonomyDrawer } from "@/components/templates/TaxonomyDrawer";
import { FormFieldInput, FormFieldSwitch } from "@/components/shared/FormField";
import { footerSectionSchema, type FooterSectionFormValues } from "./validations/settingsSchemas";
import { showSuccess, showError } from "@/core/toast";
import { msg } from "@/core/messages";
import { useGlobalDrawerStore } from "@/components/shared/drawer/store";
import { DRAWER_IDS } from "@/components/shared/drawer/types";

export const FooterSectionSide = () => {
    const isOpen = useGlobalDrawerStore(state => state.activeDrawer === DRAWER_IDS.SETTINGS_FOOTER_SECTION_FORM);
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
    } = useForm<FooterSectionFormValues>({
        resolver: zodResolver(footerSectionSchema) as any,
        defaultValues: {
            title: "",
            order: 0,
            is_active: true,
        },
    });

    const isActive = watch("is_active");

    const { data: sectionData, isLoading: isFetching } = useQuery({
        queryKey: ["footer-section", editId],
        queryFn: () => settingsApi.getFooterSections().then(items => items.find(i => i.id === editId)),
        enabled: isOpen && isEditMode,
    });

    useEffect(() => {
        if (isEditMode && sectionData) {
            reset({
                title: sectionData.title,
                order: sectionData.order,
                is_active: sectionData.is_active,
            } as any);
        } else if (!isEditMode && isOpen) {
            reset({
                title: "",
                order: 0,
                is_active: true,
            });
        }
    }, [isEditMode, sectionData, reset, isOpen]);

    const mutation = useMutation({
        mutationFn: async (data: FooterSectionFormValues) => {
            const payload = { ...data };
            if (isEditMode && editId) {
                return await settingsApi.updateFooterSection(editId, payload);
            }
            return await settingsApi.createFooterSection(payload);
        },
        onSuccess: () => {
            showSuccess(msg.crud(isEditMode ? "updated" : "created", { item: "ستون فوتر" }));
            queryClient.invalidateQueries({ queryKey: ["footer-sections"] });
            if (onSuccess) onSuccess();
            close();
        },
        onError: (error) => {
            showError(error);
        },
    });

    const onSubmit = (data: FooterSectionFormValues) => {
        mutation.mutate(data);
    };

    return (
        <TaxonomyDrawer
            isOpen={isOpen}
            onClose={close}
            title={isEditMode ? "ویرایش ستون فوتر" : "افزودن ستون فوتر"}
            onSubmit={handleSubmit(onSubmit) as any}
            isPending={isFetching}
            isSubmitting={mutation.isPending || isSubmitting}
            formId="footer-section-drawer-form"
            submitButtonText={isEditMode ? "بروزرسانی" : "ایجاد"}
        >
            <div className="space-y-6">
                <div className="grid gap-5">
                    <FormFieldInput
                        label="عنوان ستون"
                        id="title"
                        required
                        error={errors.title?.message}
                        placeholder="مثلاً خدمات، لینک‌های مفید..."
                        {...register("title")}
                    />

                    <div className="grid grid-cols-2 gap-5">
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
