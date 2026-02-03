import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { settingsApi } from "@/api/settings/settings";
import { TaxonomyDrawer } from "@/components/templates/TaxonomyDrawer";
import { FormFieldInput } from "@/components/shared/FormField";
import { contactPhoneSchema, type ContactPhoneFormValues } from "./validations/settingsSchemas";
import { showSuccess, showError } from "@/core/toast";
import { msg } from "@/core/messages";

import { useGlobalDrawerStore } from "@/components/shared/drawer/store";
import { DRAWER_IDS } from "@/components/shared/drawer/types";

export const ContactPhoneSide = () => {
    const isOpen = useGlobalDrawerStore(state => state.activeDrawer === DRAWER_IDS.SETTINGS_PHONE_FORM);
    const close = useGlobalDrawerStore(state => state.close);
    const props = useGlobalDrawerStore(state => state.drawerProps as { editId?: number | null; onSuccess?: () => void });
    const { editId, onSuccess } = props || {};
    const queryClient = useQueryClient();
    const isEditMode = !!editId;

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<ContactPhoneFormValues>({
        resolver: zodResolver(contactPhoneSchema) as any,
        defaultValues: {
            phone_number: "",
            label: "",
            order: 0,
        },
    });

    const { data: phoneData, isLoading: isFetching } = useQuery({
        queryKey: ["contact-phone", editId],
        queryFn: () => settingsApi.getContactPhones().then(phones => phones.find(p => p.id === editId)),
        enabled: isOpen && isEditMode,
    });

    useEffect(() => {
        if (isEditMode && phoneData) {
            reset({
                phone_number: phoneData.phone_number,
                label: phoneData.label || "",
                order: phoneData.order,
            });
        } else if (!isEditMode && isOpen) {
            reset({
                phone_number: "",
                label: "",
                order: 0,
            });
        }
    }, [isEditMode, phoneData, reset, isOpen]);

    const mutation = useMutation({
        mutationFn: async (data: ContactPhoneFormValues) => {
            if (isEditMode && editId) {
                return await settingsApi.updateContactPhone(editId, data);
            } else {
                return await settingsApi.createContactPhone(data);
            }
        },
        onSuccess: () => {
            showSuccess(msg.crud(isEditMode ? "updated" : "created", { item: "شماره تماس" }));
            queryClient.invalidateQueries({ queryKey: ["contact-phones"] });
            if (onSuccess) onSuccess();
            close();
        },
        onError: (error) => {
            showError(error);
        },
    });

    const onSubmit = (data: ContactPhoneFormValues) => {
        mutation.mutate(data);
    };

    return (
        <TaxonomyDrawer
            isOpen={isOpen}
            onClose={close}
            title={isEditMode ? "ویرایش شماره تماس" : "افزودن شماره تماس"}
            onSubmit={handleSubmit(onSubmit) as any}
            isPending={isFetching}
            isSubmitting={mutation.isPending || isSubmitting}
            formId="contact-phone-drawer-form"
            submitButtonText={isEditMode ? "بروزرسانی" : "ایجاد"}
        >
            <div className="space-y-6">
                <div className="grid gap-5">
                    <FormFieldInput
                        label="شماره تماس"
                        id="phone_number"
                        required
                        error={errors.phone_number?.message}
                        placeholder="مثلاً 021-12345678"
                        {...register("phone_number")}
                    />

                    <FormFieldInput
                        label="برچسب"
                        id="label"
                        error={errors.label?.message}
                        placeholder="دفتر مرکزی، پشتیبانی و ..."
                        {...register("label")}
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
