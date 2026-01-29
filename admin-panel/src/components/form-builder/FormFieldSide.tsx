import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { TaxonomyDrawer } from "@/components/templates/TaxonomyDrawer";
import { FormField, FormFieldInput, FormFieldSwitch } from "@/components/shared/FormField";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/elements/Select";
import { Checkbox } from "@/components/elements/Checkbox";
import { Label } from "@/components/elements/Label";
import { Plus, Trash2, Globe, Smartphone } from "lucide-react";
import { formApi } from "@/api/form-builder/form-builder";
import { formFieldSchema, type FormFieldFormValues } from "@/components/settings/validations/settingsSchemas";
import { showSuccess, showError } from "@/core/toast";
import { Button } from "@/components/elements/Button";

interface FormFieldSideProps {
    isOpen: boolean;
    onClose: () => void;
    editId: number | null;
}

const PLATFORMS = [
    { id: 'website', label: 'وب‌سایت', icon: Globe },
    { id: 'mobile_app', label: 'اپلیکیشن', icon: Smartphone },
];

const FIELD_TYPES = [
    { value: 'text', label: 'متن' },
    { value: 'email', label: 'ایمیل' },
    { value: 'phone', label: 'شماره تلفن' },
    { value: 'textarea', label: 'متن چندخطی' },
    { value: 'select', label: 'انتخابی' },
    { value: 'radio', label: 'رادیو' },
    { value: 'checkbox', label: 'چک باکس' },
    { value: 'number', label: 'عدد' },
    { value: 'date', label: 'تاریخ' },
    { value: 'url', label: 'لینک' },
];

