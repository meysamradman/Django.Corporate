import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { settingsApi } from "@/api/settings/settings";
import { TaxonomyDrawer } from "@/components/templates/TaxonomyDrawer";
import { FormFieldInput, FormFieldSelect, FormFieldSwitch } from "@/components/shared/FormField";
import { footerLinkSchema, type FooterLinkFormValues } from "./validations/settingsSchemas";
import { showSuccess, showError } from "@/core/toast";
import { msg } from "@/core/messages";
import { getValidation } from "@/core/messages/validation";
import { useGlobalDrawerStore } from "@/components/shared/drawer/store";
import { DRAWER_IDS } from "@/components/shared/drawer/types";

export const FooterLinkSide = () => {
    const isOpen = useGlobalDrawerStore(state => state.activeDrawer === DRAWER_IDS.SETTINGS_FOOTER_LINK_FORM);
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
    } = useForm<FooterLinkFormValues>({
        resolver: zodResolver(footerLinkSchema) as any,
        defaultValues: {
            section: 0 as any,
            title: "",
            href: "",
            order: 0,
            is_active: true,
        },
    });

    const isActive = watch("is_active");
    const sectionValue = String(watch("section") || "");

    const { data: linkData, isLoading: isFetching } = useQuery({
        queryKey: ["footer-link", editId],
        queryFn: () => settingsApi.getFooterLinks().then(items => items.find(i => i.id === editId)),
        enabled: isOpen && isEditMode,
    });

    const { data: sections = [] } = useQuery({
        queryKey: ["footer-sections"],
        queryFn: () => settingsApi.getFooterSections(),
        enabled: isOpen,
    });

    const sectionOptions = useMemo(() => {
        return sections
            .slice()
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
            .map(s => ({ label: s.title, value: String(s.id) }));
    }, [sections]);

    useEffect(() => {
        if (isEditMode && linkData) {
            reset({
                section: linkData.section,
                title: linkData.title,
                href: linkData.href,
                order: linkData.order,
                is_active: linkData.is_active,
            } as any);
        } else if (!isEditMode && isOpen) {
            reset({
                section: sections[0]?.id ?? (0 as any),
                title: "",
                href: "",
                order: 0,
                is_active: true,
            } as any);
        }
    }, [isEditMode, linkData, reset, isOpen, sections]);

    const mutation = useMutation({
        mutationFn: async (data: FooterLinkFormValues) => {
            const payload = { ...data, section: Number(data.section) };
            if (isEditMode && editId) {
                return await settingsApi.updateFooterLink(editId, payload);
            }
            return await settingsApi.createFooterLink(payload);
        },
        onSuccess: () => {
            showSuccess(msg.crud(isEditMode ? "updated" : "created", { item: "لینک فوتر" }));
            queryClient.invalidateQueries({ queryKey: ["footer-links"] });
            if (onSuccess) onSuccess();
            close();
        },
        onError: (error) => {
            showError(error);
        },
    });

    const onSubmit = (data: FooterLinkFormValues) => {
        if (!data.section || Number(data.section) <= 0) {
            showError(getValidation("required", { field: "انتخاب ستون فوتر" }));
            return;
        }
        mutation.mutate({ ...data, section: Number(data.section) } as any);
    };

    return (
        <TaxonomyDrawer
            isOpen={isOpen}
            onClose={close}
            title={isEditMode ? "ویرایش لینک فوتر" : "افزودن لینک فوتر"}
            onSubmit={handleSubmit(onSubmit) as any}
            isPending={isFetching}
            isSubmitting={mutation.isPending || isSubmitting}
            formId="footer-link-drawer-form"
            submitButtonText={isEditMode ? "بروزرسانی" : "ایجاد"}
        >
            <div className="space-y-6">
                <div className="grid gap-5">
                    <FormFieldSelect
                        label="ستون"
                        required
                        value={sectionValue}
                        onValueChange={(val) => setValue("section", Number(val) as any)}
                        options={sectionOptions}
                        error={errors.section?.message}
                        placeholder={sectionOptions.length ? "انتخاب ستون..." : "ابتدا یک ستون بسازید"}
                    />

                    <FormFieldInput
                        label="عنوان لینک"
                        id="title"
                        required
                        error={errors.title?.message}
                        placeholder="مثلاً تماس با ما"
                        {...register("title")}
                    />

                    <FormFieldInput
                        label="آدرس (href)"
                        id="href"
                        required
                        error={errors.href?.message}
                        placeholder="/about یا https://..."
                        {...register("href")}
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
