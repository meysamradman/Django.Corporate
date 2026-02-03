import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { settingsApi } from "@/api/settings/settings";
import { TaxonomyDrawer } from "@/components/templates/TaxonomyDrawer";
import { FormFieldInput } from "@/components/shared/FormField";
import { contactEmailSchema, type ContactEmailFormValues } from "./validations/settingsSchemas";
import { showSuccess, showError } from "@/core/toast";
import { msg } from "@/core/messages";
import { useGlobalDrawerStore } from "@/components/shared/drawer/store";
import { DRAWER_IDS } from "@/components/shared/drawer/types";

export const ContactEmailSide = () => {
    const isOpen = useGlobalDrawerStore(state => state.activeDrawer === DRAWER_IDS.SETTINGS_EMAIL_FORM);
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
    } = useForm<ContactEmailFormValues>({
        resolver: zodResolver(contactEmailSchema) as any,
        defaultValues: {
            email: "",
            label: "",
            order: 0,
        },
    });

    const { data: emailData, isLoading: isFetching } = useQuery({
        queryKey: ["contact-email", editId],
        queryFn: () => settingsApi.getContactEmails().then(emails => emails.find(e => e.id === editId)),
        enabled: isOpen && isEditMode,
    });

    useEffect(() => {
        if (isEditMode && emailData) {
            reset({
                email: emailData.email,
                label: emailData.label || "",
                order: emailData.order,
            });
        } else if (!isEditMode && isOpen) {
            reset({
                email: "",
                label: "",
                order: 0,
            });
        }
    }, [isEditMode, emailData, reset, isOpen]);

    const mutation = useMutation({
        mutationFn: async (data: ContactEmailFormValues) => {
            if (isEditMode && editId) {
                return await settingsApi.updateContactEmail(editId, data);
            } else {
                return await settingsApi.createContactEmail(data);
            }
        },
        onSuccess: () => {
            showSuccess(msg.crud(isEditMode ? "updated" : "created", { item: "ایمیل" }));
            queryClient.invalidateQueries({ queryKey: ["contact-emails"] });
            if (onSuccess) onSuccess();
            close();
        },
        onError: (error) => {
            showError(error);
        },
    });

    const onSubmit = (data: ContactEmailFormValues) => {
        mutation.mutate(data);
    };

    return (
        <TaxonomyDrawer
            isOpen={isOpen}
            onClose={close}
            title={isEditMode ? "ویرایش ایمیل" : "افزودن ایمیل"}
            onSubmit={handleSubmit(onSubmit) as any}
            isPending={isFetching}
            isSubmitting={mutation.isPending || isSubmitting}
            formId="contact-email-drawer-form"
            submitButtonText={isEditMode ? "بروزرسانی" : "ایجاد"}
        >
            <div className="space-y-6">
                <div className="grid gap-5">
                    <FormFieldInput
                        label="ایمیل"
                        id="email"
                        type="email"
                        required
                        error={errors.email?.message}
                        placeholder="example@domain.com"
                        {...register("email")}
                    />

                    <FormFieldInput
                        label="برچسب"
                        id="label"
                        error={errors.label?.message}
                        placeholder="پشتیبانی، فروش و ..."
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