export function FormFieldSide({ isOpen, onClose, editId }: FormFieldSideProps) {
    const queryClient = useQueryClient();

    const { data: fieldsResponse, isLoading: isFetching } = useQuery({
        queryKey: ["form-fields"],
        queryFn: () => formApi.getFields(),
        enabled: !!editId && isOpen,
    });

    const fields = Array.isArray(fieldsResponse) ? fieldsResponse : [];
    const editData = editId ? fields.find(f => f.id === editId) : null;

    const {
        register,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { errors },
    } = useForm<FormFieldFormValues>({
        resolver: zodResolver(formFieldSchema) as any,
        defaultValues: {
            field_key: "",
            field_type: "text",
            label: "",
            placeholder: "",
            required: true,
            platforms: ["website"],
            options: [],
            order: 0,
            is_active: true,
        },
    });

    const fieldType = watch("field_type");
    const options = watch("options") || [];
    const selectedPlatforms = watch("platforms") || [];

    useEffect(() => {
        if (editId && editData) {
            reset({
                field_key: editData.field_key,
                field_type: editData.field_type,
                label: editData.label,
                placeholder: editData.placeholder || "",
                required: editData.required,
                platforms: editData.platforms,
                options: editData.options || [],
                order: editData.order,
                is_active: editData.is_active,
            });
        } else if (!editId && isOpen) {
            reset({
                field_key: "",
                field_type: "text",
                label: "",
                placeholder: "",
                required: true,
                platforms: ["website"],
                options: [],
                order: 0,
                is_active: true,
            });
        }
    }, [editData, reset, isOpen, editId]);

    const mutation = useMutation({
        mutationFn: (data: FormFieldFormValues) => {
            if (editId) {
                return formApi.updateField(editId, data as any);
            }
            return formApi.createField(data as any);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["form-fields"] });
            showSuccess(editId ? "فیلد با موفقیت ویرایش شد" : "فیلد جدید با موفقیت ایجاد شد");
            onClose();
        },
        onError: (error: any) => {
            showError(error?.response?.data?.message || "خطایی در ذخیره‌سازی رخ داد");
        },
    });

    const onSubmit = (data: FormFieldFormValues) => {
        mutation.mutate(data);
    };

    const handleAddOption = () => {
        setValue("options", [...options, { value: "", label: "" }]);
    };

    const handleRemoveOption = (index: number) => {
        setValue("options", options.filter((_, i) => i !== index));
    };

    const handleOptionChange = (index: number, field: "value" | "label", value: string) => {
        const newOptions = [...options];
        newOptions[index][field] = value;
        setValue("options", newOptions);
    };

    const togglePlatform = (platformId: string) => {
        if (selectedPlatforms.includes(platformId)) {
            setValue("platforms", selectedPlatforms.filter(p => p !== platformId));
        } else {
            setValue("platforms", [...selectedPlatforms, platformId]);
        }
    };

    return (
        <TaxonomyDrawer
            isOpen={isOpen}
            onClose={onClose}
            title={editId ? "ویرایش فیلد فرم" : "افزودن فیلد جدید"}
            formId="form-field-drawer-form"
            onSubmit={handleSubmit(onSubmit) as any}
            isPending={isFetching}
            isSubmitting={mutation.isPending}
            submitButtonText={editId ? "بروزرسانی" : "ایجاد فیلد"}
        >
            <div className="grid grid-cols-1 gap-6">
                <FormFieldInput
                    label="کلید فیلد *"
                    {...register("field_key")}
                    error={errors.field_key?.message as string}
                    placeholder="مثال: first_name"
                    disabled={!!editId}
                    dir="ltr"
                />

                <FormField
                    label="نوع فیلد *"
                    error={errors.field_type?.message as string}
                >
                    <Select value={fieldType} onValueChange={(val: any) => setValue("field_type", val)}>
                        <SelectTrigger className="h-10 rounded-xl border-muted/20">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {FIELD_TYPES.map(type => (
                                <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </FormField>

                <FormFieldInput
                    label="برچسب (Label) *"
                    {...register("label")}
                    error={errors.label?.message as string}
                    placeholder="مثال: نام و نام خانوادگی"
                />

                <FormFieldInput
                    label="متن راهنما (Placeholder)"
                    {...register("placeholder")}
                    error={errors.placeholder?.message as string}
                    placeholder="متنی که داخل فیلد نمایش داده می‌شود"
                />

                <div className="space-y-4">
                    <Label className="text-xs font-bold text-font-s opacity-80">پلتفرم‌های نمایش</Label>
                    <div className="flex gap-4">
                        {PLATFORMS.map((p) => (
                            <div key={p.id} className="flex items-center gap-2">
                                <Checkbox
                                    id={`platform-${p.id}`}
                                    checked={selectedPlatforms.includes(p.id)}
                                    onCheckedChange={() => togglePlatform(p.id)}
                                />
                                <Label htmlFor={`platform-${p.id}`} className="cursor-pointer flex items-center gap-2 text-sm">
                                    <p.icon className="h-4 w-4 text-font-s" />
                                    <span>{p.label}</span>
                                </Label>
                            </div>
                        ))}
                    </div>
                    {errors.platforms && <p className="text-xs text-red-1">{errors.platforms.message as string}</p>}
                </div>

                <div className="grid grid-cols-1 gap-4">
                    <FormFieldSwitch
                        label="این فیلد الزامی است"
                        checked={watch("required")}
                        onCheckedChange={(val) => setValue("required", val)}
                    />
                    <FormFieldSwitch
                        label="فیلد فعال باشد"
                        checked={watch("is_active")}
                        onCheckedChange={(val) => setValue("is_active", val)}
                    />
                </div>

                <FormFieldInput
                    label="ترتیب نمایش"
                    type="number"
                    {...register("order", { valueAsNumber: true })}
                    error={errors.order?.message as string}
                />

                {(fieldType === "select" || fieldType === "radio") && (
                    <div className="space-y-5 pt-6 border-t border-muted/10">
                        <div className="flex items-center justify-between">
                            <Label className="font-bold text-sm">مدیریت گزینه‌ها</Label>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleAddOption}
                                className="h-8 gap-1.5 rounded-lg border-primary/20 text-primary hover:bg-primary/5"
                            >
                                <Plus className="h-3.5 w-3.5" />
                                افزودن گزینه
                            </Button>
                        </div>

                        <div className="space-y-4">
                            {options.map((option, index) => (
                                <div key={index} className="flex gap-3 p-4 bg-bg/20 rounded-2xl border border-br/30 group transition-all hover:bg-white hover:shadow-sm">
                                    <div className="flex-1 space-y-3">
                                        <FormFieldInput
                                            placeholder="مقدار (Value)"
                                            value={option.value}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleOptionChange(index, "value", e.target.value)}
                                            className="h-9 text-xs font-mono rounded-lg"
                                            dir="ltr"
                                            label=""
                                        />
                                        <FormFieldInput
                                            placeholder="برچسب (Label)"
                                            value={option.label}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleOptionChange(index, "label", e.target.value)}
                                            className="h-9 text-xs rounded-lg"
                                            label=""
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        className="text-destructive hover:bg-destructive/10 h-9 w-9 border-destructive/10 rounded-lg shrink-0 mt-0.5"
                                        onClick={() => handleRemoveOption(index)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                            {options.length === 0 && (
                                <div className="text-center py-8 border-2 border-dashed rounded-2xl border-br/30 bg-bg/5 transition-colors">
                                    <p className="text-[11px] text-font-s font-medium italic">هیچ گزینه‌ای برای این فیلد تعریف نشده است.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </TaxonomyDrawer>
    );
}
