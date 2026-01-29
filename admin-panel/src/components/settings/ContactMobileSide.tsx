import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { settingsApi } from "@/api/settings/settings";
import { TaxonomyDrawer } from "@/components/templates/TaxonomyDrawer";
import { FormFieldInput } from "@/components/shared/FormField";
import { contactMobileSchema, type ContactMobileFormValues } from "./validations/settingsSchemas";
import { showSuccess, showError } from "@/core/toast";
import { msg } from "@/core/messages";

interface ContactMobileSideProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    editId?: number | null;
}

export const ContactMobileSide: React.FC<ContactMobileSideProps> = ({
    isOpen,
    onClose,
    onSuccess,
    editId,
}) => {
    const queryClient = useQueryClient();
    const isEditMode = !!editId;

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<ContactMobileFormValues>({
        resolver: zodResolver(contactMobileSchema),
        defaultValues: {
            mobile_number: "",
            label: "",
            order: 0,
        },
    });

    const { data: mobileData, isLoading: isFetching } = useQuery({
        queryKey: ["contact-mobile", editId],
        queryFn: () => settingsApi.getContactMobiles().then(mobiles => mobiles.find(m => m.id === editId)),
        enabled: isOpen && isEditMode,
    });

    useEffect(() => {
        if (isEditMode && mobileData) {
            reset({
                mobile_number: mobileData.mobile_number,
                label: mobileData.label || "",
                order: mobileData.order,
            });
        } else if (!isEditMode && isOpen) {
            reset({
                mobile_number: "",
                label: "",
                order: 0,
            });
        }
    }, [isEditMode, mobileData, reset, isOpen]);

    const mutation = useMutation({
        mutationFn: async (data: ContactMobileFormValues) => {
            if (isEditMode && editId) {
                return await settingsApi.updateContactMobile(editId, data);
            } else {
                return await settingsApi.createContactMobile(data);
            }
        },
        onSuccess: () => {
            showSuccess(msg.crud(isEditMode ? "updated" : "created", { item: "شماره موبایل" }));
            queryClient.invalidateQueries({ queryKey: ["contact-mobiles"] });
            if (onSuccess) onSuccess();
            onClose();
        },
        onError: (error) => {
            showError(error);
        },
    });

    const onSubmit = (data: ContactMobileFormValues) => {
        mutation.mutate(data);
    };

    return (
        <TaxonomyDrawer
            isOpen={isOpen}
            onClose={onClose}
            title={isEditMode ? "ویرایش شماره موبایل" : "افزودن شماره موبایل"}
            onSubmit={handleSubmit(onSubmit) as any}
            isPending={isFetching}
            isSubmitting={mutation.isPending || isSubmitting}
            formId="contact-mobile-drawer-form"
            submitButtonText={isEditMode ? "بروزرسانی" : "ایجاد"}
        >
            <div className="space-y-6">
                <div className="grid gap-5">
                    <FormFieldInput
                        label="شماره موبایل"
                        id="mobile_number"
                        required
                        error={errors.mobile_number?.message}
                        placeholder="مثلاً 09123456789"
                        {...register("mobile_number")}
                    />

                    <FormFieldInput
                        label="برچسب"
                        id="label"
                        error={errors.label?.message}
                        placeholder="همراه، مدیریت و ..."
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
