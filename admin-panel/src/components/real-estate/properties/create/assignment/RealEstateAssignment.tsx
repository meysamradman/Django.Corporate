
import { useState, useEffect } from "react";
import type { UseFormReturn } from "react-hook-form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/elements/Select";
import { realEstateApi } from "@/api/real-estate";
import { cn } from "@/core/utils/cn";
import { FormField } from "@/components/shared/FormField";
import type { PropertyAgent } from "@/types/real_estate/agent/realEstateAgent";
import type { PropertyFormValues } from "@/components/real-estate/validations/propertySchema";

interface RealEstateAssignmentProps {
    form?: UseFormReturn<PropertyFormValues>;
    formData?: any;
    handleInputChange?: (field: string, value: any) => void;
    editMode: boolean;
    isFormApproach: boolean;
}

export function RealEstateAssignment(props: RealEstateAssignmentProps) {
    const { form, formData, handleInputChange, editMode, isFormApproach } = props;
    const { formErrors, watch, setValue } = isFormApproach && form
        ? { formErrors: form.formState.errors, watch: form.watch, setValue: form.setValue }
        : { formErrors: (props as any).errors || {}, watch: null, setValue: null };

    const [agents, setAgents] = useState<PropertyAgent[]>([]);
    const [loadingAgents, setLoadingAgents] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const agentsResponse = await realEstateApi.getAgents({ page: 1, size: 100, is_active: true });
                setAgents(agentsResponse.data || []);
            } finally {
                setLoadingAgents(false);
            }
        };
        fetchData();
    }, []);

    const selectedAgentId = isFormApproach
        ? (watch?.("agent") ?? null)
        : (formData?.agent ?? null);

    const selectedAgent = selectedAgentId
        ? (agents || []).find((agent) => agent.id === Number(selectedAgentId))
        : null;

    const selectedAgency = selectedAgent?.agency ?? null;
    const selectedAgencyId = selectedAgency?.id ?? null;

    useEffect(() => {
        if (isFormApproach && setValue && watch) {
            const currentAgency = watch("agency") ?? null;
            if (currentAgency !== selectedAgencyId) {
                setValue("agency", selectedAgencyId, { shouldValidate: true, shouldDirty: true });
            }
            return;
        }

        if (!isFormApproach) {
            const currentAgency = formData?.agency ?? null;
            if (currentAgency !== selectedAgencyId) {
                handleInputChange?.("agency", selectedAgencyId);
            }
        }
    }, [
        selectedAgencyId,
        isFormApproach,
        setValue,
        watch,
        formData?.agency,
        handleInputChange,
    ]);

    const handleAgentChange = (value: string) => {
        if (isFormApproach && setValue) {
            setValue("agent", value && value !== "none" ? Number(value) : null, { shouldValidate: false });
        } else {
            handleInputChange?.("agent", value && value !== "none" ? Number(value) : null);
        }
    };

    return (
        <div className="grid grid-cols-1 gap-6">
            <FormField
                label="مشاور مسئول"
                error={isFormApproach ? formErrors.agent?.message : formErrors?.agent}
            >
                <Select
                    disabled={!editMode || loadingAgents}
                    value={isFormApproach ? (watch?.("agent") ? String(watch("agent")) : "none") : (formData?.agent ? String(formData.agent) : "none")}
                    onValueChange={handleAgentChange}
                >
                    <SelectTrigger className={cn((isFormApproach ? formErrors.agent?.message : formErrors?.agent) && "border-red-1")}>
                        <SelectValue placeholder={loadingAgents ? "در حال بارگذاری..." : "مشاور را انتخاب کنید"} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none">هیچکدام</SelectItem>
                        {(agents || []).map((agent) => (
                            <SelectItem key={agent.id} value={String(agent.id)}>
                                {agent.first_name} {agent.last_name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </FormField>

            <FormField
                label="آژانس املاک"
                error={isFormApproach ? formErrors.agency?.message : formErrors?.agency}
            >
                <Select
                    disabled
                    value={selectedAgencyId ? String(selectedAgencyId) : "none"}
                    onValueChange={() => undefined}
                >
                    <SelectTrigger className={cn((isFormApproach ? formErrors.agency?.message : formErrors?.agency) && "border-red-1")}>
                        <SelectValue placeholder={selectedAgent ? "آژانس مشاور" : "ابتدا مشاور را انتخاب کنید"} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none">هیچکدام</SelectItem>
                        {selectedAgency && <SelectItem value={String(selectedAgency.id)}>{selectedAgency.name}</SelectItem>}
                    </SelectContent>
                </Select>
            </FormField>
        </div>
    );
}
