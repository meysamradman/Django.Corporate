import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateFAQ, useUpdateFAQ } from "@/components/ai/chatbot/hooks/useChatbot";
import { TaxonomyDrawer } from "@/components/templates/TaxonomyDrawer";
import { FormFieldInput, FormFieldSwitch, FormFieldTextarea } from "@/components/shared/FormField";
import { faqSchema, type FAQFormValues } from "@/components/settings/validations/settingsSchemas";
import { useGlobalDrawerStore } from "@/components/shared/drawer/store";
import { DRAWER_IDS } from "@/components/shared/drawer/types";
import { useQuery } from "@tanstack/react-query";
import { chatbotApi } from "@/api/chatbot/chatbot";

export const FAQSide = () => {
    const isOpen = useGlobalDrawerStore(state => state.activeDrawer === DRAWER_IDS.CHATBOT_FAQ_FORM);
    const close = useGlobalDrawerStore(state => state.close);
    const props = useGlobalDrawerStore(state => state.drawerProps as { editId?: number | null; onSuccess?: () => void });
    const { editId, onSuccess } = props || {};
    const createFAQ = useCreateFAQ();
    const updateFAQ = useUpdateFAQ();
    const isEditMode = !!editId;

    const { data: faqData, isLoading: isFetching } = useQuery({
        queryKey: ["faq", editId],
        queryFn: () => chatbotApi.getFAQ(editId!).then(res => res.data),
        enabled: isOpen && isEditMode,
    });

    const faq = faqData;
    const isPending = createFAQ.isPending || updateFAQ.isPending;

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors, isSubmitting },
    } = useForm<FAQFormValues>({
        resolver: zodResolver(faqSchema) as any,
        defaultValues: {
            question: "",
            answer: "",
            keywords: "",
            patterns: "",
            order: 0,
            is_active: true,
        },
    });

    const isActive = watch("is_active");

    useEffect(() => {
        if (faq) {
            reset({
                question: faq.question,
                answer: faq.answer,
                keywords: faq.keywords || "",
                patterns: faq.patterns || "",
                order: faq.order,
                is_active: faq.is_active,
            });
        } else if (isOpen) {
            reset({
                question: "",
                answer: "",
                keywords: "",
                patterns: "",
                order: 0,
                is_active: true,
            });
        }
    }, [faq, reset, isOpen]);

    const onSubmit = async (data: FAQFormValues) => {
        if (faq) {
            await updateFAQ.mutateAsync({ id: faq.id, data: data as any });
        } else {
            await createFAQ.mutateAsync(data as any);
        }
        if (onSuccess) onSuccess();
        close();
    };

    const isPendingValue = isPending || isFetching;

    return (
        <TaxonomyDrawer
            isOpen={isOpen}
            onClose={close}
            title={isEditMode ? "ویرایش سوال متداول" : "افزودن سوال متداول"}
            onSubmit={handleSubmit(onSubmit) as any}
            isPending={isFetching}
            isSubmitting={isPendingValue || isSubmitting}
            formId="faq-drawer-form"
            submitButtonText={isEditMode ? "بروزرسانی" : "ایجاد"}
        >
            <div className="space-y-6">
                <div className="grid gap-5">
                    <FormFieldInput
                        label="سوال"
                        id="question"
                        required
                        error={errors.question?.message}
                        placeholder="مثال: قیمت خدمات چقدر است؟"
                        {...register("question")}
                    />

                    <FormFieldTextarea
                        label="پاسخ"
                        id="answer"
                        required
                        error={errors.answer?.message}
                        placeholder="پاسخ کامل به سوال..."
                        className="min-h-[120px]"
                        {...register("answer")}
                    />

                    <div className="grid grid-cols-2 gap-5">
                        <FormFieldInput
                            label="ترتیب"
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

                    <FormFieldInput
                        label="کلمات کلیدی"
                        id="keywords"
                        error={errors.keywords?.message}
                        placeholder="قیمت, هزینه, هزینه خدمات"
                        description="کلمات کلیدی را با کاما جدا کنید"
                        {...register("keywords")}
                    />

                    <FormFieldTextarea
                        label="الگوهای سوال"
                        id="patterns"
                        error={errors.patterns?.message}
                        placeholder="هر خط یک الگو..."
                        description="هر خط یک الگوی سوال (اختیاری)"
                        className="min-h-[100px] font-mono text-sm"
                        {...register("patterns")}
                    />
                </div>
            </div>
        </TaxonomyDrawer>
    );
};
