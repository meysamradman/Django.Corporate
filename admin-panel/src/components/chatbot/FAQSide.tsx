import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateFAQ, useUpdateFAQ } from "@/components/ai/chatbot/hooks/useChatbot";
import { TaxonomyDrawer } from "@/components/templates/TaxonomyDrawer";
import { FormFieldInput, FormFieldSwitch, FormFieldTextarea } from "@/components/shared/FormField";
import { faqSchema, type FAQFormValues } from "@/components/settings/validations/settingsSchemas";
import type { FAQ } from "@/types/chatbot/chatbot";

interface FAQSideProps {
    isOpen: boolean;
    onClose: () => void;
    faq?: FAQ | null;
}

export const FAQSide: React.FC<FAQSideProps> = ({
    isOpen,
    onClose,
    faq,
}) => {
    const createFAQ = useCreateFAQ();
    const updateFAQ = useUpdateFAQ();
    const isEditMode = !!faq;

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
        onClose();
    };

    const isPending = createFAQ.isPending || updateFAQ.isPending;

    return (
        <TaxonomyDrawer
            isOpen={isOpen}
            onClose={onClose}
            title={isEditMode ? "ویرایش سوال متداول" : "افزودن سوال متداول"}
            onSubmit={handleSubmit(onSubmit) as any}
            isPending={false}
            isSubmitting={isPending || isSubmitting}
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
